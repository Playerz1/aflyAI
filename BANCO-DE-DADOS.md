# 🗄️ Banco de dados — Neon PostgreSQL + Prisma

> Banco **100% online**, persistente e independente do computador.
> Camada gratuita do Neon comporta ~400 usuários com folga (a cobrança do Neon
> é por armazenamento/compute, não por usuário).

---

## 1. Por que Neon + Prisma?

| Peça | Papel |
|---|---|
| **Neon** | PostgreSQL gerenciado, com *connection pooler* (ideal para serverless), *branching* e *point-in-time restore* |
| **Prisma ORM** | Consultas tipadas, migrations versionadas e proteção natural contra SQL Injection |
| **Vercel Functions** | Executam a API; cada função abre poucas conexões via pooler |

**Nunca usamos** SQLite, arquivos JSON ou dados só em memória como banco.

---

## 2. Modelo de dados (`prisma/schema.prisma`)

Três tabelas relacionadas:

```
users 1 ─────< tickets (createdById)
users 1 ─────< ticket_messages (authorId)
tickets 1 ───< ticket_messages (ticketId, cascade)
```

### `users` → `User`

| Campo | Tipo | Observação |
|---|---|---|
| `id` | String (cuid) | Chave primária interna |
| `seq` | Int autoincrement | Número estável exibido na interface |
| `name`, `initials` | String | Iniciais usadas nos avatares |
| `email` | String **unique** | Login |
| `passwordHash` | String? | **bcrypt** (nunca a senha em texto) |
| `plan` | String | Pro / Trial / Cliente |
| `role` | enum `UserRole` | `admin` · `member` · `client` |
| `status` | enum `UserStatus` | `active` · `invite` · `blocked` |
| `jobTitle`, `note` | String | Cargo e nota interna (só admin) |
| `createdAt`, `updatedAt`, `lastLoginAt` | DateTime | Auditoria básica |

Índices: `email` (unique), `status`, `role`.

### `tickets` → `Ticket`

| Campo | Tipo | Observação |
|---|---|---|
| `id` | Int autoincrement | Também é o `#número` mostrado ao cliente |
| `subject`, `reason`, `reasonLabel` | String | Assunto, código do motivo e rótulo traduzido |
| `priority` | enum | `baixa` · `media` · `alta` |
| `status` | enum | `aberto` · `respondido` · `resolvido` |
| `origin` | String | De qual tela o cliente abriu (ex.: `Prospectar`) |
| `createdById` | String? | Dono do ticket (FK → users, `ON DELETE SET NULL`) |
| `creatorName`, `creatorInitials`, `creatorEmail`, `creatorPlan` | String | **Snapshot** do autor para exibição |

Índices: `status`, `createdById`, `updatedAt`.

### `ticket_messages` → `TicketMessage`

| Campo | Tipo | Observação |
|---|---|---|
| `ticketId` | Int | FK → tickets (`ON DELETE CASCADE`) |
| `authorId` | String? | FK → users (`ON DELETE SET NULL`) |
| `authorType` | enum | `cliente` · `suporte` · `admin` |
| `text` | String | Conteúdo da mensagem |
| `read` | Boolean | Controle de "mensagens novas" |

Índices: `ticketId`, `createdAt`.

---

## 3. Isolamento de dados por usuário

- Cliente: `GET /api/tickets` filtra **sempre** por
  `createdById: user.id` quando o papel não é admin.
- Mensagens: só é possível escrever num ticket que seja seu (validado no
  handler).
- Admin: vê tudo, mas as rotas exigem `requireAdmin`.
- Dados sensíveis (`passwordHash`) nunca saem do servidor: `safeUser()` remove
  o campo antes de responder.

---

## 4. API (`/api/*`)

| Método | Rota | Quem pode | O que faz |
|---|---|---|---|
| POST | `/api/auth/login` | Público | E-mail + senha → cookie de sessão |
| POST | `/api/auth/signup` | Público | Cadastro (cria `member` ativo e já loga) |
| POST | `/api/auth/logout` | Autenticado | Limpa o cookie |
| GET | `/api/auth/me` | Autenticado | Usuário da sessão |
| POST | `/api/auth/register` | Admin | Cria usuário com papel e senha definidos |
| GET | `/api/users` | Admin | Lista usuários |
| POST | `/api/users` | Admin | Cria usuário/convite |
| GET | `/api/users/:id` | Admin | Detalhe |
| PATCH | `/api/users/:id` | Admin | Editar, bloquear, nota, papel |
| DELETE | `/api/users/:id` | Admin | Excluir |
| GET | `/api/tickets` | Autenticado | Admin vê todos; cliente só os seus |
| POST | `/api/tickets` | Autenticado | Abre ticket (cria a 1ª mensagem) |
| GET | `/api/tickets/:id` | Dono ou admin | Detalhe + mensagens |
| PATCH | `/api/tickets/:id` | Dono (só reabrir) / admin (tudo) | Atualiza status/prioridade/assunto |
| POST | `/api/tickets/:id/messages` | Dono ou admin | Nova mensagem no chat |

Todos os corpos passam por **Zod**. Erros retornam
`{ error, details? }` com o código HTTP correto.

Para checar o banco sem rota extra, rode `npx prisma studio` ou chame
`GET /api/auth/me` (responde 401 sem sessão, mas prova que a função subiu).

---

## 5. Segurança implementada

| Requisito | Como foi feito |
|---|---|
| Senhas com hash | `bcryptjs`, 12 rounds (`bcrypt.hash`) |
| Sessão | **JWT assinado** (`jsonwebtoken`) guardado em cookie `HttpOnly; SameSite=Lax; Secure` em produção, validade 7 dias |
| Validação no backend | Zod em 100% das rotas de escrita |
| SQL Injection | Prisma usa consultas parametrizadas; nenhum SQL concatenado com entrada do usuário |
| Controle de acesso | `requireAuth` / `requireAdmin` + filtro por `createdById` |
| Conexões | Cliente Prisma singleton (`lib/prisma.js`) + connection string **pooled** do Neon |
| Erros | `handleError()` traduz `P2002` (duplicado), `P2025` (não encontrado), `ZodError` (400) e esconde detalhes internos no 500 |
| Segredos | Só no servidor (`.env` / variáveis da Vercel). O front nunca recebe `DATABASE_URL` |
| Anti-força-bruta | Mensagem genérica "Credenciais inválidas" + status 401 |

---

## 6. Migrations

- Localizadas em `prisma/migrations/`.
- Já existe: `20261109004345_init` (cria enums, tabelas, índices e FKs).
- O script `db:seed` cria/atualiza o admin a partir de `ADMIN_EMAIL`,
  `ADMIN_PASSWORD` e `ADMIN_NAME` (usa `upsert`: pode rodar mais de uma vez).
- **Criar nova**: altere `schema.prisma` → `npx prisma migrate dev --name nome`.
- **Aplicar em produção**: `npx prisma migrate deploy` (com a `DATABASE_URL` de
  produção). A Vercel **não** roda migration automaticamente.
- O script `build` roda apenas `prisma generate` — não altera o banco.

---

## 7. Backups e recuperação (Neon)

| Recurso | Onde |
|---|---|
| Point-in-time restore | Neon → projeto → **Restore** (retorna a qualquer ponto da janela) |
| Branches | Crie uma branch do banco para testes sem afetar produção |
| Export manual | `pg_dump "$DATABASE_URL" > backup.sql` |
| Restauração | `psql "$DATABASE_URL" < backup.sql` |

Recomendação: um `pg_dump` semanal guardado fora do Neon (Google Drive, S3…).
A camada gratuita do Neon mantém histórico de restauração; para retenção maior,
use backup próprio.

---

## 8. Preparado para ~400 usuários

- Índices nas colunas de filtro (`status`, `createdById`, `updatedAt`).
- Paginação a ser habilitada quando a lista crescer (as consultas já aceitam
  `take`/`skip`).
- Pooler do Neon evita esgotar conexões em picos de serverless.
- Volume esperado com 400 usuários: poucos MB — longe do limite gratuito.
