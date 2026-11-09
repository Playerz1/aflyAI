# 🚀 Como rodar e como publicar

> Do zero até o sistema no ar. Execute os comandos **na raiz** `saas/`.

---

## 1. Pré-requisitos

| Item | Versão / observação |
|---|---|
| Node.js | 18 ou superior (`node -v`) |
| npm | incluído com o Node (`npm -v`) |
| Conta Neon | [neon.tech](https://neon.tech) (gratuita) |
| Conta Vercel | [vercel.com](https://vercel.com) (gratuita) |

---

## 2. Instalar

```bash
npm install
```

O `postinstall` já roda `prisma generate`.

---

## 3. Variáveis de ambiente

Copie o modelo:

```powershell
Copy-Item .env.example .env
```

Preencha `.env`:

| Variável | Onde encontrar | Exemplo (formato) |
|---|---|---|
| `DATABASE_URL` | Neon → Dashboard → **Connect** → *Pooled connection* | `postgresql://user:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Neon → **Connect** → *Direct connection* (sem `-pooler`) | usado por migrations |
| `JWT_SECRET` | gerar localmente (comando abaixo) | 96 caracteres hex — **obrigatório**: sem ele o login lança `JWT_SECRET não configurado` |
| `NODE_ENV` | `development` local / `production` na Vercel | |
| `APP_URL` | endereço do app | `http://localhost:5174` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | você define | usados pelo seed |

Gerar segredo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> 🔒 `.env` está no `.gitignore`. Nunca cole esse arquivo em chat, print ou
> repositório.

---

## 4. Criar as tabelas no Neon

Primeira vez:

```bash
npx prisma migrate deploy      # aplica as migrations existentes
npm run db:seed                # cria o admin inicial
```

Depois de alterar `schema.prisma`:

```bash
npx prisma migrate dev --name nome-da-mudanca
```

Outros comandos úteis:

| Comando | Faz |
|---|---|
| `npx prisma studio` | Interface visual do banco |
| `npx prisma format` | Formata o schema |
| `npx prisma validate` | Confere o schema |

---

## 5. Rodar localmente

### 5.1 Só a interface (sem API)

```bash
npm run dev
```

Abre em `http://localhost:5174`. Nesse modo as chamadas `/api/*` não existem e
o front usa o **fallback local** — bom só para visualizar o layout.

### 5.2 Interface + API (recomendado)

```bash
npx vercel dev
```

A Vercel emula as funções serverless e as variáveis do `.env`. É assim que se
testa login, tickets e gravação real no banco.

### 5.3 Verificação rápida do banco

```bash
npx prisma studio          # abre a interface do banco
```

Ou teste a API (sem sessão deve responder 401 — isso prova que a função
subiu e que o Prisma está carregando):

```bash
curl -i http://localhost:3000/api/auth/me
```

---

## 6. Publicar na Vercel

### 6.1 Primeira publicação

1. Suba o projeto para o GitHub (`.env` **não** vai).
2. Vercel → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | string **pooled** do Neon |
   | `DIRECT_URL` | string direta do Neon (opcional, para migrations) |
   | `JWT_SECRET` | o segredo gerado |
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://seu-projeto.vercel.app` |

4. Build Command: `npm run build` — Output: **sem build** (arquivos estáticos).
5. **Deploy**.

### 6.2 Aplicar migrations no banco de produção

A Vercel não roda migrations. Rode localmente apontando para o banco de
produção:

```powershell
$env:DATABASE_URL="postgresql://...pooler...?sslmode=require"
$env:DIRECT_URL="postgresql://...direta...?sslmode=require"
npx prisma migrate deploy
```

### 6.3 Domínio e cookies

- Em produção o cookie de sessão usa `Secure` — o site **precisa** estar em
  HTTPS (a Vercel já fornece).
- Se usar domínio próprio, atualize `APP_URL`.

---

## 7. Checklist antes de considerar "no ar"

- [ ] `npx prisma studio` lista as tabelas `users`, `tickets`, `ticket_messages`
- [ ] Login do admin funciona e o cookie aparece (HttpOnly)
- [ ] Cliente abre ticket → aparece em `tickets.html`
- [ ] Admin responde → cliente vê no chat
- [ ] Recarregar a página mantém os dados (é o banco, não memória)
- [ ] Acessar `admin.html` sem login redireciona para `admin-login.html`
- [ ] `usuarios.html` bloqueia/desbloqueia
- [ ] `DATABASE_URL` **não** aparece em nenhum arquivo do frontend

---

## 8. Rotina de backup

```bash
pg_dump "$env:DATABASE_URL" > backup-2026-11-09.sql
```

Faça isso semanalmente e guarde fora do Neon. Para recuperar, use
**Restore** no painel do Neon ou `psql` com o arquivo.

---

## 9. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `P1001` — can't reach database | URL errada/faltando `sslmode=require` | Copie novamente do Neon (Pooled) |
| `JWT_SECRET não configurado` | Sem variável no ambiente | Preencha `.env` (ou painel da Vercel) |
| Login 401 mesmo com senha certa | Usuário criado sem `passwordHash` | Rode o seed ou um `register` como admin |
| Menu admin aparece no cliente | Sessão/cookies antigos | Faça logout e login de novo |
| Dados "somem" após deploy | API chamando fallback local | Veja o console: `[Dados] refresh api falhou` = API não respondeu |
| Erro `too many connections` | URL sem pooler | Use a string **Pooled** do Neon |
