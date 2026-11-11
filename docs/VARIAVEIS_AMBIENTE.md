# Variáveis de Ambiente — Prospecta IA

Todas as variáveis abaixo devem ser configuradas no painel do Vercel (Settings → Environment Variables) e/ou no arquivo `.env` local.

Nunca commite valores reais de senhas ou chaves no repositório.

| Variável | Obrigatório | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `DATABASE_URL` | Sim | String de conexão do PostgreSQL (Neon) com `sslmode=require` | `postgresql://user:pass@host.db.neon.tech/db?sslmode=require` |
| `DIRECT_URL` | Sim | Conexão direta ao banco (sem pooler) | `postgresql://user:pass@host.db.neon.tech/db` |
| `JWT_SECRET` | Sim | Segredo para assinar e verificar tokens JWT | `uma-string-aleatória-muito-longa-e-segura` |
| `GMAIL_USER` | Não | E-mail do Gmail para envio de recuperação de senha | `seuemail@gmail.com` |
| `GMAIL_APP_PASSWORD` | Não | Senha de aplicativo do Gmail (não a senha da conta) | `abcd1234efgh5678` |

## Como gerar o JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Observações

- As variáveis `GMAIL_USER` e `GMAIL_APP_PASSWORD` são usadas apenas no fluxo de recuperação de senha (`/api/auth/forgot-password`). Se não configuradas, o sistema ainda funciona, mas não envia e-mails reais (exibe o token no console para desenvolvimento).
- O cookie de sessão usa `secure: true` apenas em produção (`NODE_ENV === 'production'`).
