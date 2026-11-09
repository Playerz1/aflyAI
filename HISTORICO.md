# 🧾 Histórico do projeto — o que foi feito

> Linha do tempo das etapas de construção do Prospecta, na ordem em que foram
> executadas. Serve para saber **por que** cada parte existe.

---

## Etapa 1 — Estrutura e design system

**Pedido:** SaaS com versão mobile e desktop, sidebar, menu Dashboard,
Prospectar, Contratos, Equipes, Extensão, Configuração — MVP de criar site,
com CSS global e uma página `.html` por item.

**Feito**
- `assets/css/global.css` — design tokens (`:root`), componentes (botões,
  cards, KPIs, tabelas, formulários, abas, modais, toasts) e responsivo em 5
  breakpoints.
- `assets/js/app.js` — menu mobile, item ativo, abas, filtros, busca, modais,
  toasts, contadores animados.
- Páginas criadas: `dashboard.html`, `prospectar.html`, `contratos.html`,
  `equipes.html`, `extensao.html`, `configuracoes.html`, `sites.html`,
  `editor.html`.
- `.serve.cjs` para pré-visualizar local.

**Verificação:** 8 páginas × 3 tamanhos de tela no navegador headless — sem
erros de console e sem rolagem horizontal.

---

## Etapa 2 — Ajustes de layout

**Feito**
- Tabelas viram cartões no celular (`.table--cards`).
- Sidebar: ícone, nome e plano empilhados corretamente.
- Editor: layout 2 colunas, prévia ao vivo (textos, paleta, fonte, blocos, SEO)
  e alternância Desktop/Mobile.
- Ícones/badges alinhados; `min-width: 0` nas colunas de grid para nada
  estourar.

---

## Etapa 3 — Central de ajuda via WhatsApp (removida depois)

**Pedido:** Central de ajuda abrindo o WhatsApp 17 98127-6782 com mensagem
pronta.
**Feito:** link com texto pré-preenchido por página + botão flutuante verde.
**Depois:** removido na etapa 4 a pedido do cliente.

---

## Etapa 4 — Suporte com tickets e área administrativa

**Pedido:** tirar o WhatsApp; criar `admin.html`, `tickets.html`,
`usuarios.html` (só o admin vê); o cliente descreve a dúvida, escolhe o motivo,
cria o ticket e conversa num chat ali mesmo.

**Feito**
- **Painel da Central de ajuda** (`assets/js/support.js` + seção 4 do CSS):
  formulário (assunto, descrição, 6 motivos, prioridade), lista "Meus
  atendimentos" e chat com mensagens.
- **3 páginas restritas**: `admin.html` (visão geral), `tickets.html` (inbox
  com lista + conversa + detalhes), `usuarios.html` (KPIs, tabela, criar,
  bloquear, nota interna).
- **`admin-login.html`**: entrada com sessão.
- `assets/js/store.js`: camada de dados compartilhada.
- Testado o fluxo completo: cliente abre → admin responde → cliente lê.

---

## Etapa 5 — Banco de dados profissional

**Pedido:** banco real, online e persistente (Neon PostgreSQL + Prisma +
Vercel), sem SQLite/JSON, com login seguro, isolamento, permissões, migrations,
backups e proteção.

**Feito**
- `prisma/schema.prisma` — `User`, `Ticket`, `TicketMessage` + enums.
- `prisma/migrations/20261109004345_init/migration.sql` — tabelas, índices,
  chaves estrangeiras com `ON DELETE` coerentes.
- `prisma/seed.js` — cria o usuário administrador.
- **API serverless** em `api/`:
  `auth/{login,logout,me,register}`, `users/{index,[id]}`,
  `tickets/{index,[id]/{index,messages}}` e `health`.
- **`lib/`**: `prisma.js` (singleton), `auth.js` (JWT + guards),
  `http.js` (respostas, cookies, validação, erros), `audit.js`.
- **Segurança**: bcrypt (12 rounds), JWT em cookie HttpOnly/SameSite/Secure,
  validação Zod, Prisma parametrizado, filtro por dono do ticket.
- `.env` (local, fora do Git), `.env.example`, `.gitignore`, `vercel.json`.
- `assets/js/store.js` reescrito para consumir `/api/*` com cache em memória.

---

## Etapa 6 — Documentação

**Pedido:** criar a pasta de arquitetura com tudo que foi feito, explicando
onde fica cada coisa.

**Feito:** esta pasta `ARQUITETURA/` com 6 documentos (README, estrutura,
páginas, banco, como rodar/deploy e este histórico).

---

## ✅ Estado final

| Camada | Arquivos-chave |
|---|---|
| Interface | 12 `.html` + `assets/css/global.css` + `assets/js/*` |
| API | `api/**` + `lib/**` |
| Banco | `prisma/schema.prisma` + `prisma/migrations/` + `prisma/seed.js` |
| Config | `package.json`, `vercel.json`, `.env.example`, `.gitignore` |
