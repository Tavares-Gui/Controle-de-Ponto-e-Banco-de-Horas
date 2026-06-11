# Sistema de Controle de Ponto e Banco de Horas

Projeto academico da disciplina de DevOps, desenvolvido como uma aplicacao web em arquitetura distribuida para controle de jornada, faltas, banco de horas e solicitacoes de folga.

## 1. Visao geral

O sistema foi construido para atender tres perfis principais:

- `colaborador`: registra ponto, faltas e solicita folga.
- `admin`: acompanha operacao, jornadas e solicitacoes.
- `gestor`: possui as mesmas visoes administrativas e, alem disso, pode gerenciar perfis.

O objetivo da aplicacao e centralizar:

- registro de entrada, pausa e saida;
- controle de faltas integrais e parciais;
- acompanhamento de saldo de horas;
- solicitacoes de folga;
- aprovacao administrativa;
- separacao de acesso por perfil.

## 2. Tecnologias utilizadas

### Frontend

- `React`
- `Vite`
- `Lucide React`
- `CSS puro`

### Backend e banco

- `Supabase Auth`
- `Supabase API`
- `Supabase PostgreSQL`

### Hospedagem e DevOps

- `Vercel` para hospedagem do frontend
- `Supabase` para autenticacao, API e banco
- `GitHub` para versionamento

## 3. Arquitetura da solucao

Arquitetura logica resumida:

`Usuario -> Frontend React/Vite na Vercel -> Supabase Auth/API -> PostgreSQL no Supabase`

### Premissas de sistemas distribuidos

- frontend desacoplado do banco de dados;
- autenticacao centralizada no Supabase;
- API acessada via cliente Supabase no frontend;
- dados persistidos em banco gerenciado em nuvem;
- acesso remoto via internet.

### Premissas de DevOps aplicadas

- versionamento com Git e GitHub;
- deploy automatizado pela Vercel;
- uso de variaveis de ambiente;
- separacao de responsabilidades entre interface, autenticacao e banco;
- banco de dados gerenciado;
- ambiente pronto para demonstracao em nuvem.

## 4. Funcionalidades do sistema

### 4.1 Colaborador

O colaborador pode:

- criar conta com nome completo, telefone, e-mail e senha;
- fazer login com e-mail e senha;
- registrar jornada com:
  - data;
  - entrada;
  - saida para intervalo;
  - volta do intervalo;
  - saida;
  - modelo de trabalho `presencial` ou `hibrido`;
  - observacao;
- registrar falta integral;
- registrar falta parcial por periodo `manha` ou `tarde`;
- selecionar motivo da falta;
- informar motivo personalizado quando escolher `Outro`;
- solicitar folga com:
  - data futura;
  - quantidade de horas;
  - motivo;
- visualizar:
  - saldo total;
  - dias positivos;
  - dias negativos;
  - quantidade de solicitacoes;
  - historico de jornadas;
  - historico de solicitacoes.

### 4.2 Admin

O perfil `admin` pode:

- visualizar quantidade de colaboradores;
- visualizar saldo geral;
- visualizar solicitacoes pendentes, aprovadas e negadas;
- aprovar ou negar solicitacoes de folga;
- consultar todas as jornadas registradas;
- consultar todas as solicitacoes de folga;
- filtrar tabelas por nome e data.

Importante:

- o `admin` nao gerencia perfis;
- ele possui acesso ao painel administrativo, mas nao a edicao de perfis.

### 4.3 Gestor

O perfil `gestor` possui tudo o que o `admin` possui e, adicionalmente:

- pode editar nome, telefone, perfil e jornada diaria dos usuarios;
- e o unico perfil autorizado a gerenciar perfis.

## 5. Regras de negocio importantes

### Registro de ponto

- o ponto so pode ser registrado para datas dentro do mes atual;
- o usuario informa horarios em formato de 24 horas;
- se o colaborador marcar `falta`, os horarios do dia sao anulados;
- em falta parcial, o sistema considera metade da jornada esperada;
- o saldo de horas e calculado com base na jornada esperada do perfil.

### Solicitacao de folga

- a data da folga nao pode ser no passado;
- a data tambem nao pode ser o dia atual;
- apenas datas futuras sao aceitas;
- a solicitacao exige motivo e quantidade de horas valida.

### Permissoes

- colaborador ve apenas seus proprios dados;
- admin e gestor veem visoes administrativas;
- somente gestor pode editar perfis;
- as regras tambem sao protegidas no banco via `Row Level Security`.

## 6. Estrutura atual do projeto

O frontend foi reorganizado por responsabilidade:

```text
src/
  App.jsx
  main.jsx
  style.css
  components/
    common/
      DateFieldBR.jsx
      FeedbackMessage.jsx
      Header.jsx
      Table.jsx
      TableFilters.jsx
      TimeFieldBR.jsx
  constants/
    options.js
  hooks/
    useFeedback.js
  lib/
    supabase.js
  pages/
    AdminPage.jsx
    AuthPage.jsx
    EmployeePage.jsx
  utils/
    date.js
    filters.js
    formatters.js
    forms.js
    time.js
```

### Responsabilidade de cada pasta

- `pages`: telas principais do sistema.
- `components/common`: componentes reutilizaveis.
- `utils`: regras puras de calculo, formatacao e filtros.
- `hooks`: logicas reutilizaveis com estado.
- `lib`: integracoes externas, como Supabase.
- `constants`: listas estaticas da aplicacao.

## 7. Banco de dados

O arquivo [database.sql](C:/Users/guilherme.tavares/Desktop/trabalho/controle-ponto-banco-horas/database.sql) cria:

- tabela `profiles`;
- tabela `time_entries`;
- tabela `day_off_requests`;
- trigger para criar perfil automaticamente ao cadastrar usuario;
- funcoes de permissao;
- politicas de `Row Level Security`.

### Tabela `profiles`

Campos principais:

- `id`
- `full_name`
- `phone`
- `role`
- `expected_daily_minutes`

Perfis aceitos:

- `employee`
- `admin`
- `gestor`

### Tabela `time_entries`

Campos principais:

- `work_date`
- `entry_time`
- `break_start`
- `break_end`
- `exit_time`
- `work_model`
- `observation`
- `is_absence`
- `is_partial_absence`
- `absence_period`
- `absence_reason`
- `absence_other_reason`
- `worked_minutes`
- `balance_minutes`

### Tabela `day_off_requests`

Campos principais:

- `request_date`
- `hours_requested`
- `reason`
- `status`
- `reviewed_by`
- `reviewed_at`

## 8. Como configurar o projeto

### 8.1 Pre-requisitos

Voce precisa ter instalado:

- `Node.js`
- `npm`
- conta no `Supabase`
- conta na `Vercel`

### 8.2 Variaveis de ambiente

Crie um arquivo `.env` com base em [.env.example](C:/Users/guilherme.tavares/Desktop/trabalho/controle-ponto-banco-horas/.env.example):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

## 9. Como rodar localmente

No terminal:

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:5173
```

## 10. Como preparar o Supabase

### Passo 1

Crie um projeto no Supabase.

### Passo 2

Abra o `SQL Editor`.

### Passo 3

Execute o arquivo [database.sql](C:/Users/guilherme.tavares/Desktop/trabalho/controle-ponto-banco-horas/database.sql).

### Passo 4

Em `Authentication > Providers > Email`, se quiser facilitar os testes da faculdade, desative a confirmacao de e-mail.

### Passo 5

Copie:

- `Project URL`
- `anon public key`

e configure no `.env` local e tambem nas variaveis da Vercel.

## 11. Como publicar na Vercel

### Passo 1

Envie o projeto para um repositorio no GitHub.

### Passo 2

Importe o repositorio na Vercel.

### Passo 3

Configure as variaveis de ambiente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Passo 4

Realize o deploy.

Ao final, a Vercel gera um link publico para demonstracao do sistema.

## 12. Como utilizar o sistema

### 12.1 Primeiro acesso

1. Cadastre um usuario pelo formulario inicial.
2. Faça login com e-mail e senha.
3. O sistema criara automaticamente um perfil `employee`.

### 12.2 Transformar usuario em admin

No Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'COLE_AQUI_O_ID_DO_USUARIO';
```

### 12.3 Transformar usuario em gestor

No Supabase SQL Editor:

```sql
update public.profiles
set role = 'gestor'
where id = 'COLE_AQUI_O_ID_DO_USUARIO';
```

O `id` pode ser encontrado em:

`Supabase > Authentication > Users`

### 12.4 Fluxo do colaborador

1. Registrar jornada.
2. Informar falta, quando necessario.
3. Solicitar folga para data futura.
4. Acompanhar historico e saldo.

### 12.5 Fluxo do admin

1. Entrar no painel administrativo.
2. Consultar solicitacoes pendentes.
3. Aprovar ou negar folgas.
4. Acompanhar jornadas e indicadores gerais.

### 12.6 Fluxo do gestor

1. Fazer tudo o que o admin faz.
2. Acessar `Gerenciar perfis`.
3. Atualizar nome, telefone, perfil e jornada diaria.

## 13. Mensagens de sucesso e erro

O sistema possui feedback visual para operacoes importantes:

- login;
- cadastro;
- registro de ponto;
- solicitacao de folga;
- aprovacao e negacao de folga;
- atualizacao de perfil;
- erros de carregamento de dados.

Isso melhora a experiencia de uso e facilita a operacao do sistema.

## 14. Filtros das tabelas

As tabelas do sistema possuem filtros para facilitar a busca:

- por `nome`, quando a tabela envolve usuarios;
- por `data`, quando a tabela envolve jornadas ou solicitacoes.

Esses filtros estao disponiveis:

- no painel administrativo;
- nos historicos do colaborador.

## 15. Scripts disponiveis

No [package.json](C:/Users/guilherme.tavares/Desktop/trabalho/controle-ponto-banco-horas/package.json):

```bash
npm run dev
```

Inicia o projeto localmente.

```bash
npm run build
```

Gera a build de producao.

```bash
npm run preview
```

Abre uma visualizacao local da build gerada.

## 16. Como validar o projeto antes da entrega

Checklist recomendado:

1. Confirmar que o frontend abre localmente.
2. Confirmar que o Supabase esta configurado.
3. Confirmar que o deploy na Vercel esta funcionando.
4. Testar cadastro e login.
5. Testar registro de ponto.
6. Testar falta integral e parcial.
7. Testar solicitacao de folga para data futura.
8. Testar aprovacao e negacao pelo admin.
9. Testar gerenciamento de perfis pelo gestor.
10. Validar o link publico para apresentacao.

## 17. Beneficios da solucao

- acesso remoto pela internet;
- baixo custo;
- deploy rapido;
- separacao de responsabilidades;
- autenticacao centralizada;
- banco gerenciado;
- seguranca por perfil;
- facilidade de manutencao;
- arquitetura adequada para demonstracao de DevOps.

## 18. Possiveis evolucoes futuras

- relatorios em PDF;
- dashboard com graficos;
- notificacoes por e-mail;
- auditoria de alteracoes;
- testes automatizados;
- pipeline CI completo no GitHub Actions;
- exportacao de dados;
- painel mobile mais avancado.

## 19. Autor e contexto

Este projeto foi desenvolvido como trabalho academico para demonstrar:

- sistemas distribuidos;
- cloud computing;
- DevOps;
- deploy em nuvem publica;
- autenticacao e seguranca de dados;
- organizacao arquitetural em frontend moderno.
