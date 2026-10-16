# Planejamento do MVP — Aplicativo de acompanhamento de consumo energético

## 1. Nome provisório

**Energia em Dia**

O nome é provisório e serve para identificar o projeto durante o desenvolvimento.

## 2. Visão geral

O **Energia em Dia** será um aplicativo para acompanhamento do consumo doméstico de energia elétrica. Nele, o usuário poderá registrar mensalmente os dados da conta de luz, acompanhar a evolução do consumo, definir metas de economia, estimar o gasto dos principais aparelhos e receber recomendações simples.

No MVP, as informações serão registradas manualmente. Não haverá integração com concessionárias, medidores inteligentes ou dispositivos IoT.

## 3. Problema

Muitas pessoas recebem a conta de energia, pagam o valor e não acompanham:

- Quantos kWh foram consumidos;
- Se o consumo aumentou ou diminuiu;
- Quais aparelhos podem estar consumindo mais;
- Se estão próximas de uma meta de economia;
- Quanto poderiam economizar mudando alguns hábitos.

A aplicação organizará essas informações de maneira visual e fácil de entender.

## 4. Solução proposta

O aplicativo permitirá que o usuário:

1. Cadastre sua residência e a tarifa de energia;
2. Registre os dados das contas de luz;
3. Acompanhe o histórico de consumo e gasto;
4. Compare o consumo entre meses;
5. Defina uma meta mensal;
6. Cadastre os principais aparelhos da residência;
7. Consulte o consumo estimado dos aparelhos;
8. Receba dicas simples de economia.

## 5. Público-alvo

O público inicial será formado por:

- Moradores de casas e apartamentos;
- Pessoas preocupadas com o valor da conta de luz;
- Famílias que desejam reduzir o consumo;
- Pessoas interessadas em sustentabilidade;
- Usuários sem conhecimento técnico sobre energia.

## 6. Objetivo do MVP

O objetivo da primeira versão é verificar se os usuários conseguem registrar, compreender e comparar o próprio consumo de energia.

O MVP estará completo quando o usuário conseguir:

1. Criar uma conta;
2. Configurar sua residência;
3. Definir uma meta de consumo;
4. Registrar contas de energia;
5. Visualizar o histórico mensal;
6. Cadastrar aparelhos;
7. Estimar o consumo desses aparelhos;
8. Receber dicas baseadas nos dados cadastrados.

## 7. Escopo do MVP

### 7.1. Cadastro e acesso

O usuário poderá:

- Criar uma conta com nome, e-mail e senha;
- Entrar na aplicação;
- Sair da conta;
- Recuperar a senha por e-mail.

### 7.2. Configuração da residência

O usuário informará:

- Nome da residência, como `Minha casa`;
- Quantidade de moradores;
- Cidade e estado, opcionalmente;
- Valor da tarifa de energia em R$/kWh;
- Meta mensal de consumo em kWh;
- Meta mensal de gasto em reais.

No MVP, cada usuário terá apenas uma residência.

### 7.3. Registro das contas de energia

A cada mês, o usuário informará:

- Mês e ano da conta;
- Consumo em kWh;
- Valor total da conta;
- Data de vencimento, opcionalmente;
- Observação, opcionalmente.

Exemplo:

```text
Mês: setembro de 2026
Consumo: 245 kWh
Valor: R$ 237,50
```

### 7.4. Dashboard

O dashboard será a tela principal e apresentará:

- Consumo do mês atual;
- Valor da conta atual;
- Meta mensal;
- Percentual da meta utilizado;
- Diferença em relação ao mês anterior;
- Histórico dos últimos seis meses;
- Aviso indicando aumento ou redução do consumo;
- Atalho para registrar uma nova conta.

Exemplo:

```text
Consumo atual: 245 kWh
Meta: 220 kWh
Resultado: 25 kWh acima da meta
Variação: aumento de 8% em relação ao mês anterior
```

### 7.5. Cadastro de aparelhos

O usuário poderá cadastrar aparelhos para descobrir o consumo estimado de cada um.

Informações necessárias:

- Nome do aparelho;
- Potência em watts;
- Quantidade;
- Horas de uso por dia;
- Dias de uso por mês.

Exemplo:

```text
Aparelho: ar-condicionado
Potência: 1.000 W
Quantidade: 1
Uso diário: 6 horas
Dias de uso: 20 dias
```

### 7.6. Estimativa do consumo dos aparelhos

A fórmula utilizada será:

```text
Consumo mensal =
(potência em watts ÷ 1.000)
× horas de uso por dia
× dias de uso
× quantidade
```

Exemplo para o ar-condicionado:

```text
(1.000 ÷ 1.000) × 6 × 20 × 1
= 120 kWh por mês
```

Se a tarifa cadastrada for R$ 0,95 por kWh:

```text
120 × 0,95 = R$ 114,00 por mês
```

O aplicativo informará que esses valores são estimativas e que o consumo real pode variar.

### 7.7. Dicas de economia

O sistema utilizará regras simples, sem inteligência artificial no MVP.

Exemplos:

- “Seu consumo aumentou 8% em relação ao mês anterior.”;
- “Você ultrapassou sua meta em 25 kWh.”;
- “O ar-condicionado é o aparelho com maior consumo estimado.”;
- “Reduzir uma hora de uso diário desse aparelho pode gerar uma economia aproximada de R$ 19,00 por mês.”;
- “Evite utilizar o chuveiro elétrico por períodos prolongados.”

## 8. Funcionalidades fora do MVP

Para manter o projeto viável, a primeira versão não terá:

- Integração com concessionárias;
- Leitura automática do medidor;
- Integração com aparelhos inteligentes;
- Upload e leitura da conta por fotografia;
- Inteligência artificial;
- Previsão avançada de consumo;
- Comparação com residências de outros usuários;
- Ranking de economia;
- Sistema de pontos ou recompensas;
- Mais de uma residência por usuário;
- Compartilhamento da residência com familiares;
- Cálculo detalhado dos impostos da conta;
- Painel administrativo.

Essas funcionalidades poderão ser desenvolvidas depois que o MVP for validado.

## 9. Telas da aplicação

### 9.1. Apresentação

Será exibida quando o usuário abrir o aplicativo pela primeira vez.

Elementos:

- Nome e logotipo;
- Pequena explicação sobre o aplicativo;
- Botão `Criar conta`;
- Botão `Entrar`.

### 9.2. Criar conta

Campos:

- Nome;
- E-mail;
- Senha;
- Confirmação da senha.

Ação principal:

- Botão `Criar minha conta`.

### 9.3. Configurar residência

Campos:

- Nome da residência;
- Número de moradores;
- Tarifa de energia;
- Meta de consumo;
- Meta de gasto.

Ação principal:

- Botão `Salvar e continuar`.

### 9.4. Dashboard

Elementos:

- Saudação ao usuário;
- Cartão com consumo atual;
- Cartão com valor da conta;
- Indicador da meta;
- Comparação com o mês anterior;
- Gráfico do histórico;
- Dica principal;
- Botão para registrar uma conta.

### 9.5. Registrar conta

Campos:

- Mês e ano;
- Consumo em kWh;
- Valor pago;
- Data de vencimento;
- Observação.

Ação principal:

- Botão `Salvar conta`.

### 9.6. Histórico

Elementos:

- Lista das contas registradas;
- Consumo e valor de cada mês;
- Ação para editar;
- Ação para excluir;
- Gráfico com a evolução do consumo.

### 9.7. Aparelhos

Elementos:

- Lista de aparelhos cadastrados;
- Consumo estimado de cada aparelho;
- Custo mensal estimado;
- Botão `Adicionar aparelho`.

### 9.8. Cadastrar aparelho

Campos:

- Nome;
- Potência;
- Quantidade;
- Horas de uso por dia;
- Dias de uso por mês.

O sistema calculará automaticamente:

- Consumo mensal estimado;
- Custo mensal estimado.

### 9.9. Dicas

Elementos:

- Dicas personalizadas;
- Avisos de aumento de consumo;
- Possíveis formas de economia;
- Informações sobre consumo consciente.

### 9.10. Perfil e configurações

O usuário poderá editar:

- Nome;
- Tarifa de energia;
- Número de moradores;
- Meta mensal;
- Senha.

## 10. Fluxo principal

```text
Abrir o aplicativo
        ↓
Criar uma conta
        ↓
Configurar a residência
        ↓
Definir uma meta mensal
        ↓
Registrar a primeira conta de energia
        ↓
Visualizar o dashboard
        ↓
Cadastrar os aparelhos
        ↓
Consultar estimativas e dicas
        ↓
Registrar uma nova conta no mês seguinte
        ↓
Comparar os resultados
```

## 11. Regras de negócio

### 11.1. Registro mensal

- Só poderá existir uma conta por mês para cada residência;
- O consumo deverá ser maior que zero;
- O valor da conta não poderá ser negativo;
- O usuário poderá editar ou excluir registros;
- O histórico será ordenado do mês mais recente para o mais antigo.

### 11.2. Comparação do consumo

A variação será calculada assim:

```text
Variação percentual =
((consumo atual - consumo anterior) ÷ consumo anterior) × 100
```

Exemplo:

```text
Mês anterior: 200 kWh
Mês atual: 220 kWh

((220 - 200) ÷ 200) × 100 = 10%
```

A aplicação mostrará:

```text
Seu consumo aumentou 10%.
```

### 11.3. Controle da meta

- Abaixo de 80% da meta: situação confortável;
- Entre 80% e 100%: atenção;
- Acima de 100%: meta ultrapassada.

Sugestão visual:

- Verde: dentro da meta;
- Amarelo: próximo da meta;
- Vermelho: meta ultrapassada.

### 11.4. Estimativas dos aparelhos

- Todos os cálculos serão aproximados;
- A tarifa utilizada será a cadastrada pelo usuário;
- Alterações na tarifa atualizarão as estimativas;
- A soma dos aparelhos não precisa ser igual ao valor da conta real.

## 12. Estrutura inicial do banco de dados

### 12.1. Usuários

| Campo | Descrição |
|---|---|
| `id` | Identificador do usuário |
| `name` | Nome do usuário |
| `email` | E-mail do usuário |
| `created_at` | Data de criação |

A senha será gerenciada pelo serviço de autenticação e não ficará disponível em texto simples.

### 12.2. Residências

| Campo | Descrição |
|---|---|
| `id` | Identificador da residência |
| `user_id` | Usuário responsável |
| `name` | Nome da residência |
| `residents_count` | Quantidade de moradores |
| `city` | Cidade |
| `state` | Estado |
| `energy_rate` | Tarifa por kWh |
| `goal_kwh` | Meta de consumo |
| `goal_amount` | Meta de gasto |

### 12.3. Contas de energia

| Campo | Descrição |
|---|---|
| `id` | Identificador da conta |
| `residence_id` | Residência relacionada |
| `reference_month` | Mês de referência |
| `reference_year` | Ano de referência |
| `consumption_kwh` | Consumo em kWh |
| `total_amount` | Valor total |
| `due_date` | Data de vencimento |
| `notes` | Observação |

### 12.4. Aparelhos

| Campo | Descrição |
|---|---|
| `id` | Identificador do aparelho |
| `residence_id` | Residência relacionada |
| `name` | Nome do aparelho |
| `power_watts` | Potência em watts |
| `quantity` | Quantidade |
| `daily_usage_hours` | Horas de uso diário |
| `monthly_usage_days` | Dias de uso mensal |

As estimativas poderão ser calculadas no momento da consulta, sem precisar armazená-las no banco.

## 13. Tecnologias sugeridas

- **Aplicativo:** React Native com Expo;
- **Linguagem:** TypeScript;
- **Backend:** Node.js com Express;
- **Banco de dados:** PostgreSQL executado localmente em contêiner Docker;
- **Autenticação:** JWT e senhas protegidas com hash;
- **Gráficos:** React Native Chart Kit;
- **Protótipos:** Figma;
- **Ambiente local:** Docker e Docker Compose;
- **Controle de versão:** Git e GitHub.

O PostgreSQL será o único banco de dados do projeto. Ele será executado pelo Docker tanto no desenvolvimento local quanto nos ambientes que usarem o Docker Compose. Não será necessário instalar o banco diretamente no computador.

## 14. Ambiente local com Docker

### 14.1. Objetivo

Criar um ambiente padronizado para que qualquer pessoa da equipe consiga executar a aplicação localmente sem precisar instalar e configurar manualmente todas as dependências.

O ambiente deverá permitir que o desenvolvedor:

1. Baixe o projeto;
2. Configure as variáveis de ambiente;
3. Execute um único fluxo de inicialização;
4. Acesse a aplicação e os serviços locais;
5. Encerre o ambiente sem perder os dados do banco.

### 14.2. Serviços executados em contêineres

O ambiente local será dividido nos seguintes componentes:

| Componente | Responsabilidade |
|---|---|
| Aplicação | Executar o servidor de desenvolvimento do React Native com Expo |
| API | Executar a lógica de negócio, autenticação e acesso aos dados |
| Banco de dados PostgreSQL | Executar em contêiner Docker e armazenar usuários, residências, contas e aparelhos |

Tanto a aplicação quanto a API e o PostgreSQL serão executados em contêineres. A aplicação se comunicará com a API HTTP; somente a API poderá se conectar diretamente ao PostgreSQL.

O banco PostgreSQL não será instalado diretamente no sistema operacional e o ambiente local não dependerá de um banco hospedado na internet.

### 14.3. Visão da arquitetura local

```text
Celular, emulador ou navegador
              ↓
     Contêiner da aplicação
        React Native + Expo
              ↓
        Contêiner da API
       Node.js + Express
              ↓
       Contêiner PostgreSQL
```

### 14.4. Arquivos necessários

Deverão ser criados:

- `mobile/Dockerfile`: define a imagem da aplicação Expo;
- `api/Dockerfile`: define a imagem da API;
- `compose.yaml`: orquestra aplicação, API e PostgreSQL;
- `.dockerignore`: impede o envio de arquivos desnecessários para a imagem;
- `.env.example`: documenta as variáveis necessárias sem expor credenciais;
- `database/init/`: guarda o script de criação inicial das tabelas;
- `database/seed/`: contém dados opcionais para desenvolvimento e demonstração;
- `README.md`: explica como iniciar, acessar e encerrar o ambiente.

As versões das imagens e dependências deverão ser fixadas para reduzir diferenças entre os computadores da equipe.

### 14.5. Variáveis de ambiente

O projeto deverá fornecer um arquivo `.env.example` com nomes como:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
POSTGRES_DB=energia_em_dia
POSTGRES_USER=energia_user
POSTGRES_PASSWORD=defina_uma_senha_local
JWT_SECRET=defina_um_segredo_local
```

O arquivo `.env` real não deverá ser enviado ao repositório.

Quando a aplicação for acessada por um celular físico, `localhost` não apontará para o computador do desenvolvedor. Nesse caso, será necessário usar o endereço IP local da máquina, por exemplo:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

O celular e o computador precisarão estar na mesma rede.

### 14.6. Persistência de dados

O PostgreSQL será executado em um contêiner Docker próprio. Seus dados deverão permanecer disponíveis mesmo quando os outros contêineres forem encerrados ou recriados.

Para isso:

- O contêiner PostgreSQL utilizará um volume Docker persistente;
- O ciclo normal de parada dos serviços não apagará o volume do banco;
- A exclusão dos volumes será feita apenas por um comando explícito de limpeza;
- A estrutura do banco será recriada por migrations versionadas;
- Dados opcionais para testes poderão ser recriados pelos scripts em `database/seed/`;
- Credenciais do banco ficarão somente nas variáveis de ambiente locais.

### 14.7. Inicialização do banco

Ao iniciar o ambiente, a sequência esperada será:

1. Criar a rede local dos contêineres;
2. Iniciar o contêiner PostgreSQL;
3. Aguardar o healthcheck confirmar que o banco aceita conexões;
4. Executar o script inicial de criação das tabelas;
5. Carregar os dados de demonstração, quando solicitado;
6. Iniciar a API;
7. Iniciar a aplicação Expo;
8. Liberar a aplicação somente quando o backend estiver saudável.

Essa ordem evita que a aplicação tente acessar o banco antes que ele esteja pronto.

### 14.8. Orquestração

O fluxo de desenvolvimento deverá ser simples e documentado. A equipe poderá disponibilizar scripts para executar as operações abaixo:

```bash
# Construir e iniciar aplicação, API e banco
docker compose up --build

# Acompanhar os logs
docker compose logs -f

# Encerrar todos os serviços sem apagar os dados do banco
docker compose down
```

Esses comandos poderão ser agrupados futuramente em scripts como `npm run dev:up` e `npm run dev:down`, facilitando ainda mais o uso.

O `docker compose up` será responsável por iniciar os três contêineres e aguardar a disponibilidade do PostgreSQL antes de subir a API. Dessa forma, haverá apenas um comando de inicialização para toda a equipe.

### 14.9. Cuidados de rede

- As portas do Expo e da API deverão estar disponíveis para o computador hospedeiro;
- A aplicação não poderá depender de endereços internos fixos dos contêineres;
- O endereço da API será recebido por variável de ambiente;
- O acesso por celular físico deverá ser testado na rede local;
- Os serviços deverão possuir verificações de saúde antes de serem considerados disponíveis;
- A porta do PostgreSQL deverá ficar restrita ao ambiente de desenvolvimento;
- A aplicação deverá acessar os dados pela API, e não por conexão direta ao banco.

### 14.10. Etapas de implementação do ambiente

1. Instalar e validar Docker e Docker Compose;
2. Criar o `Dockerfile` da aplicação;
3. Criar o `.dockerignore`;
4. Criar o `compose.yaml`;
5. Criar a API e sua configuração de conexão com o PostgreSQL;
6. Criar os scripts iniciais de banco;
7. Configurar as variáveis de ambiente;
8. Configurar o volume persistente do PostgreSQL;
9. Configurar portas, rede e healthchecks;
10. Criar um script para iniciar aplicação, backend e banco;
11. Iniciar todos os serviços;
12. Testar cadastro, login e gravação de dados;
13. Reiniciar os contêineres e confirmar que os dados permanecem salvos;
14. Testar o acesso pelo navegador, emulador e celular físico;
15. Documentar os comandos no `README.md`.

### 14.11. Critérios de conclusão da etapa Docker

A etapa estará concluída quando:

- Uma pessoa conseguir iniciar o projeto seguindo apenas o `README.md`;
- A aplicação for construída e iniciada sem configuração manual dentro do contêiner;
- O PostgreSQL estiver sendo executado em um contêiner Docker, sem instalação local;
- O contêiner do banco possuir healthcheck e volume persistente;
- A aplicação conseguir se conectar ao backend local;
- Cadastro e login funcionarem no ambiente local;
- Um registro criado pela aplicação aparecer no banco;
- Os dados continuarem disponíveis após reiniciar os contêineres;
- As variáveis sensíveis não estiverem versionadas;
- Os logs dos serviços puderem ser consultados facilmente;
- O ambiente puder ser encerrado sem processos ou contêineres abandonados.

## 15. Cronograma sugerido

### Semana 1 — Planejamento e design

Atividades:

- Definir identidade visual básica;
- Desenhar o fluxo do usuário;
- Criar os protótipos das telas;
- Definir as tabelas do banco;
- Preparar o projeto React Native.

**Entrega:** protótipo das telas e projeto inicial funcionando.

### Semana 2 — Ambiente local com Docker

Atividades:

- Criar o `Dockerfile` e o `.dockerignore`;
- Criar o `compose.yaml`;
- Criar o contêiner PostgreSQL e a API;
- Criar os scripts iniciais do banco;
- Configurar rede, portas, healthchecks e volume persistente do banco;
- Criar o `.env.example`;
- Documentar os comandos de execução;
- Validar o acesso por navegador, emulador e celular físico.

**Entrega:** aplicação, backend e banco PostgreSQL iniciando de maneira documentada com Docker.

### Semana 3 — Cadastro e configurações

Atividades:

- Criar cadastro e login;
- Implementar recuperação de senha;
- Criar configuração da residência;
- Criar edição do perfil;
- Conectar o aplicativo ao banco.

**Entrega:** usuário consegue criar uma conta e configurar sua residência.

### Semana 4 — Contas e histórico

Atividades:

- Criar formulário de registro de contas;
- Criar listagem do histórico;
- Permitir edição;
- Permitir exclusão;
- Validar os dados.

**Entrega:** usuário consegue gerenciar suas contas mensais.

### Semana 5 — Dashboard

Atividades:

- Exibir o consumo atual;
- Exibir o valor da conta;
- Comparar os meses;
- Implementar o indicador da meta;
- Criar o gráfico do histórico.

**Entrega:** dashboard funcional com os dados do usuário.

### Semana 6 — Aparelhos e recomendações

Atividades:

- Criar cadastro de aparelhos;
- Implementar cálculo de consumo;
- Implementar cálculo de custo;
- Criar regras para recomendações;
- Criar tela de dicas.

**Entrega:** estimativas e recomendações funcionando.

### Semana 7 — Testes e ajustes

Atividades:

- Testar os principais fluxos;
- Corrigir erros;
- Melhorar mensagens;
- Ajustar visual e acessibilidade;
- Preparar uma versão demonstrável.

**Entrega:** MVP pronto para apresentação e testes com usuários.

## 16. Priorização das funcionalidades

### Obrigatórias

- Cadastro e login;
- Configuração da residência;
- Registro de contas;
- Histórico;
- Dashboard;
- Meta mensal;
- Cadastro de aparelhos;
- Estimativa de consumo;
- Ambiente local executável com Docker;
- Banco PostgreSQL executado em contêiner com persistência de dados.

### Desejáveis

- Gráfico do histórico;
- Dicas personalizadas;
- Recuperação de senha;
- Observação na conta.

### Somente se houver tempo

- Tema escuro;
- Exportação de relatório;
- Notificações;
- Filtro por período;
- Comparação anual.

## 17. Critérios de conclusão

O MVP será considerado concluído quando:

- O usuário conseguir criar uma conta e entrar;
- Os dados de cada usuário estiverem protegidos;
- A residência puder ser configurada;
- Uma conta mensal puder ser cadastrada, editada e excluída;
- O dashboard mostrar consumo, gasto e meta;
- A comparação entre dois meses estiver correta;
- O gráfico exibir o histórico cadastrado;
- Os aparelhos puderem ser cadastrados;
- O consumo dos aparelhos for calculado corretamente;
- Pelo menos uma recomendação aparecer de acordo com os dados;
- O ambiente completo puder ser iniciado seguindo o `README.md`;
- O PostgreSQL estiver sendo executado pelo Docker;
- Os dados locais permanecerem disponíveis após reiniciar os contêineres;
- O aplicativo não apresentar erros nos fluxos principais.

## 18. Roteiro para demonstração

Durante a apresentação do projeto:

1. Criar a usuária `Maria`;
2. Configurar uma residência com três moradores;
3. Informar uma tarifa de R$ 0,95 por kWh;
4. Definir uma meta de 220 kWh;
5. Registrar agosto com 210 kWh;
6. Registrar setembro com 245 kWh;
7. Mostrar o aumento no dashboard;
8. Cadastrar um ar-condicionado;
9. Exibir o consumo estimado do aparelho;
10. Mostrar uma recomendação de economia.

Esse cenário demonstra praticamente todo o valor do MVP em poucos minutos.

## 19. Resultado esperado

Ao final do MVP, a aplicação não controlará o consumo em tempo real. Ela funcionará como uma ferramenta de acompanhamento e conscientização.

O usuário terá uma resposta clara para três perguntas:

- Quanto estou consumindo?
- Meu consumo aumentou ou diminuiu?
- O que posso fazer para economizar?

Esse recorte mantém o projeto viável, fácil de demonstrar e preparado para receber funcionalidades mais avançadas no futuro.
