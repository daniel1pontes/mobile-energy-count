# Energia em Dia

Aplicativo mobile para registrar e acompanhar o consumo doméstico de energia elétrica.

## Arquitetura local

O ambiente é executado com Docker Compose e possui três serviços:

- `mobile`: aplicativo React Native com Expo;
- `api`: API Node.js com Express;
- `db`: banco PostgreSQL.
- `mailpit`: caixa de e-mail local para recuperação de senha (interface em `http://localhost:8025`).

O aplicativo acessa a API; somente a API acessa o PostgreSQL.

## Pré-requisitos

- Docker Desktop em execução;
- Docker Compose;
- Node.js 22 ou superior, apenas se quiser executar os serviços fora do Docker.

## Como iniciar

1. Crie o arquivo de variáveis locais:

   ```bash
   cp .env.example .env
   ```

2. Ajuste a senha do PostgreSQL e o segredo JWT no arquivo `.env`.

3. Inicie todos os serviços:

   ```bash
   docker compose up --build
   ```

4. Verifique a API:

   ```bash
   curl http://localhost:3000/health
   ```

O PostgreSQL ficará disponível na porta `5433`, a API na porta `3000` e a caixa de e-mail local na porta `8025`. Dentro da rede Docker, a API continua acessando o PostgreSQL pela porta padrão `5432`. Os dados do banco são persistidos no volume Docker `postgres_data`.

Para recuperar uma senha durante o desenvolvimento, use a opção **Esqueci minha senha** no aplicativo e consulte o código recebido em `http://localhost:8025`. O Mailpit não envia mensagens para endereços reais.

## Comandos úteis

```bash
# Acompanhar logs
docker compose logs -f

# Encerrar os serviços sem apagar os dados do banco
docker compose down

# Encerrar e apagar os dados locais do banco
docker compose down -v
```

## Desenvolvimento sem Docker

```bash
# API
cd api
npm install
npm run dev

# Aplicativo, em outro terminal
cd mobile
npm install
npx expo start
```

Para utilizar um celular físico, substitua `localhost` pelo IP local do computador em `EXPO_PUBLIC_API_URL` no arquivo `.env`.

## Solução de problemas

Se o Expo Go mostrar uma falha relacionada a `ExpoSecureStore`, atualize o aplicativo Expo Go no celular e recarregue o projeto. O projeto usa o SDK 58 e a versão compatível de `expo-secure-store`. Enquanto a atualização não estiver disponível, o login continuará funcionando na sessão aberta, mas será necessário entrar novamente depois de fechar o aplicativo.
