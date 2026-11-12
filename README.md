# AflyAI — SaaS Dashboard Black & Red

SaaS completo com autenticação, cadastro de usuários e painel administrativo individual.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Neon)
- Sessões por cookie `httpOnly` (tokens aleatórios de 256 bits, expiração em 7 dias)
- Senhas com salt + SHA-256 (via `crypto` nativo)
- Tema dark exclusivamente **black & red** (`#050505` / `#E50914`)

## Funcionalidades

- **Tela de login** (`/`) com e-mail e senha
- **Tela de cadastro** (`/cadastro`) com nome, e-mail, senha e confirmação de senha
- **Sair da conta** na sidebar e na página "Minha conta"
- **Painel individual** (`/dashboard`):
  - **Visão geral** — cards de estatísticas e atividade recente
  - **Atividade** — registro e listagem de eventos da conta
  - **Métricas** — cadastro de valores com barra comparativa
  - **Minha conta** — dados do usuário e logout
- Proteção de rotas: `/dashboard` redireciona para login quando não autenticado
- APIs próprias: `/api/auth/{register,login,logout,me}`, `/api/logs`, `/api/metrics`

## Como rodar

```bash
npm install
npx prisma db push   # cria/atualiza as tabelas no Neon
npm run dev          # desenvolvimento em http://localhost:3000
```

Produção:

```bash
npm run build
npm start
```

## Variáveis de ambiente (.env)

```
DATABASE_URL   # string de conexão PostgreSQL (Neon, com pooler)
DIRECT_URL     # conexão direta para migrações
APP_URL        # URL pública do app
JWT_SECRET     # reservado para futura troca de assinatura de tokens
```

## Estrutura

```
app/                  # páginas (App Router) e rotas de API
  page.tsx            # login
  cadastro/page.tsx   # cadastro
  dashboard/          # painel protegido (visão geral, atividade, métricas, conta)
  api/auth/...        # endpoints de autenticação
components/
  AuthForm.tsx        # formulário compartilhado de login/cadastro
  Sidebar.tsx         # navegação lateral + logout
lib/
  auth.ts             # hash de senha, sessões e getCurrentUser
  db.ts               # client Prisma singleton
prisma/schema.prisma  # modelos User, Session, ActivityLog, Metric
```
