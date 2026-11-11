# Deploy — Prospecta IA

## Plataforma

O projeto está configurado para deploy na **Vercel** usando Serverless Functions (Node.js).

## Arquivo de configuração (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@5.1.8",
      "includeFiles": "lib/**,prisma/schema.prisma"
    }
  },
  "rewrites": [
    { "source": "/", "destination": "/login.html" }
  ]
}
```

## Script de build (`scripts/vercel-static.mjs`)

Copia arquivos `.html`, pasta `assets/`, `css/`, `js/` e `api/` para o diretório `public/`, que é o `outputDirectory` da Vercel.

## Passos para publicar

1. **Conecte o repositório ao Vercel:**
   - Acesse vercel.com.
   - Importe o repositório Git do projeto.
   - O Vercel detecta automaticamente o `vercel.json`.

2. **Configure as variáveis de ambiente** no painel do projeto (Settings → Environment Variables):
   - `DATABASE_URL` — conexão PostgreSQL (Neon)
   - `DIRECT_URL` — conexão direta do banco
   - `JWT_SECRET` — segredo para assinar tokens JWT
   - `GMAIL_USER` — (opcional) e-mail para recuperação de senha
   - `GMAIL_APP_PASSWORD` — (opcional) senha de app do Gmail

3. **Faça o deploy:**
   - Dê `push` na branch `main`.
   - O Vercel dispara o build automaticamente.
   - Acompanhe o status no painel do Vercel.

4. **Execute as migrações no banco de produção:**
   - Após o deploy, rode `npx prisma migrate deploy` em um ambiente com acesso ao `DATABASE_URL` de produção.
   - Ou use o Prisma Studio para validar a estrutura.

## Comandos úteis

```bash
# Build local (simula o que o Vercel faz)
npm run build

# Gerar cliente Prisma
npx prisma generate

# Executar migrações em produção
npx prisma migrate deploy

# Abrir Prisma Studio (inspecionar dados)
npx prisma studio
```

## Build local

O comando `npm run build` executa:
1. `prisma generate` — gera o cliente Prisma.
2. `node scripts/vercel-static.mjs` — copia arquivos estáticos para `public/`.

Após o build, a pasta `public/` contém tudo o que é necessário para servir o site.
