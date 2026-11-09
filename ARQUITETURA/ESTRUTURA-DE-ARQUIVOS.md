# 🗂️ Estrutura de arquivos — o que é cada um

> Atualizado em 2026-11-09. Tudo parte da raiz `saas/`.
> Arquivos marcados com 🔒 nunca vão para o Git (ou não devem ir).

---

## 1. Documentação (esta pasta)

```
ARQUITETURA/
├── README.md                    Visão geral + índice (comece por aqui)
├── ESTRUTURA-DE-ARQUIVOS.md     Este arquivo: mapa técnico
├── PAGINAS-E-FUNCIONALIDADES.md Telas, fluxos e componentes de UI
├── BANCO-DE-DADOS.md            Neon + Prisma: modelo, API, segurança
├── COMO-RODAR-E-DEPLOY.md       Comandos, .env e Vercel
└── HISTORICO.md                 O que foi feito em cada etapa
```

---

## 2. Frontend — páginas HTML (raiz)

Todas as páginas carregam `assets/css/global.css` e o conjunto de scripts no
final do `<body>`. A navegação é por links diretos entre os arquivos.

| Página | Para quem | Para que serve |
|---|---|---|
| `dashboard.html` | Todos | Visão geral: KPIs, gráfico, funil, contratos recentes, atividades |
| `prospectar.html` | Todos | Lista de leads, busca, filtros por status, buscas salvas, automações |
| `contratos.html` | Todos | Contratos, filtros, detalhe com timeline/faturas, novo contrato |
| `sites.html` | Todos | Criar site com IA (MVP) e lista de sites publicados |
| `editor.html` | Todos | Editor visual com prévia ao vivo (conteúdo, design, SEO) |
| `equipes.html` | Todos | Membros, cargos/permissões, desempenho, assentos |
| `extensao.html` | Todos | Chave de API, snippet, instalação, capturas, preferências |
| `configuracoes.html` | Todos | Abas: Perfil, Conta e segurança, Notificações, Plano |
| `admin-login.html` | Administração | Entrada do painel admin (JWT em cookie) |
| `admin.html` | 🔒 Admin | Painel: fila de tickets, motivos, últimos usuários |
| `tickets.html` | 🔒 Admin | Inbox de atendimento: lista + conversa + detalhes |
| `usuarios.html` | 🔒 Admin | Usuários: KPIs, busca, filtros, criar/bloquear, nota interna |

> 🔒 = a página existe no site para todos, mas **só renderiza conteúdo** com
> sessão de admin válida (o backend responde 403/401 e o front redireciona
> para `admin-login.html`).

### Como cada página se identifica

```html
<body data-page="dashboard">        <!-- marca o item ativo da sidebar -->
<body data-page="tickets" data-role="admin">  <!-- área restrita -->
```

O `data-page` é lido por `app.js` para pintar o menu (`is-active`).

---

## 3. Frontend — CSS

```
assets/css/global.css      ← ÚNICO arquivo de estilo do projeto
```

Está dividido em seções, nesta ordem:

| Seção | Conteúdo |
|---|---|
| `:root` | Design tokens: cores, raios, sombras, larguras, transições |
| 1. App shell | Sidebar, topbar, conteúdo, overlay do menu mobile |
| 2. Componentes | Botões, cards, KPIs, badges, tabelas, formulários, abas, modal, toast, gráfico, editor |
| 3. Responsivo | Breakpoints 1340 / 1180 / 900 / 860 / 420 px |
| 4. Suporte | Painel lateral da Central de ajuda + chat |
| 5. Admin | Inbox de tickets (lista + conversa), tabela de usuários |

Regras importantes:
- **Mobile**: `.table--cards` transforma linhas de tabela em cartões empilhados.
- **Nada de estilo inline repetido**: variantes são classes (`.kpi__icon--success`).
- Para mudar a identidade visual, edite **só** os tokens em `:root`.

---

## 4. Frontend — JavaScript

```
assets/js/
├── app.js          Base comum de todas as páginas
├── store.js        Camada de dados (API ↔ cache ↔ fallback)
├── support.js      Central de ajuda (formulário + chat)
├── admin-auth.js   Guarda de acesso simulada do painel (MVP)
└── admin-ui.js     Componentes visuais do admin (opcional/auxiliar)
```

> ⚠️ **Atenção ao `admin-auth.js`**: ele é a **trava visual** do MVP (esconde o
> menu e redireciona a página). A trava **real** de segurança está no backend
> (`lib/auth.js` + `requireAdmin`). As páginas admin já usam a sessão do banco
> (`window.Dados.ehAdmin()`), então mesmo com o `admin-auth.js` apagado o
> acesso continua bloqueado desde que todas as chamadas passem por `/api/*`.

### `app.js` — funções principais

| Função | O que faz |
|---|---|
| `initSidebar()` | Abre/fecha o menu mobile (hambúrguer + overlay + ESC) |
| `initActiveNav()` | Marca o item do menu conforme `data-page` |
| `initTabs()` | Abas com `data-tabs` / `data-target` / `data-panel` |
| `initSegmented()` | Botão de 3 estados (30d / 90d / 12m etc.) |
| `initChips()` | Filtros de chip + `filterRows()` nas tabelas |
| `initTableSearch()` | Busca `data-search="#id-da-tabela"` |
| `initModals()` | Abre/fecha modais (`data-modal-open` / `data-modal-close`) |
| `toast(title, msg)` | Notificação no canto |
| `initSwitches()` | Interruptores com `data-remember` (localStorage) |
| `initCopy()` | Botões `data-copy="#seletor"` |
| `initCounters()` | Contadores animados dos KPIs (`data-count`) |
| `initSupportPanel()` | Abre o painel da Central de ajuda |
| `initSwitches()`, `initCopy()`, `initCounters()` | Interruptores lembrados, copiar, contadores animados |
| `window.Prospecta` | API pública: `toast`, `openModal`, `closeModals` |

### `store.js` — a camada de dados

Expõe `window.Dados`, com uma estratégia em três níveis:

1. **Modo API** (produção): todas as operações chamam `/api/*` com
   `credentials: 'include'` (cookie HttpOnly). Cartões, usuários e tickets vêm
   do PostgreSQL.
2. **Cache em memória**: as páginas são síncronas, então o resultado fica em
   `state` e os eventos `prospecta:mudou` avisam a tela para repintar.
3. **Fallback local**: **somente** quando `/api/*` não existe (abrir o HTML
   sem servidor). Serve para navegar no layout, nunca para dados reais.

*Métodos síncronos* (leem o cache; a tela precisa chamar `await Dados.pronto()`
antes do primeiro render): `usuarios()`, `tickets()`, `ehAdmin()`, `eu()`,
`hora()`, `haQuanto()`, `esc()`, `ultimaMensagem()`, `naoLidas()`.

*Métodos assíncronos* (vão ao banco): `login(email, senha)`,
`sairAdmin()`, `refresh()`,
`criarUsuario()`, `atualizarUsuario()`,
`criarTicket()`, `atualizarTicket()`, `enviarMensagem()`, `carregarTicket()`.

```js
await Dados.pronto();               // espera a sessão + dados
var eu = Dados.eu();                // usuário logado (ou null)
Dados.ehAdmin();                    // papel === 'admin'
await Dados.criarTicket({ subject, description, reason, priority, origin });
await Dados.enviarMensagem(ticketId, "texto");
```

### `support.js` — Central de ajuda

- Formulário: assunto, descrição, **motivo** (6 opções), prioridade.
- Cria o ticket via API e abre o **chat** no mesmo painel.
- Lista "Meus atendimentos" com status e mensagens não lidas.
- Respostas do admin chegam via `GET /api/tickets` e são marcadas como lidas.

---

## 5. Backend — API serverless (`api/`)

Formato **Vercel Functions** (cada arquivo exporta `(req, res)`).
Roteamento é por pasta:

```
api/
├── auth/
│   ├── login.js                  POST /api/auth/login
│   ├── logout.js                 POST /api/auth/logout
│   ├── me.js                     GET  /api/auth/me
│   ├── signup.js                 POST /api/auth/signup   (cadastro público, cria member)
│   └── register.js               POST /api/auth/register (admin cria usuário com papel)
├── users/
│   ├── index.js                  GET, POST /api/users
│   └── [id].js                   GET, PATCH, DELETE /api/users/:id
└── tickets/
    ├── index.js                  GET, POST /api/tickets
    ├── [id].js                   GET, PATCH /api/tickets/:id
    └── [id]/
        └── messages.js           POST /api/tickets/:id/messages
```

> Caminhos com `[id]` são **segmentos dinâmicos** da Vercel (`req.query.id`).

Cada handler:
1. Valida o método (`methodNotAllowed`).
2. Lê o corpo com `readJson` (limite de 1 MB).
3. Valida com **Zod**.
4. Confere sessão (`requireAuth` / `requireAdmin`).
5. Fala com o banco via Prisma.
6. Devolve JSON; erros passam por `handleError`.

---

## 6. Backend — bibliotecas (`lib/`)

| Arquivo | Responsabilidade |
|---|---|
| `lib/prisma.js` | Cliente Prisma **singleton** (importante em serverless: evita abrir conexão a cada invocação) |
| `lib/auth.js` | Assina/verifica JWT, lê o cookie da sessão, `requireAuth`, `requireAdmin` |
| `lib/http.js` | `json()`, `readJson()`, cookies (`setCookie`/`clearCookie`/`parseCookies`), `safeUser()` (remove `passwordHash`), `handleError()` (traduz erros Prisma/Zod) |
| `lib/auth.js` também expõe | `setSessionCookie(res, user)` usado no cadastro |


---

## 7. Banco de dados (`prisma/`)

```
prisma/
├── schema.prisma                      Modelo (users, tickets, ticket_messages)
├── migrations/
│   └── 20261109004345_init/
│       └── migration.sql              SQL aplicado no Neon
└── seed.js                            Cria o usuário admin inicial
```

Detalhes completos em [`BANCO-DE-DADOS.md`](BANCO-DE-DADOS.md).

---

## 8. Configuração e infraestrutura

| Arquivo | Função | Vai para o Git? |
|---|---|---|
| `package.json` | Dependências e scripts (`dev`, `build`, `db:migrate`, `db:seed`…) | ✅ |
| `package-lock.json` | Versões exatas instaladas | ✅ |
| `vercel.json` | `maxDuration` das funções | ✅ |
| `.env` | **Segredos reais** (`DATABASE_URL`, `JWT_SECRET`…) | ❌ (no `.gitignore`) |
| `.env.example` | Modelo das variáveis, sem valores reais | ✅ |
| `.gitignore` | Ignora `node_modules`, `.env`, `.vercel`, logs | ✅ |
| `.serve.cjs` | Servidor estático de desenvolvimento (porta 5174) | ✅ (só dev) |

---

## 9. Pasta de QA (`qa/` e `.qa/`)

Scripts de teste automatizado (Playwright) e capturas de tela usados durante o
desenvolvimento. **Não fazem parte do produto** — podem ser apagados sem
quebrar nada.

| Item | Uso |
|---|---|
| `qa/shot.cjs` | Screenshot de uma página em um tamanho de tela |
| `qa/all.cjs` | Roda todas as páginas em desktop/tablet/mobile e aponta erros/overflow |
| `qa/admin-flow.mjs` | Testa o fluxo cliente → admin → cliente |
| `.qa/*.png` | Evidências visuais dos testes |

---

## 10. Arquivos que **não** devem existir em produção

Lista de limpeza segura (não apague sem revisar):

- `node_modules/` (reinstalável com `npm install`)
- `.qa/` e `qa/` (testes)
- `.serve.cjs` (servidor de dev — a Vercel não precisa)
- `ARQUITETURA/` (documentação; pode ficar no repositório, mas não é servida útil)
