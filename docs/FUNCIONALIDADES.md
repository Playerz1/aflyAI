# Funcionalidades — Prospecta IA

## Dashboard (`dashboard.html`)

### Indicadores financeiros (KPIs)
- **Faturamento Total:** soma dos pagamentos com status `pago`/`recebido`.
- **MRR (Recorrência Mensal):** soma dos contratos com status `ativo`.
- **Ticket Médio:** faturamento dividido pelo total de vendas.
- **Total de Vendas:** quantidade de contratos registrados.
- **Clientes Ativos:** usuários com status `ativo`.
- **Taxa de Conversão:** percentual de leads convertidos em vendas.

Cada KPI exibe valor principal, comparação com período anterior e indicador de crescimento/queda.

### Gráficos interativos (SVG)
- Faturamento ao longo do tempo (últimos 12 meses).
- Evolução do MRR (últimos 12 meses).
- Vendas Únicas vs Recorrentes.
- Conversão de Prospecções em Vendas.

### Filtro de período
Hoje, 7 dias, 30 dias, 90 dias, 12 meses, Personalizado.

### Outras seções
- Últimas Vendas (valor, cliente, data).
- Clientes Recentes (nome, e-mail, papel, status).
- Atividades Recentes (título, descrição, data).
- Últimas Prospecções (nome, empresa, status).
- Resumo Financeiro (vendas únicas vs receitas recorrentes).

## Prospecção (`prospeccao.html`)

### ETAPA 1 — Tipo de projeto
- Criar Site
- Criar Aplicativo

### ETAPA 2 — Nicho comercial
35 nichos disponíveis com busca:
Sorveteria, Pizzaria, Hamburgueria, Restaurante, Lanchonete, Cafeteria, Padaria, Doceria, Açaíteria, Salão de beleza, Barbearia, Clínica odontológica, Clínica médica, Academia, Personal trainer, Pet shop, Clínica veterinária, Loja de roupas, Loja de calçados, Loja de móveis, Imobiliária, Oficina mecânica, Lava-rápido, Autoescola, Hotel, Pousada, Agência de viagens, Fotógrafo, Advogado, Contabilidade, Eletricista, Encanador, Construtora, Dedetizadora, Floricultura.

### ETAPA 3 — Localização
- Seleção de estado brasileiro (todos os 26 estados + DF).
- Campo de cidade livre.

### ETAPA 4 — Prompt para Lovable
Gera um prompt contextualizado contendo:
- Tipo de projeto, nicho, cidade, estado.
- Identidade visual (preto/azul, glassmorphism).
- Estrutura de páginas e seções.
- Responsividade e experiência mobile.
- Funcionalidades específicas do segmento.
- Textos comerciais e SEO local.

Ações: copiar prompt ou abrir o Lovable em nova aba.

### ETAPA 5 — Encontrar estabelecimentos
- Estrutura preparada para integração com API de busca de estabelecimentos (ex.: Google Places).
- Cadastro manual de estabelecimento (nome, nicho, cidade, estado, telefone, site).
- Listagem em cards com botão de seleção.

## WhatsApp — Abordagens

Quatro tipos de abordagem ao selecionar um estabelecimento:

1. **Direta com demonstração:** apresenta o site criado imediatamente com link.
2. **Gradual:** inicia conversa despertando interesse, apresenta o site depois.
3. **Normal:** mensagem profissional e objetiva sobre criação de site.
4. **Personalizada:** editor de texto livre para mensagem customizada.

As mensagens são personalizadas com nome do estabelecimento, nicho, cidade e link da demonstração. Ao clicar em "Abrir WhatsApp", o navegador redireciona para `wa.me/<telefone>?text=<mensagem>`. Nenhuma mensagem é enviada automaticamente sem ação do usuário.

## Contratos (`contratos.html`)

### CRM de negociações
Cada estabelecimento prospectado gera um registro com:
- Nome, nicho, cidade, telefone.
- Data da abordagem, tipo de abordagem.
- Link do projeto criado.
- Status da negociação.

### Status disponíveis
- Em negociação
- Aguardando resposta
- Interessado
- Vendido
- Não vendido
- Sem resposta

### Registro de venda
Ao marcar como "Vendido", abre modal para cadastrar:
- Valor vendido.
- Tipo de cobrança (única ou recorrente).
- Valor mensal (quando recorrente).
- Data da venda.
- Descrição do serviço.
- Observações.

Após salvar:
- Venda única → atualiza Faturamento Total.
- Venda recorrente → atualiza MRR.
- Dashboard atualiza automaticamente.

### Filtros
Por status, nicho e período (7, 30, 90 dias).

## Regras financeiras

- Faturamento total = soma das vendas registradas (status `vendido`).
- MRR = soma das receitas recorrentes mensais ativas.
- Ticket médio = faturamento / número de vendas.
- Vendas únicas NÃO contabilizam como receita recorrente.
