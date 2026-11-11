# Prospecta IA — SaaS de Prospeção e Criação de Sites com IA

## O que é o Prospecta IA

O Prospecta IA é uma plataforma SaaS premium voltada para empreendedores digitais e agências que desejam:

- Criar sites e aplicativos com IA (via Lovable)
- Prospectar estabelecimentos comerciais por nicho e localização
- Abordar clientes pelo WhatsApp com mensagens prontas e personalizadas
- Gerenciar negociações em um CRM integrado
- Controlar faturamento, MRR e taxa de conversão em um dashboard financeiro

## Tecnologias utilizadas

- **Frontend:** HTML5, CSS3, JavaScript vanilla (módulos separados por página)
- **Estilo:** CSS com variáveis (`:root`), glassmorphism, gradientes preto/azul, animações fluidas
- **Backend:** Node.js + Vercel Serverless Functions (API routes em `api/`)
- **Banco de dados:** PostgreSQL (Neon) + Prisma ORM
- **Autenticação:** JWT com cookies httpOnly + bcryptjs
- **Validação:** Zod
- **Deploy:** Vercel

## Como iniciar o projeto

### Pré-requisitos

- Node.js >= 18
- Conta no Vercel
- Banco de dados PostgreSQL (recomendado: Neon)
- Variáveis de ambiente configuradas

### Instalação

```bash
# 1. Clone o repositório
git clone <repositorio>
cd prospecta-saas

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com DATABASE_URL, JWT_SECRET e outras variáveis

# 4. Gere o cliente Prisma
npx prisma generate

# 5. Execute as migrações (se houver banco conectado)
npx prisma migrate dev --name init

# 6. Rode em modo desenvolvimento
npm run dev
```

O servidor de desenvolvimento ficará disponível em `http://localhost:5174`.

## Como acessar as páginas

| Página | Caminho | Descrição |
|--------|---------|-----------|
| Landing | `index.html` | Página inicial com apresentação do produto |
| Dashboard | `dashboard.html` | Indicadores financeiros, gráficos e listas recentes |
| Prospecção | `prospeccao.html` | Fluxo de 5 etapas: projeto → nicho → localização → prompt → estabelecimentos |
| Contratos | `contratos.html` | CRM de negociações, registro de vendas e WhatsApp |

## Estrutura de pastas

```
/prospecta-saas
├── index.html              # Landing page
├── dashboard.html          # Dashboard financeiro
├── prospeccao.html         # Fluxo de prospecção
├── contratos.html          # CRM de negociações
├── login.html              # Autenticação (existente)
├── css/
│   └── global.css          # CSS global (variáveis, componentes, responsividade)
├── js/
│   ├── global.js           # Utilitários compartilhados (toast, API, auth)
│   ├── dashboard.js        # Lógica do dashboard (KPIs, gráficos SVG)
│   ├── prospeccao.js       # Lógica do fluxo de prospecção
│   └── contratos.js        # Lógica do CRM (vendas, WhatsApp)
├── api/
│   ├── auth/               # Autenticação (login, logout, me, forgot, reset)
│   ├── projects/           # Projetos (CRUD)
│   ├── establishments/     # Estabelecimentos prospectados
│   ├── negotiations/       # Negociações (CRM)
│   ├── sales/              # Vendas registradas
│   ├── tickets/            # Tickets de suporte (existente)
│   ├── users/              # Usuários
│   └── ...                 # Outras APIs existentes
├── prisma/
│   ├── schema.prisma       # Modelo de dados
│   └── migrations/         # Migrações SQL
├── docs/                   # Documentação completa
└── vercel.json             # Configuração do deploy na Vercel
```

## Banco de dados

Verifique `docs/BANCO_DE_DADOS.md` para detalhes dos modelos Prisma e relacionamentos.

## Deploy

Verifique `docs/DEPLOY.md` para instruções de publicação na Vercel.

## Variáveis de ambiente

Verifique `docs/VARIAVEIS_AMBIENTE.md` para a lista completa de variáveis necessárias.
