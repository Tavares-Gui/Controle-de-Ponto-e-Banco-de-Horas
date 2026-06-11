# Informações para o trabalho de DevOps

## Sistema desenvolvido
Sistema de Controle de Ponto e Banco de Horas.

## Funcionalidades do colaborador
- Cadastro e login de usuário.
- Registro de jornada com data, entrada, saída para intervalo, volta do intervalo e saída.
- Campo de observação no registro de ponto.
- Seleção do modelo de trabalho: presencial ou híbrido.
- Registro de falta com motivo: atestado médico, consulta médica, problema familiar, transporte ou outro motivo personalizado.
- Solicitação de folga com data, quantidade de horas e motivo.
- Consulta do histórico de jornada.
- Consulta das solicitações de folga.
- Resumo com saldo de horas, dias positivos, dias negativos e quantidade de solicitações.

## Funcionalidades do administrador
- Visualização da quantidade de colaboradores.
- Visualização das solicitações pendentes, aprovadas e negadas.
- Visualização do saldo geral de horas.
- Aprovação ou negação de solicitações de folga.
- Resumo dos colaboradores com nome, perfil, jornada, saldo e pendências.
- Gerenciamento de perfis dos colaboradores.
- Consulta de todas as jornadas registradas.
- Consulta de todas as pendências/solicitações.

## Arquitetura utilizada com premissas de DevOps
A aplicação utiliza uma arquitetura distribuída, separando frontend, autenticação, API e banco de dados. O frontend foi desenvolvido em React com Vite e hospedado na Vercel. O backend é fornecido pelo Supabase, que disponibiliza autenticação, APIs automáticas e banco de dados PostgreSQL gerenciado. O código-fonte é versionado no GitHub e integrado à Vercel, permitindo deploy automatizado sempre que houver alteração na branch principal.

Premissas de DevOps aplicadas:
- Versionamento de código com Git e GitHub.
- Deploy automatizado com integração GitHub + Vercel.
- Entrega contínua da aplicação em nuvem.
- Separação de responsabilidades entre frontend, autenticação e banco de dados.
- Uso de variáveis de ambiente para proteger configurações sensíveis.
- Ambiente em nuvem com acesso via HTTPS.
- Banco de dados gerenciado, reduzindo esforço operacional.

## Escolha da nuvem e fundamentação
A nuvem escolhida foi a Vercel para hospedar o frontend e o Supabase para autenticação, API e banco de dados PostgreSQL. A escolha foi feita porque ambas as plataformas possuem plano gratuito adequado para projetos acadêmicos, são simples de configurar, têm integração com GitHub e permitem demonstrar conceitos de DevOps e sistemas distribuídos sem necessidade de configurar servidores manualmente.

## Benefícios de uso da solução implementada
- Acesso ao sistema pela internet.
- Baixo custo, utilizando planos gratuitos.
- Deploy rápido e automatizado.
- Melhor organização dos registros de ponto e banco de horas.
- Controle de solicitações de folga com aprovação administrativa.
- Visão gerencial para acompanhamento de colaboradores, pendências e saldo geral.
- Segurança com autenticação de usuários.
- Escalabilidade e manutenção simplificada por utilizar serviços gerenciados em nuvem.

## Arquitetura resumida
Usuário -> Frontend React na Vercel -> Supabase Auth/API -> PostgreSQL Supabase
