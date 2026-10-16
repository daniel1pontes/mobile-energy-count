import bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'node:crypto';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { Pool } from 'pg';

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET ?? 'altere-este-segredo-local';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
const mailFrom = process.env.MAIL_FROM ?? 'nao-responda@energiaemdia.local';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'energia_em_dia',
  user: process.env.DB_USER ?? 'energia_user',
  password: process.env.DB_PASSWORD ?? 'energia_local',
});

// A database restart must not terminate the API process. New requests will open
// a fresh connection and the health endpoint will report the transition.
pool.on('error', (error) => {
  console.error('Conexão PostgreSQL encerrada:', error.message);
});

const app = express();

app.use(cors());
app.use(express.json());

type AuthenticatedRequest = Request & { userId?: string };

type ResidenceInput = {
  name: string;
  residentsCount: number;
  city?: string;
  state?: string;
  energyRate: number;
  goalKwh?: number;
  goalAmount?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} é obrigatório.`);
  }

  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function positiveNumber(value: unknown, field: string, allowZero = false): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  const valid = Number.isFinite(numberValue) && (allowZero ? numberValue >= 0 : numberValue > 0);

  if (!valid) {
    throw new Error(`${field} precisa ser ${allowZero ? 'maior ou igual a zero' : 'maior que zero'}.`);
  }

  return numberValue;
}

function optionalPositiveNumber(value: unknown, field: string, allowZero = false): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return positiveNumber(value, field, allowZero);
}

function parseResidence(body: unknown): ResidenceInput {
  if (!isRecord(body)) {
    throw new Error('Dados da residência inválidos.');
  }

  const state = optionalText(body.state);

  return {
    name: requiredText(body.name, 'Nome da residência'),
    residentsCount: positiveNumber(body.residentsCount, 'Quantidade de moradores'),
    city: optionalText(body.city) ?? undefined,
    state: state ? state.toUpperCase().slice(0, 2) : undefined,
    energyRate: positiveNumber(body.energyRate, 'Tarifa de energia', true),
    goalKwh: optionalPositiveNumber(body.goalKwh, 'Meta de consumo') ?? undefined,
    goalAmount: optionalPositiveNumber(body.goalAmount, 'Meta de gasto') ?? undefined,
  };
}

function createToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

function hashResetCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

async function sendResetCode(to: string, code: string): Promise<void> {
  if (!smtpHost) {
    throw new Error('O envio de e-mail não está configurado neste ambiente.');
  }

  const transport = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: false });
  await transport.sendMail({
    from: mailFrom,
    to,
    subject: 'Código para redefinir sua senha — Energia em Dia',
    text: `Use o código ${code} para redefinir sua senha no Energia em Dia. Ele expira em 15 minutos.`,
  });
}

function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    response.status(401).json({ message: 'Token de acesso ausente.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Token inválido.');
    }

    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
  }
}

async function findResidence(userId: string) {
  const result = await pool.query(
    `SELECT id, name, residents_count, city, state, energy_rate, goal_kwh, goal_amount
     FROM residences
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

app.get('/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    response.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.post('/auth/register', async (request, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de cadastro inválidos.');
    }

    const name = requiredText(request.body.name, 'Nome');
    const email = requiredText(request.body.email, 'E-mail').toLowerCase();
    const password = requiredText(request.body.password, 'Senha');

    if (!email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }

    if (password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO app_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash],
    );
    const user = result.rows[0];

    response.status(201).json({ user, token: createToken(user.id) });
  } catch (error) {
    if (isRecord(error) && error.code === '23505') {
      response.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
      return;
    }

    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível criar a conta.' });
  }
});

app.post('/auth/login', async (request, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de login inválidos.');
    }

    const email = requiredText(request.body.email, 'E-mail').toLowerCase();
    const password = requiredText(request.body.password, 'Senha');
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM app_users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      response.status(401).json({ message: 'E-mail ou senha inválidos.' });
      return;
    }

    response.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user.id),
    });
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível entrar.' });
  }
});

app.post('/auth/password-reset/request', async (request, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de recuperação inválidos.');
    }
    const email = requiredText(request.body.email, 'E-mail').toLowerCase();
    const result = await pool.query('SELECT id, email FROM app_users WHERE email = $1', [email]);
    const user = result.rows[0];

    // The response stays identical when no account exists, preventing account enumeration.
    if (user) {
      const code = String(randomInt(100000, 1000000));
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [user.id, hashResetCode(code)],
      );
      await sendResetCode(user.email, code);
    }
    response.status(204).send();
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível solicitar a recuperação.' });
  }
});

app.post('/auth/password-reset/confirm', async (request, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de recuperação inválidos.');
    }
    const email = requiredText(request.body.email, 'E-mail').toLowerCase();
    const code = requiredText(request.body.code, 'Código');
    const nextPassword = requiredText(request.body.nextPassword, 'Nova senha');
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Informe o código de seis dígitos recebido por e-mail.');
    }
    if (nextPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
    }
    const result = await pool.query(
      `SELECT password_reset_tokens.id, password_reset_tokens.user_id
       FROM password_reset_tokens
       INNER JOIN app_users ON app_users.id = password_reset_tokens.user_id
       WHERE app_users.email = $1
         AND password_reset_tokens.token_hash = $2
         AND password_reset_tokens.used_at IS NULL
         AND password_reset_tokens.expires_at > NOW()
       ORDER BY password_reset_tokens.created_at DESC
       LIMIT 1`,
      [email, hashResetCode(code)],
    );
    const reset = result.rows[0];
    if (!reset) {
      response.status(400).json({ message: 'O código é inválido ou expirou.' });
      return;
    }
    await pool.query('UPDATE app_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [await bcrypt.hash(nextPassword, 12), reset.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [reset.id]);
    response.status(204).send();
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível redefinir a senha.' });
  }
});

app.get('/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  const result = await pool.query(
    'SELECT id, name, email FROM app_users WHERE id = $1',
    [request.userId],
  );
  const user = result.rows[0];
  if (!user) {
    response.status(404).json({ message: 'Usuário não encontrado.' });
    return;
  }
  response.json({ user });
});

app.put('/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de perfil inválidos.');
    }
    const name = requiredText(request.body.name, 'Nome');
    const email = requiredText(request.body.email, 'E-mail').toLowerCase();
    if (!email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }
    const result = await pool.query(
      `UPDATE app_users
       SET name = $1, email = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email`,
      [name, email, request.userId],
    );
    response.json({ user: result.rows[0] });
  } catch (error) {
    if (isRecord(error) && error.code === '23505') {
      response.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
      return;
    }
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.' });
  }
});

app.put('/me/password', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados de senha inválidos.');
    }
    const currentPassword = requiredText(request.body.currentPassword, 'Senha atual');
    const nextPassword = requiredText(request.body.nextPassword, 'Nova senha');
    if (nextPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
    }
    const result = await pool.query('SELECT password_hash FROM app_users WHERE id = $1', [request.userId]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      response.status(401).json({ message: 'A senha atual está incorreta.' });
      return;
    }
    await pool.query(
      'UPDATE app_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [await bcrypt.hash(nextPassword, 12), request.userId],
    );
    response.status(204).send();
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar a senha.' });
  }
});

app.get('/residence', requireAuth, async (request: AuthenticatedRequest, response) => {
  const residence = await findResidence(request.userId!);
  response.json({ residence });
});

app.put('/residence', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    const residence = parseResidence(request.body);
    const result = await pool.query(
      `INSERT INTO residences (user_id, name, residents_count, city, state, energy_rate, goal_kwh, goal_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name,
         residents_count = EXCLUDED.residents_count,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         energy_rate = EXCLUDED.energy_rate,
         goal_kwh = EXCLUDED.goal_kwh,
         goal_amount = EXCLUDED.goal_amount,
         updated_at = NOW()
       RETURNING id, name, residents_count, city, state, energy_rate, goal_kwh, goal_amount`,
      [
        request.userId,
        residence.name,
        residence.residentsCount,
        residence.city ?? null,
        residence.state ?? null,
        residence.energyRate,
        residence.goalKwh ?? null,
        residence.goalAmount ?? null,
      ],
    );

    response.json({ residence: result.rows[0] });
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível salvar a residência.' });
  }
});

app.get('/bills', requireAuth, async (request: AuthenticatedRequest, response) => {
  const residence = await findResidence(request.userId!);
  if (!residence) {
    response.json({ bills: [] });
    return;
  }

  const result = await pool.query(
    `SELECT id, reference_month, reference_year, consumption_kwh, total_amount, due_date, notes
     FROM energy_bills
     WHERE residence_id = $1
     ORDER BY reference_year DESC, reference_month DESC`,
    [residence.id],
  );
  response.json({ bills: result.rows });
});

app.post('/bills', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    const residence = await findResidence(request.userId!);
    if (!residence) {
      response.status(409).json({ message: 'Cadastre sua residência antes de adicionar uma conta.' });
      return;
    }
    if (!isRecord(request.body)) {
      throw new Error('Dados da conta inválidos.');
    }

    const month = positiveNumber(request.body.referenceMonth, 'Mês de referência');
    const year = positiveNumber(request.body.referenceYear, 'Ano de referência');
    if (month > 12 || year < 2020) {
      throw new Error('Mês ou ano de referência inválido.');
    }

    const result = await pool.query(
      `INSERT INTO energy_bills (residence_id, reference_month, reference_year, consumption_kwh, total_amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, reference_month, reference_year, consumption_kwh, total_amount, due_date, notes`,
      [
        residence.id,
        month,
        year,
        positiveNumber(request.body.consumptionKwh, 'Consumo'),
        positiveNumber(request.body.totalAmount, 'Valor da conta', true),
        optionalText(request.body.dueDate),
        optionalText(request.body.notes),
      ],
    );
    response.status(201).json({ bill: result.rows[0] });
  } catch (error) {
    if (isRecord(error) && error.code === '23505') {
      response.status(409).json({ message: 'Já existe uma conta cadastrada para este mês.' });
      return;
    }
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível salvar a conta.' });
  }
});

app.put('/bills/:id', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados da conta inválidos.');
    }
    const month = positiveNumber(request.body.referenceMonth, 'Mês de referência');
    const year = positiveNumber(request.body.referenceYear, 'Ano de referência');
    if (month > 12 || year < 2020) {
      throw new Error('Mês ou ano de referência inválido.');
    }

    const result = await pool.query(
      `UPDATE energy_bills
       SET reference_month = $1, reference_year = $2, consumption_kwh = $3, total_amount = $4,
           due_date = $5, notes = $6, updated_at = NOW()
       WHERE id = $7
         AND residence_id IN (SELECT id FROM residences WHERE user_id = $8)
       RETURNING id, reference_month, reference_year, consumption_kwh, total_amount, due_date, notes`,
      [
        month,
        year,
        positiveNumber(request.body.consumptionKwh, 'Consumo'),
        positiveNumber(request.body.totalAmount, 'Valor da conta', true),
        optionalText(request.body.dueDate),
        optionalText(request.body.notes),
        request.params.id,
        request.userId,
      ],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ message: 'Conta não encontrada.' });
      return;
    }
    response.json({ bill: result.rows[0] });
  } catch (error) {
    if (isRecord(error) && error.code === '23505') {
      response.status(409).json({ message: 'Já existe uma conta cadastrada para este mês.' });
      return;
    }
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar a conta.' });
  }
});

app.delete('/bills/:id', requireAuth, async (request: AuthenticatedRequest, response) => {
  const result = await pool.query(
    `DELETE FROM energy_bills
     WHERE id = $1
       AND residence_id IN (SELECT id FROM residences WHERE user_id = $2)
     RETURNING id`,
    [request.params.id, request.userId],
  );

  if (result.rowCount === 0) {
    response.status(404).json({ message: 'Conta não encontrada.' });
    return;
  }

  response.status(204).send();
});

app.get('/appliances', requireAuth, async (request: AuthenticatedRequest, response) => {
  const residence = await findResidence(request.userId!);
  if (!residence) {
    response.json({ appliances: [] });
    return;
  }
  const result = await pool.query(
    `SELECT appliances.id, appliances.name, appliances.power_watts, appliances.quantity,
      appliances.daily_usage_hours, appliances.monthly_usage_days,
      ROUND((appliances.power_watts / 1000) * appliances.quantity * appliances.daily_usage_hours * appliances.monthly_usage_days, 2) AS estimated_kwh,
      ROUND((appliances.power_watts / 1000) * appliances.quantity * appliances.daily_usage_hours * appliances.monthly_usage_days * residences.energy_rate, 2) AS estimated_amount
     FROM appliances
     INNER JOIN residences ON residences.id = appliances.residence_id
     WHERE appliances.residence_id = $1
     ORDER BY appliances.created_at DESC`,
    [residence.id],
  );
  response.json({ appliances: result.rows });
});

app.post('/appliances', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    const residence = await findResidence(request.userId!);
    if (!residence) {
      response.status(409).json({ message: 'Cadastre sua residência antes de adicionar aparelhos.' });
      return;
    }
    if (!isRecord(request.body)) {
      throw new Error('Dados do aparelho inválidos.');
    }

    const result = await pool.query(
      `INSERT INTO appliances (residence_id, name, power_watts, quantity, daily_usage_hours, monthly_usage_days)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, power_watts, quantity, daily_usage_hours, monthly_usage_days`,
      [
        residence.id,
        requiredText(request.body.name, 'Nome do aparelho'),
        positiveNumber(request.body.powerWatts, 'Potência'),
        positiveNumber(request.body.quantity, 'Quantidade'),
        positiveNumber(request.body.dailyUsageHours, 'Horas de uso', true),
        positiveNumber(request.body.monthlyUsageDays, 'Dias de uso'),
      ],
    );
    response.status(201).json({ appliance: result.rows[0] });
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível salvar o aparelho.' });
  }
});

app.put('/appliances/:id', requireAuth, async (request: AuthenticatedRequest, response) => {
  try {
    if (!isRecord(request.body)) {
      throw new Error('Dados do aparelho inválidos.');
    }
    const result = await pool.query(
      `UPDATE appliances
       SET name = $1, power_watts = $2, quantity = $3, daily_usage_hours = $4, monthly_usage_days = $5, updated_at = NOW()
       WHERE id = $6
         AND residence_id IN (SELECT id FROM residences WHERE user_id = $7)
       RETURNING id, name, power_watts, quantity, daily_usage_hours, monthly_usage_days`,
      [
        requiredText(request.body.name, 'Nome do aparelho'),
        positiveNumber(request.body.powerWatts, 'Potência'),
        positiveNumber(request.body.quantity, 'Quantidade'),
        positiveNumber(request.body.dailyUsageHours, 'Horas de uso', true),
        positiveNumber(request.body.monthlyUsageDays, 'Dias de uso'),
        request.params.id,
        request.userId,
      ],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ message: 'Aparelho não encontrado.' });
      return;
    }
    response.json({ appliance: result.rows[0] });
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar o aparelho.' });
  }
});

app.delete('/appliances/:id', requireAuth, async (request: AuthenticatedRequest, response) => {
  const result = await pool.query(
    `DELETE FROM appliances
     WHERE id = $1
       AND residence_id IN (SELECT id FROM residences WHERE user_id = $2)
     RETURNING id`,
    [request.params.id, request.userId],
  );

  if (result.rowCount === 0) {
    response.status(404).json({ message: 'Aparelho não encontrado.' });
    return;
  }

  response.status(204).send();
});

app.get('/dashboard', requireAuth, async (request: AuthenticatedRequest, response) => {
  const residence = await findResidence(request.userId!);
  if (!residence) {
    response.json({ residence: null, currentBill: null, previousBill: null, history: [], applianceEstimateKwh: 0, topAppliance: null, tips: [] });
    return;
  }

  const [bills, appliances, topAppliance] = await Promise.all([
    pool.query(
      `SELECT reference_month, reference_year, consumption_kwh, total_amount
       FROM energy_bills
       WHERE residence_id = $1
       ORDER BY reference_year DESC, reference_month DESC
       LIMIT 6`,
      [residence.id],
    ),
    pool.query(
      `SELECT COALESCE(SUM((power_watts / 1000) * quantity * daily_usage_hours * monthly_usage_days), 0) AS estimated_kwh
       FROM appliances
       WHERE residence_id = $1`,
      [residence.id],
    ),
    pool.query(
      `SELECT appliances.name, appliances.power_watts, appliances.quantity, appliances.monthly_usage_days,
        ROUND((appliances.power_watts / 1000) * appliances.quantity * appliances.daily_usage_hours * appliances.monthly_usage_days, 2) AS estimated_kwh,
        ROUND((appliances.power_watts / 1000) * appliances.quantity * appliances.daily_usage_hours * appliances.monthly_usage_days * residences.energy_rate, 2) AS estimated_amount,
        ROUND((appliances.power_watts / 1000) * appliances.quantity * appliances.monthly_usage_days * residences.energy_rate, 2) AS one_hour_savings
       FROM appliances
       INNER JOIN residences ON residences.id = appliances.residence_id
       WHERE appliances.residence_id = $1
       ORDER BY estimated_kwh DESC
       LIMIT 1`,
      [residence.id],
    ),
  ]);

  const history = bills.rows;
  const [currentBill, previousBill] = history;
  const applianceEstimateKwh = Number(appliances.rows[0].estimated_kwh);
  const highestConsumptionAppliance = topAppliance.rows[0] ?? null;
  const tips: string[] = [];

  if (currentBill && residence.goal_kwh && Number(currentBill.consumption_kwh) > Number(residence.goal_kwh)) {
    tips.push('Seu consumo ultrapassou a meta mensal. Verifique os aparelhos com maior tempo de uso.');
  }
  if (currentBill && residence.goal_amount && Number(currentBill.total_amount) > Number(residence.goal_amount)) {
    tips.push('O valor da sua conta ultrapassou a meta de gasto definida para este mês.');
  }
  if (currentBill && previousBill && Number(currentBill.consumption_kwh) > Number(previousBill.consumption_kwh)) {
    tips.push('Seu consumo aumentou em relação ao mês anterior.');
  }
  if (highestConsumptionAppliance) {
    tips.push(`${highestConsumptionAppliance.name} é o aparelho com maior consumo estimado: ${Number(highestConsumptionAppliance.estimated_kwh).toFixed(1)} kWh por mês.`);
    const savings = Number(highestConsumptionAppliance.one_hour_savings);
    if (savings > 0) {
      tips.push(`Reduzir uma hora de uso diário de ${highestConsumptionAppliance.name} pode economizar aproximadamente R$ ${savings.toFixed(2).replace('.', ',')} por mês.`);
    }
  } else if (applianceEstimateKwh > 0) {
    tips.push(`Os aparelhos cadastrados somam aproximadamente ${applianceEstimateKwh.toFixed(1)} kWh por mês.`);
  }

  response.json({
    residence,
    currentBill: currentBill ?? null,
    previousBill: previousBill ?? null,
    history,
    applianceEstimateKwh,
    topAppliance: highestConsumptionAppliance,
    tips,
  });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  response.status(500).json({ message: error.message || 'Erro interno do servidor.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API disponível em http://0.0.0.0:${port}`);
});
