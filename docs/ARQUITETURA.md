# Arquitetura — Prospecta IA

## Estrutura geral

O projeto segue uma separação de responsabilidades clara entre frontend estático e backend serverless (Vercel Functions).

```
/
├── *.html                  # Páginas independentes (SPA-like com navegação via links)
├── css/global.css          # Design system compartilhado (variáveis, componentes)
├── js/global.js            # Utilitários globais (toast, API fetch, auth, formatação)
├── js/dashboard.js         # Lógica exclusiva do dashboard
├── js/prospeccao.js        # Lógica exclusiva do fluxo de prospecção
├── js/contratos.js         # Lógica exclusiva do CRM de negociações
├── api/                    # Funções serverless (Node.js @vercel/node)
├── prisma/                 # Modelo de dados e migrações
├── docs/                   # Documentação
└── vercel.json             # Configuração da Vercel
```

## Responsabilidade de cada arquivo

| Arquivo | Responsabilidade |
|---------|-----------------|
| `css/global.css` | Variáveis de cor, glassmorphism, botões, inputs, cards, sidebar, topbar, tabelas, modais, toast, responsividade |
| `js/global.js` | `window.Prospecta`: toast, formatação (dinheiro, data), chamadas à API (`fetch`), estado de sessão (localStorage), escape HTML |
| `js/dashboard.js` | Cálculo de KPIs, desenho de gráficos SVG (área), renderização de listas recentes, filtro de período |
| `js/prospeccao.js` | Fluxo de 5 etapas, geração de prompt Lovable, busca de estabelecimentos, modal de abordagem WhatsApp |
| `js/contratos.js` | Listagem de negociações, filtros (status, nicho, período), modal de registro de venda, integração WhatsApp (wa.me) |
| `api/*/index.js` | Endpoints serverless com autenticação JWT, validação Zod, Prisma |

## Fluxo frontend ↔ backend

1. Usuário acessa uma página HTML estática.
2. `js/global.js` verifica sessão em `localStorage` (`prospecta:session`).
3. Se não autenticado, redireciona para `login.html`.
4. As páginas chamam `Prospecta.api('/api/...')` que faz `fetch` com `credentials: 'include'`.
5. As APIs validam o JWT via cookie e retornam JSON.
6. Dados são renderizados no DOM sem recarregar a página (exceto navegação entre HTMLs).

## Comunicação entre módulos

- `window.Prospecta` expõe utilitários globais para todas as páginas.
- `window.ProspectaContratos` expõe métodos do CRM (`openWhatsApp`, `viewDetail`, `registerSale`).
- `window.ProspectaProspeccao` expõe métodos da prospecção (`selectEstablishment`, `deleteEstablishment`).

## Autenticação

- Login em `api/auth/login.js` valida credenciais com bcrypt e gera JWT.
- Token armazenado em cookie `prospecta_session` (httpOnly, SameSite Lax).
- Middleware `requireAuth` / `requireAdmin` em `lib/auth.js` protege rotas.
- `api/auth/me.js` retorna dados do usuário logado.

## Banco de dados

PostgreSQL via Prisma ORM. Modelo inclui Users, Projects, Establishments, Negotiations, Sales, além dos modelos existentes (Tickets, Leads, Contracts, Payments, Sites, Activities).
