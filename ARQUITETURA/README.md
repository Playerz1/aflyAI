# 📐 Prospecta SaaS — Arquitetura e documentação do projeto

> Esta pasta (`ARQUITETURA/`) guarda **toda a documentação** do que foi construído:
> o mapa de arquivos, o que cada tela faz, como o banco de dados funciona,
> como rodar, como publicar e o histórico de todas as etapas.
>
> Nada aqui é código executável — o app continua rodando a partir da **raiz do projeto**.

---

## 🗂️ Que pasta é esta?

| Arquivo | O que tem dentro | Quando ler |
|---|---|---|
| `README.md` | Este guia: visão geral, mapa de pastas, índice | Comece por aqui |
| [`ESTRUTURA-DE-ARQUIVOS.md`](ESTRUTURA-DE-ARQUIVOS.md) | Cada arquivo/pasta, linha a linha, e para que serve | Quando for mexer em algum arquivo |
| [`PAGINAS-E-FUNCIONALIDADES.md`](PAGINAS-E-FUNCIONALIDADES.md) | O que cada tela faz, fluxos, componentes, atalhos | Para entender a interface |
| [`BANCO-DE-DADOS.md`](BANCO-DE-DADOS.md) | Neon + Prisma: tabelas, API, segurança, migrations, backups | Antes de mexer em dados |
| [`COMO-RODAR-E-DEPLOY.md`](COMO-RODAR-E-DEPLOY.md) | Rodar local, variáveis de ambiente, publicar na Vercel | Para subir o sistema |
| [`HISTORICO.md`](HISTORICO.md) | Linha do tempo de tudo que foi feito, passo a passo | Para relembrar o caminho |

---

## 🚀 O que é o Prospecta (resumo em 60 segundos)

Um **SaaS de prospecção + criação de sites** para agências e negócios locais.
É composto por três camadas, todas no mesmo repositório:

```
┌──────────────────────────────────────────────────────────────┐
│ 1) FRONTEND  (HTML + CSS global + JS puro)                   │
│    12 páginas .html  →  assets/css/global.css                │
│                    →  assets/js/*.js                         │
├──────────────────────────────────────────────────────────────┤
│ 2) API  (Vercel Serverless Functions em Node.js)              │
│    api/**/*.js  →  validam sessão, regras e dados            │
├──────────────────────────────────────────────────────────────┤
│ 3) BANCO  (Neon PostgreSQL, na nuvem)                         │
│    Prisma ORM  →  prisma/schema.prisma  →  migrations        │
└──────────────────────────────────────────────────────────────┘
```

- **Desktop e mobile**: uma única sidebar, que vira menu deslizante no celular.
- **Visual**: um único `global.css` (design tokens + componentes).
- **Admin separado**: as telas `admin.html`, `tickets.html` e `usuarios.html`
  só abrem com sessão de administrador.
- **Suporte com chat**: o cliente abre um ticket pela "Central de ajuda" e
  conversa com o admin por ali (dados no PostgreSQL).

---

## 🗺️ Mapa rápido da raiz

```
saas/
├── ARQUITETURA/          ← 📚 ESTA pasta (documentação)
├── assets/
│   ├── css/global.css    ← todo o estilo
│   └── js/               ← app.js, store.js, support.js, admin-auth.js, admin-ui.js
├── api/                  ← backend serverless (Vercel Functions)
│   ├── auth/ users/ tickets/ health.js
├── lib/                  ← prisma.js, auth.js, http.js, audit.js
├── prisma/               ← schema.prisma, migrations/, seed.js
├── *.html                ← as 12 telas
├── package.json          ← scripts (dev, build, db:*)
├── vercel.json           ← configuração de deploy
├── .env                  ← segredos reais (NUNCA vai para o Git)
├── .env.example          ← modelo de variáveis (vai para o Git)
└── .serve.cjs            ← servidor local simples para as telas
```

Detalhe completo em [`ESTRUTURA-DE-ARQUIVOS.md`](ESTRUTURA-DE-ARQUIVOS.md).

---

## ✅ Onde estamos agora (status)

| Área | Situação |
|---|---|
| Interface (desktop + mobile) | ✅ pronta e testada em 3 tamanhos de tela |
| Central de ajuda + tickets com chat | ✅ funcionando (cliente ↔ admin) |
| Área admin (3 páginas restritas) | ✅ pronta, protegida por login |
| Banco Neon PostgreSQL | ✅ schema criado + migration aplicada |
| Prisma ORM + API `/api/*` | ✅ implementados |
| Login / sessão JWT em cookie HttpOnly | ✅ implementado |
| Deploy na Vercel | ⏳ pronto para publicar (falta só configurar as variáveis) |

> Guia de publicação: [`COMO-RODAR-E-DEPLOY.md`](COMO-RODAR-E-DEPLOY.md).

---

## 🔐 Regra de ouro

- `.env` contém **segredos reais** e está no `.gitignore`. Nunca commitar, nunca
  colar em chat, nunca usar no frontend.
- O frontend só fala com `/api/*`. Ele **nunca** vê a senha do banco.
- O navegador guarda apenas o **cookie de sessão** (HttpOnly, inacessível ao JS).
