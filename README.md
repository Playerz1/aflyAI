# AflyAI — SaaS Dashboard Black & Red

SaaS com autenticação e **um único dashboard** de vendas. Os demais módulos do produto serão desenvolvidos futuramente.

## Escopo atual (intencionalmente enxuto)

- Login (`/`) e cadastro (`/cadastro`)
- **Dashboard** (`/dashboard`) com:
  - Sidebar desktop: logo, item "Dashboard" (selecionado) e botão grande vermelho "+ Adicionar"
  - Hotbar fixa no mobile: Dashboard + botão central vermelho "+" + Sair
  - Três cards: **Faturamento total**, **Ticket médio**, **Vendas totais**
  - **Gráfico de faturamento** (linha vermelha sobre fundo escuro) com seletor de período (7/30/90 dias) e indicadores ao passar o mouse
  - Modal para registrar nova venda (alimenta os cards e o gráfico)
- Identidade visual exclusivamente black & red (`#050505`, `#101010`, `#E50914`)

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Prisma + PostgreSQL (Neon) — modelos: `User`, `Session`, `Sale`
- Gráfico em SVG puro, sem dependências externas
- Sessões por cookie `httpOnly` (7 dias)

## Rodando

```bash
npm install
npx prisma db push
npm run dev      # http://localhost:3000
```

Produção:

```bash
npm run build
npm start
```

## Estrutura

```
app/
  page.tsx                 # login
  cadastro/page.tsx        # cadastro
  dashboard/               # o dashboard (única área do produto por enquanto)
  api/auth/...             # login, register, logout, me
  api/sales/route.ts       # vendas (GET/POST)
components/
  Nav.tsx                  # Sidebar (desktop) + Hotbar (mobile) + logout
  DashboardClient.tsx      # cards de estatísticas
  RevenueChart.tsx         # gráfico de faturamento interativo
  AddSaleModal.tsx         # modal de nova venda
  AuthForm.tsx             # login/cadastro
lib/
  auth.ts  db.ts
prisma/schema.prisma
```
