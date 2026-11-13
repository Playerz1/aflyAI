export type Niche = {
  id: string;
  name: string;
  category: string;
  demand: number; // 0-100
  offer: number; // 0-100
  competition: number; // 0-100
};

/**
 * Nichos de infoprodutos com estimativas iniciais de mercado.
 *
 * IMPORTANTE: Estes percentuais sao ESTIMATIVAS INICIAIS, nao estatisticas
 * reais de uma fonte pesquisada. Nao existe conexao com fonte de dados externa
 * neste projeto. Utilize apenas como referencia direcional.
 *
 * Metodologia (estimativa):
 * - Demanda: interesse potencial dos compradores por esse nicho (maior = mais procura).
 * - Oferta: quantidade relativa de produtos ja disponiveis no mercado (maior = mais opcoes a venda).
 * - Concorrencia: intensidade da disputa entre vendedores (maior = mercado mais disputado).
 *
 * Oportunidade = maior demanda + menor oferta + menor concorrencia.
 */

export const NICHES: Niche[] = [
  // Saude e bem-estar
  { id: "emagrecimento", name: "Emagrecimento", category: "Saude e bem-estar", demand: 88, offer: 72, competition: 80 },
  { id: "hipertrofia", name: "Hipertrofia e musculacao", category: "Saude e bem-estar", demand: 82, offer: 60, competition: 70 },
  { id: "alimentacao-saudavel", name: "Alimentacao saudavel", category: "Saude e bem-estar", demand: 75, offer: 55, competition: 60 },
  { id: "receitas-fitness", name: "Receitas fitness", category: "Saude e bem-estar", demand: 68, offer: 48, competition: 52 },
  { id: "saude-intestinal", name: "Saude intestinal", category: "Saude e bem-estar", demand: 70, offer: 40, competition: 45 },
  { id: "sono", name: "Sono e qualidade de vida", category: "Saude e bem-estar", demand: 72, offer: 38, competition: 42 },
  { id: "habitos-saudaveis", name: "Habitos saudaveis", category: "Saude e bem-estar", demand: 65, offer: 45, competition: 50 },
  { id: "saude-feminina", name: "Saude feminina", category: "Saude e bem-estar", demand: 78, offer: 50, competition: 58 },
  { id: "maternidade", name: "Maternidade", category: "Saude e bem-estar", demand: 80, offer: 58, competition: 65 },
  { id: "desenvolvimento-infantil", name: "Desenvolvimento infantil", category: "Saude e bem-estar", demand: 74, offer: 52, competition: 60 },

  // Educacao e conhecimento
  { id: "ingles", name: "Ingles", category: "Educacao e conhecimento", demand: 85, offer: 75, competition: 78 },
  { id: "espanhol", name: "Espanhol", category: "Educacao e conhecimento", demand: 70, offer: 55, competition: 60 },
  { id: "idiomas-viagens", name: "Idiomas para viagens", category: "Educacao e conhecimento", demand: 60, offer: 35, competition: 40 },
  { id: "enem", name: "Preparacao para ENEM", category: "Educacao e conhecimento", demand: 80, offer: 60, competition: 72 },
  { id: "concursos", name: "Concursos publicos", category: "Educacao e conhecimento", demand: 88, offer: 65, competition: 82 },
  { id: "matematica", name: "Matematica", category: "Educacao e conhecimento", demand: 65, offer: 45, competition: 55 },
  { id: "reforco-escolar", name: "Reforco escolar", category: "Educacao e conhecimento", demand: 60, offer: 40, competition: 48 },
  { id: "programacao", name: "Programacao", category: "Educacao e conhecimento", demand: 82, offer: 58, competition: 68 },
  { id: "inteligencia-artificial", name: "Inteligencia artificial", category: "Educacao e conhecimento", demand: 90, offer: 45, competition: 55 },
  { id: "excel", name: "Excel e planilhas", category: "Educacao e conhecimento", demand: 75, offer: 50, competition: 60 },

  // Marketing e internet
  { id: "marketing-digital", name: "Marketing digital", category: "Marketing e internet", demand: 85, offer: 70, competition: 78 },
  { id: "trafego-pago", name: "Trafego pago", category: "Marketing e internet", demand: 80, offer: 55, competition: 70 },
  { id: "copywriting", name: "Copywriting", category: "Marketing e internet", demand: 72, offer: 45, competition: 55 },
  { id: "social-media", name: "Social media", category: "Marketing e internet", demand: 78, offer: 60, competition: 68 },
  { id: "vendas-internet", name: "Vendas pela internet", category: "Marketing e internet", demand: 82, offer: 60, competition: 72 },
  { id: "afiliados", name: "Marketing de afiliados", category: "Marketing e internet", demand: 80, offer: 65, competition: 75 },
  { id: "ecommerce", name: "E-commerce", category: "Marketing e internet", demand: 75, offer: 60, competition: 70 },
  { id: "youtube", name: "YouTube", category: "Marketing e internet", demand: 78, offer: 65, competition: 72 },
  { id: "instagram-tiktok", name: "Instagram e TikTok", category: "Marketing e internet", demand: 82, offer: 70, competition: 78 },
  { id: "criacao-conteudo", name: "Criacao de conteudo", category: "Marketing e internet", demand: 75, offer: 55, competition: 65 },

  // Desenvolvimento pessoal e profissional
  { id: "produtividade", name: "Produtividade", category: "Desenvolvimento pessoal e profissional", demand: 72, offer: 50, competition: 60 },
  { id: "organizacao-pessoal", name: "Organizacao pessoal", category: "Desenvolvimento pessoal e profissional", demand: 68, offer: 45, competition: 52 },
  { id: "inteligencia-emocional", name: "Inteligencia emocional", category: "Desenvolvimento pessoal e profissional", demand: 78, offer: 50, competition: 60 },
  { id: "comunicacao-oratoria", name: "Comunicacao e oratoria", category: "Desenvolvimento pessoal e profissional", demand: 70, offer: 45, competition: 55 },
  { id: "desenvolvimento-pessoal", name: "Desenvolvimento pessoal", category: "Desenvolvimento pessoal e profissional", demand: 75, offer: 55, competition: 65 },
  { id: "carreira", name: "Carreira profissional", category: "Desenvolvimento pessoal e profissional", demand: 78, offer: 50, competition: 60 },
  { id: "curriculos", name: "Curriculos e entrevistas", category: "Desenvolvimento pessoal e profissional", demand: 65, offer: 40, competition: 50 },
  { id: "empreendedorismo", name: "Empreendedorismo", category: "Desenvolvimento pessoal e profissional", demand: 80, offer: 60, competition: 70 },
  { id: "pequenos-negocios", name: "Pequenos negocios", category: "Desenvolvimento pessoal e profissional", demand: 75, offer: 50, competition: 60 },
  { id: "gestao-tempo", name: "Gestao de tempo", category: "Desenvolvimento pessoal e profissional", demand: 70, offer: 45, competition: 55 },

  // Hobbies e habilidades
  { id: "confeitaria", name: "Confeitaria", category: "Hobbies e habilidades", demand: 75, offer: 50, competition: 60 },
  { id: "panificacao", name: "Panificacao", category: "Hobbies e habilidades", demand: 65, offer: 40, competition: 48 },
  { id: "marmitas", name: "Marmitas e culinaria", category: "Hobbies e habilidades", demand: 70, offer: 45, competition: 55 },
  { id: "artesanato", name: "Artesanato", category: "Hobbies e habilidades", demand: 60, offer: 40, competition: 48 },
  { id: "jardinagem", name: "Jardinagem", category: "Hobbies e habilidades", demand: 58, offer: 35, competition: 42 },
  { id: "plantas-ornamentais", name: "Plantas ornamentais", category: "Hobbies e habilidades", demand: 60, offer: 38, competition: 45 },
  { id: "cachorros", name: "Cuidados com cachorros", category: "Hobbies e habilidades", demand: 72, offer: 45, competition: 55 },
  { id: "gatos", name: "Cuidados com gatos", category: "Hobbies e habilidades", demand: 68, offer: 42, competition: 50 },
  { id: "adestramento", name: "Adestramento de caes", category: "Hobbies e habilidades", demand: 65, offer: 40, competition: 48 },
  { id: "fotografia-celular", name: "Fotografia com celular", category: "Hobbies e habilidades", demand: 68, offer: 45, competition: 55 },

  // Beleza, estilo e criatividade
  { id: "maquiagem", name: "Maquiagem", category: "Beleza, estilo e criatividade", demand: 78, offer: 60, competition: 70 },
  { id: "skincare", name: "Skincare", category: "Beleza, estilo e criatividade", demand: 80, offer: 55, competition: 65 },
  { id: "cabelos", name: "Cuidados com cabelos", category: "Beleza, estilo e criatividade", demand: 72, offer: 50, competition: 60 },
  { id: "unhas", name: "Design de unhas", category: "Beleza, estilo e criatividade", demand: 70, offer: 48, competition: 58 },
  { id: "moda", name: "Moda e estilo", category: "Beleza, estilo e criatividade", demand: 75, offer: 55, competition: 65 },
  { id: "decoracao", name: "Decoracao de interiores", category: "Beleza, estilo e criatividade", demand: 68, offer: 45, competition: 55 },
  { id: "fotografia-produtos", name: "Fotografia de produtos", category: "Beleza, estilo e criatividade", demand: 62, offer: 40, competition: 50 },
  { id: "violao", name: "Violao e musica", category: "Beleza, estilo e criatividade", demand: 65, offer: 45, competition: 55 },
  { id: "desenho", name: "Desenho e ilustracao", category: "Beleza, estilo e criatividade", demand: 68, offer: 48, competition: 58 },
  { id: "design-grafico", name: "Design grafico", category: "Beleza, estilo e criatividade", demand: 75, offer: 55, competition: 65 },
];

export const CATEGORIES = [
  "Saude e bem-estar",
  "Educacao e conhecimento",
  "Marketing e internet",
  "Desenvolvimento pessoal e profissional",
  "Hobbies e habilidades",
  "Beleza, estilo e criatividade",
];

export const NICHE_METHODOLOGY = {
  title: "Sobre os percentuais de mercado",
  notice:
    "Os percentuais exibidos sao estimativas iniciais, nao estatisticas reais de uma fonte pesquisada. " +
    "Nao ha conexao com fonte de dados externa neste projeto. Utilize-os apenas como referencia direcional " +
    "para planejar seu infoproduto.",
  indicators: {
    demand: "Demanda: interesse potencial dos compradores por esse nicho (maior = mais procura).",
    offer: "Oferta: quantidade relativa de produtos ja disponiveis no mercado (maior = mais opcoes a venda).",
    competition: "Concorrencia: intensidade da disputa entre vendedores (maior = mercado mais disputado).",
  },
  opportunity: "Oportunidade indica onde ha maior demanda com menor oferta e menor concorrencia.",
};
