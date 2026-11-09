# Prospecta SaaS

Frontend estático (HTML/CSS/JS) + API serverless (Vercel Functions) + **Neon PostgreSQL** via **Prisma**.

## Requisitos
- Node.js >= 18
- Conta/projeto no [Neon](https://neon.tech) (PostgreSQL)

## Configuração local
1. Instale dependências:
   ```bash
   npm install
   ```
2. Copie variáveis e configure:
   ```bash
   copy .env.example .env
   ```
   Edite `.env` e defina:
   - `DATABASE_URL` — connection string **pooled** do Neon (`?sslmode=require`)
   - `JWT_SECRET` — segredo forte (ex.: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` — seed do admin (troque a senha)
3. Gere o client Prisma e rode migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   ```
4. Desenvolvimento: para testar o front estático use `npm run dev` (`.serve.cjs`). Para testar as rotas `/api/*` localmente, use `npx vercel dev` (recomendado) com as mesmas variáveis de `.env`.

## Deploy na Vercel
1. Importe o repositório/projeto na Vercel.
2. Em **Project Settings → Environment Variables**, adicione:
   - `DATABASE_URL` (Neon pooled)
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - (opcional) `APP_URL`
3. Build command: `npm run build` (executa `prisma generate`). As migrations devem ser aplicadas com `npx prisma migrate deploy` apontando para o banco de produção (rode localmente com `DATABASE_URL` de produção ou em um job controlado).
4. A Vercel servirá os arquivos estáticos e as funções em `/api/*`.

## Segurança
- Senhas armazenadas com **bcrypt** (hash) — nunca em texto plano.
- Sessão via **JWT em cookie HttpOnly, SameSite=Lax, Secure (produção)**.
- Rotas protegidas validam sessão/role; clientes só acessam seus próprios tickets.
- Validação server-side (Zod) e queries via Prisma (parametrizadas).
- **Nunca** commite `.env` nem exponha `DATABASE_URL`/`JWT_SECRET` no frontend.

## API (resumo)
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `POST /api/auth/register` (admin)
- `GET/POST /api/users` (admin)
- `GET/PATCH/DELETE /api/users/[id]` (admin)
- `GET/POST /api/tickets` (admin: todos; autenticado: próprios)
- `GET/PATCH /api/tickets/[id]`
- `POST /api/tickets/[id]/messages`

## Notas
- Sem SQLite/JSON como banco. Dados persistem no Neon PostgreSQL.
- Backups/PITR: gerenciados pelo Neon (veja o painel do projeto Neon).
- Se a API não estiver disponível (ex.: abrir HTML direto sem `vercel dev`), o front mantém fallback local limitado para navegação, mas **o alvo de produção é o banco real**.
