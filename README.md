# Sistema de Controle de Ponto e Banco de Horas

Projeto acadêmico de DevOps com arquitetura distribuída:
- Frontend React/Vite hospedado na Vercel
- Backend/Auth/API/Banco PostgreSQL no Supabase
- Versionamento no GitHub
- Deploy automatizado GitHub -> Vercel

## Rodar localmente
```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase
1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute o arquivo `database.sql`.
4. Em Authentication > Providers > Email, desative confirmação de e-mail para facilitar os testes acadêmicos.
5. Copie Project URL e anon public key para o `.env` e para as variáveis da Vercel.

## Usuário administrador
Após cadastrar seu usuário normalmente pelo sistema, rode no Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', full_name = 'Administrador'
where id = 'COLE_AQUI_O_ID_DO_USUARIO';
```

O ID do usuário pode ser visto em Authentication > Users.
