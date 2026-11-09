# 🖥️ Páginas e funcionalidades

> Como o produto se comporta na tela, quais fluxos existem e como o layout se
> adapta entre computador e celular.

---

## 1. Padrão visual compartilhado

Todas as telas do app (exceto login) usam o mesmo "casco":

```
┌──────────────┬─────────────────────────────────────────────┐
│              │  TOPBAR  (título, busca, notificações, avatar)│
│   SIDEBAR    ├─────────────────────────────────────────────┤
│  (menu)      │                                             │
│              │   CONTENT  (conteúdo da página)             │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

### Sidebar
- **Desktop (≥861 px)**: fixa à esquerda, 248 px, fundo escuro `#12142b`.
- **Mobile (≤860 px)**: escondida; o botão ☰ na topbar abre um menu deslizante
  com fundo escurecido. Fecha ao clicar fora, ao escolher um item ou com `ESC`.
- Grupos: **Principal** (Dashboard, Prospectar, Contratos),
  **Produto** (Sites, Equipes, Extensão) e **Conta** (Configuração, Ajuda).
- No modo admin, o grupo **Administração** aparece no topo.

### Topbar
- Botão de menu (só mobile), título + breadcrumb, sino de notificações e
  menu do usuário.

### Responsividade
| Largura | Comportamento |
|---|---|
| ≥ 1340 px | Layout completo; KPIs em 4 colunas; editor 2 colunas |
| 1180–1340 px | KPIs em 2 colunas; coluna lateral desce para baixo |
| 861–1180 px | Editor empilha; tabelas continuam em tabela |
| ≤ 860 px | Sidebar vira drawer; KPIs 2 colunas; **tabelas viram cartões**; modais sobem de baixo; Central de ajuda ocupa a tela |
| ≤ 420 px | Tudo em 1 coluna |

---

## 2. Telas do cliente

### 2.1 `dashboard.html`
- Saudação + data.
- **4 KPIs** com contador animado: Leads prospectados, Contratos ativos,
  Taxa de conversão, Sites publicados (cada um com tendência).
- **Banner** de leads esperando contato (atalho para Prospectar).
- **Gráfico de barras** de desempenho (leads vs. contratos, 11 meses) com
  seletor 30d / 90d / 12m.
- **Funil de vendas** com 5 etapas em barras de progresso.
- **Top desempenho** da equipe.
- **Contratos recentes** (tabela) e **Atividade** (últimas 24h).

### 2.2 `prospectar.html`
- 4 KPIs: total de leads, qualificados, aguardando contato, taxa de resposta.
- **Tabela de leads** com busca instantânea e filtros por chip
  (Todos / Novos / Qualificados / Contatados / Perdidos).
- Cada linha mostra empresa, contato, segmento, score colorido, status e ação.
- **Buscas salvas** (3 exemplos) e **Automações** (interruptores).
- Modais: **Nova busca** (segmento, cidade, quantidade, filtros) e
  **Importar CSV** (área de arrastar).

### 2.3 `contratos.html`
- 4 KPIs: ativos, receita recorrente, aguardando assinatura, renovação.
- Tabela com filtros por status (Ativo / Pendente / Em revisão / Encerrado).
- Barra lateral: **Receita por serviço** e **Próximas renovações**.
- Banner de aviso de vencimento.
- Modais: **Novo contrato** (cliente, serviço, valor, cobrança, obs.) e
  **Detalhe do contrato** (timeline + faturas em abas).

### 2.4 `sites.html`
- **Criação rápida**: nome do negócio + categoria + WhatsApp →
  botão "Gerar site com IA" leva ao editor.
- Mini-preview com navegador desenhado em CSS.
- 4 KPIs: sites publicados, visitas, leads recebidos, rascunhos.
- Tabela de sites com domínio, visitas, status e botão Editar/Publicar.

### 2.5 `editor.html`
- Coluna esquerda com 3 abas:
  - **Conteúdo** — nome, slogan, título, subtítulo, botão, WhatsApp e
    interruptores de seção (Hero, Diferenciais, Contato).
  - **Design** — 6 paletas, fonte, cantos, toggles de layout.
  - **SEO** — título, descrição, subdomínio e prévia do Google.
- Coluna direita: **prévia ao vivo** que reage a cada tecla, com alternância
  Desktop / Mobile (`390 px`).
- Botões Salvar, Publicar e Compartilhar (com feedback em toast).

### 2.6 `equipes.html`
- 4 KPIs (membros ativos, contratos do mês, tempo de resposta, convites).
- Tabela de membros com cargo, contratos e status (Ativo / Convite enviado).
- Lateral: **Desempenho do mês**, **Cargos e permissões**, **Assentos**.
- Modal **Convidar membro** (e-mail, cargo, mensagem).

### 2.7 `extensao.html`
- Hero com mock da extensão do navegador.
- **Chave de API** com botão copiar e rotacionar.
- **Como instalar** em 4 passos (timeline).
- **Snippet** para captura no site do cliente.
- Lateral: capturas recentes, preferências e aviso de segurança.

### 2.8 `configuracoes.html`
Quatro abas: **Perfil** (dados e foto), **Conta e segurança** (senha, 2FA,
sessões, excluir conta), **Notificações** (e-mail, push, horário de silêncio) e
**Plano e cobrança** (plano atual + 3 planos comparados).

---

## 3. Central de ajuda (em todas as páginas)

Botão **Ajuda** no fim da sidebar. Abre um painel lateral (no celular, uma
folha que sobe de baixo):

1. **Lista** de "Meus atendimentos" + botão **Abrir atendimento**.
2. **Formulário**:
   - Dúvida ou pergunta (assunto);
   - Descrição detalhada (opcional);
   - **Motivo**: Dúvida de uso · Problema em um site · Contrato e cobrança ·
     Leads ou extensão · Acesso e login · Outro assunto;
   - Prioridade: Baixa / Média / Alta.
   - Botão **Criar ticket**.
3. **Chat** embaixo: histórico da conversa, campo de mensagem
   (Enter envia, Shift+Enter quebra linha) e status do ticket.
4. O ticket é gravado no **PostgreSQL**; o admin responde em `tickets.html` e
   a resposta aparece no chat do cliente.

---

## 4. Telas do administrador

### 4.1 `admin-login.html`
- E-mail + senha; valida no backend (`POST /api/auth/login`).
- Sessão em cookie HttpOnly (7 dias).
- Erros claros (e-mail não é admin, senha errada, usuário bloqueado).

### 4.2 `admin.html` — Painel
- 4 KPIs: tickets abertos (+ espera do mais antigo), respondidos hoje, tempo
  médio de resposta, usuários ativos.
- **Fila de atendimento**: 5 tickets mais antigos, clicáveis (abrem o ticket).
- **Tickets por motivo** em barras.
- **Últimos usuários** e aviso de área restrita.

### 4.3 `tickets.html` — Inbox
- Filtros: Todos / Abertos / Respondidos / Resolvidos + busca por cliente,
  assunto ou `#id`.
- Lista à esquerda (avatar, nome, assunto, status, "N novas").
- Conversa à direita: mensagens do cliente à esquerda (claras) e do admin à
  direita (roxas), com horário.
- **Respostas rápidas** de um clique, campo de resposta, troca de status e
  botão **Resolver** (envia mensagem de encerramento).
- Card de **detalhes** (motivo, prioridade, plano, origem, mensagens, espera).

### 4.4 `usuarios.html`
- 4 KPIs: total, ativos, convites pendentes, bloqueados.
- Tabela: usuário, papel, tickets, último acesso, status, ações.
- Busca por nome/e-mail/cargo + filtro por status e por papel.
- **Novo usuário** (convite) e **Ver** (detalhe + nota interna do admin).
- Ações: Bloquear / Desbloquear / Reenviar convite.

---

## 5. Componentes reutilizáveis (classes do CSS)

| Componente | Classes |
|---|---|
| Botões | `.btn`, `.btn--primary`, `.btn--outline`, `.btn--ghost`, `.btn--sm`, `.btn--block` |
| Cartões | `.card`, `.card__head`, `.card__body`, `.card__foot` |
| KPI | `.kpi`, `.kpi__icon--*`, `.kpi__value`, `.trend--up/down/flat` |
| Status | `.badge--success/warn/danger/info/primary/neutral`, `.st--aberto/respondido/resolvido` |
| Tabela | `.table`, `.table--cards` (mobile), `.table--compact` |
| Formulário | `.field`, `.label`, `.input`, `.select`, `.textarea`, `.switch`, `.radio-card` |
| Abas | `.tabs`, `.tab`, `.tab.is-active` |
| Modal/Toast | `.modal.is-open`, `.toast.is-open` |
| Chat | `.chat`, `.msg--in`, `.msg--out`, `.composer` |

### Atributos de comportamento (data-*)

| Atributo | Efeito |
|---|---|
| `data-menu-toggle` | Abre/fecha o menu mobile |
| `data-toast="Título\|Texto"` | Clique mostra notificação |
| `data-modal-open="id"` / `data-modal-close` | Abre/fecha modal |
| `data-search="#tabela"` | Busca instantânea na tabela |
| `data-chip-group` + `data-filter` | Filtro por status |
| `data-tabs` / `data-target` / `data-panel` | Abas |
| `data-count` | Contador animado |
| `data-copy="#seletor"` | Copiar conteúdo |
| `data-remember="chave"` | Interruptor lembrado no navegador |
| `data-support-toggle` | Abre a Central de ajuda |
| `data-wa-help` | (removido) atalho antigo de WhatsApp |
