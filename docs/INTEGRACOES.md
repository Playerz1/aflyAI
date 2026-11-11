# Integrações — Prospecta IA

## Lovable (criação de projetos com IA)

O sistema gera um prompt contextualizado com todos os dados da prospecção (tipo de projeto, nicho, cidade, estado, identidade visual, estrutura de páginas, etc.).

**Como funciona:**
1. Usuário preenche as 4 primeiras etapas da prospecção.
2. O sistema monta o prompt automaticamente.
3. Existem duas opções:
   - **Copiar prompt:** copia o texto para a área de transferência.
   - **Abrir Lovable:** abre `https://lovable.dev/?prompt=<prompt_codificado>` em uma nova aba.

**Limitação:** não há integração oficial da Lovable que permita envio automático de prompt via URL com preenchimento garantido. O link abre o Lovable com o prompt na query string, mas o usuário pode precisar colar manualmente caso o preenchimento automático não funcione.

## WhatsApp

Integração via link oficial `wa.me`.

**Como funciona:**
1. Usuário seleciona um estabelecimento com telefone cadastrado.
2. Escolhe uma das 4 abordagens (direta, gradual, normal, personalizada).
3. A mensagem é pré-preenchida com dados do estabelecimento.
4. Ao clicar em "Abrir WhatsApp", o navegador redireciona para `wa.me/<telefone>?text=<mensagem>`.
5. O usuário confirma o envio no aplicativo WhatsApp.

**Não há envio automático de mensagens.** Toda ação requer confirmação do usuário.

## Pesquisa de estabelecimentos

O sistema prepara a estrutura para busca de estabelecimentos reais por nicho e localização.

**Status:** não há integração ativa com API de mapas/locais por padrão (ex.: Google Places) porque requer chave de API configurada.

**Para ativar:**
1. Obtenha uma chave de API de um provedor de locais (Google Places, Foursquare, etc.).
2. Crie uma rota serverless em `api/establishments/search` que chame a API externa.
3. Aponte o frontend de `prospeccao.html` para essa rota.

Enquanto não configurada, o usuário pode cadastrar estabelecimentos manualmente.

## APIs utilizadas (próprias)

Todas as rotas estão em `api/` e usam autenticação JWT:

- `POST /api/auth/login` — autenticação
- `POST /api/auth/logout` — encerrar sessão
- `GET /api/auth/me` — dados do usuário logado
- `POST /api/auth/forgot-password` — solicitar recuperação de senha
- `POST /api/auth/reset-password` — redefinir senha com token
- `GET/POST /api/projects` — projetos de IA
- `GET/POST /api/establishments` — estabelecimentos prospectados
- `GET /api/negotiations` — negociações do CRM
- `POST /api/sales` — registro de vendas

## Variáveis de ambiente

Consulte `docs/VARIAVEIS_AMBIENTE.md`.
