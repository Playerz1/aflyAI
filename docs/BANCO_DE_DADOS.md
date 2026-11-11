# Banco de Dados — Prospecta IA

## Tecnologia

- PostgreSQL (Neon)
- Prisma ORM (v5.22.0)
- Migrações SQL na pasta `prisma/migrations/`

## Modelos principais

### User (usuário)
- `id` (cuid), `email` (único), `name`, `initials`, `passwordHash`, `plan`, `role` (admin/member/client), `status` (active/invite/blocked), `createdAt`, `updatedAt`, `lastLoginAt`.
- Relacionamentos: tickets, leads, contracts, sites, activities, projects, establishments, negotiations, sales.

### Project (projeto gerado com IA)
- `id`, `type` (site/app), `niche`, `state`, `city`, `prompt`, `lovableUrl`, `createdById`, `createdAt`, `updatedAt`.
- Relacionamentos: establishments, negotiations.

### Establishment (estabelecimento prospectado)
- `id`, `name`, `niche`, `city`, `state`, `phone`, `whatsapp`, `website`, `rating`, `address`, `projectId`, `createdById`, `createdAt`, `updatedAt`.
- Relacionamentos: negotiations, project.

### Negotiation (negociação/CRM)
- `id`, `establishmentId`, `approachType`, `status` (em_negociacao/aguardando_resposta/interessado/vendido/nao_vendido/sem_resposta), `demoLink`, `notes`, `createdById`, `projectId`, `createdAt`, `updatedAt`.
- Relacionamentos: establishment, project, sale.

### Sale (venda registrada)
- `id`, `negotiationId`, `value` (decimal), `type` (unica/recorrente), `monthlyValue`, `saleDate`, `description`, `notes`, `createdById`, `createdAt`, `updatedAt`.
- Relacionamentos: negotiation.

## Regras financeiras

- **Venda única:** valor somado ao Faturamento Total, não ao MRR.
- **Venda recorrente:** valor mensal somado ao MRR.
- Uma negociação só pode ter uma venda registrada.

## Índices

Todos os modelos possuem índices em `createdById`, campos de status e campos de data para otimizar consultas por usuário e período.

## Isolamento de dados

Todas as consultas filtram por `createdById` do usuário logado. Nenhum usuário acessa dados de outro.
