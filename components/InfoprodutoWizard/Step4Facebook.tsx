"use client";

import { useCallback, useMemo, useState } from "react";
import type { ModuleData } from "./Step2Product";

type Approach = {
  title: string;
  type: string;
  text: string;
};

type Props = {
  niche: any;
  product: any;
  price: number | null;
  searches: string[];
  approaches: Approach[];
  onSearchesChange: (searches: string[]) => void;
  onApproachesChange: (approaches: Approach[]) => void;
  onGenerateApproaches: () => void;
};

const KEYWORDS_BY_NICHE: Record<string, string[]> = {
  emagrecimento: ["emagrecimento", "dieta", "alimentacao saudavel", "perder peso", "receitas fitness"],
  hipertrofia: ["academia", "musculacao", "treino", "hipertrofia", "fitness"],
  "alimentacao-saudavel": ["alimentacao saudavel", "nutricao", "receitas saudaveis", "bem-estar", "dieta"],
  "receitas-fitness": ["receitas fitness", "cozinha fit", "alimentacao saudavel", "receitas light", "culinaria"],
  "saude-intestinal": ["saude intestinal", "digestao", "microbiota", "bem-estar", "alimentacao"],
  sono: ["sono", "qualidade do sono", "insonia", "sono reparador", "bem-estar"],
  "habitos-saudaveis": ["habitos saudaveis", "estilo de vida", "bem-estar", "rotina saudavel", "saude"],
  "saude-feminina": ["saude feminina", "saude da mulher", "ginecologia", "bem-estar feminino", "autocuidado"],
  maternidade: ["maternidade", "gravidez", "bebe", "pos-parto", "cuidados com bebe"],
  "desenvolvimento-infantil": ["desenvolvimento infantil", "educacao infantil", "criancas", "pedagogia", "brincadeiras"],
  ingles: ["idiomas", "ingles", "aprender ingles", "curso de ingles", "intercambio"],
  espanhol: ["idiomas", "espanhol", "aprender espanhol", "curso de espanhol", "intercambio"],
  "idiomas-viagens": ["idiomas", "viagem", "viagens", "turismo", "aprender ingles"],
  enem: ["enem", "vestibular", "estudo", "concurso", "preparacao"],
  concursos: ["concursos publicos", "concurso", "estudo para concurso", "edital", "aprovacao"],
  matematica: ["matematica", "estudo", "reforco escolar", "exercicios", "aprendizagem"],
  "reforco-escolar": ["reforco escolar", "estudo", "aulas particulares", "educacao", "alunos"],
  programacao: ["programacao", "codigo", "desenvolvimento", "tecnologia", "web"],
  "inteligencia-artificial": ["inteligencia artificial", "IA", "ia generativa", "tecnologia", "automacao"],
  excel: ["excel", "planilhas", "office", "produtividade", "dados"],
  "marketing-digital": ["marketing digital", "marketing", "publicidade", "negocios online", "vendas"],
  "trafego-pago": ["trafego pago", "ads", "facebook ads", "google ads", "marketing digital"],
  copywriting: ["copywriting", "escrita persuasiva", "vendas", "marketing", "copy"],
  "social-media": ["social media", "instagram", "redes sociais", "criacao de conteudo", "gestor"],
  "vendas-internet": ["vendas pela internet", "vendas online", "e-commerce", "marketing", "divulgacao"],
  afiliados: ["marketing de afiliados", "afiliados", "produtos digitais", "hotmart", "monetizacao"],
  ecommerce: ["e-commerce", "loja virtual", "vendas online", "dropshipping", "empreendedorismo"],
  youtube: ["youtube", "youtuber", "conteudo em video", "canal do youtube", "video"],
  "instagram-tiktok": ["instagram", "tiktok", "redes sociais", "influenciador", "conteudo"],
  "criacao-conteudo": ["criacao de conteudo", "conteudo", "redes sociais", "criador", "marketing de conteudo"],
  produtividade: ["produtividade", "organizacao", "gestao de tempo", "foco", "eficiencia"],
  "organizacao-pessoal": ["organizacao pessoal", "organizacao", "planejamento", "rotina", "produtividade"],
  "inteligencia-emocional": ["inteligencia emocional", "emocoes", "autoconhecimento", "psicologia", "bem-estar"],
  "comunicacao-oratoria": ["comunicacao", "oratoria", "falar em publico", "apresentacao", "desenvolvimento pessoal"],
  "desenvolvimento-pessoal": ["desenvolvimento pessoal", "autoconhecimento", "crescimento pessoal", "motivacao", "psicologia"],
  carreira: ["carreira profissional", "emprego", "curriculo", "entrevista", "crescimento profissional"],
  curriculos: ["curriculo", "curriculum", "entrevista de emprego", "carreira", "vagas"],
  empreendedorismo: ["empreendedorismo", "negocios", "empresa", "startup", "inovacao"],
  "pequenos-negocios": ["pequenos negocios", "microempresa", "empreendedorismo", "vendas", "gestao"],
  "gestao-tempo": ["gestao de tempo", "produtividade", "organizacao", "planejamento", "foco"],
  confeitaria: ["confeitaria", "bolos", "doces", "confeiteiros", "receitas de doces"],
  panificacao: ["panificacao", "padaria", "pao", "receitas de pao", "culinaria"],
  marmitas: ["marmitas", "culinaria", "receitas", "comida caseira", "alimentacao"],
  artesanato: ["artesanato", "artesao", "feito a mao", "arte", "criatividade"],
  jardinagem: ["jardinagem", "plantas", "jardim", "cuidado com plantas", "natureza"],
  "plantas-ornamentais": ["plantas ornamentais", "plantas", "jardinagem", "decoracao com plantas", "natureza"],
  cachorros: ["cachorros", "cuidados com cachorros", "animais de estimacao", "cao", "pet"],
  gatos: ["gatos", "cuidados com gatos", "animais de estimacao", "gato", "pet"],
  adestramento: ["adestramento de caes", "cachorros", "adestramento", "comportamento canino", "pet"],
  "fotografia-celular": ["fotografia", "fotografia com celular", "imagem", "camera", "fotografo"],
  maquiagem: ["maquiagem", "maquiador", "beleza", "tutorial de maquiagem", "cosmeticos"],
  skincare: ["skincare", "cuidados com a pele", "rotina de skincare", "beleza", "estetica"],
  cabelos: ["cuidados com cabelos", "cabelos", "cabeleireiro", "beleza", "corte de cabelo"],
  unhas: ["design de unhas", "manicure", "unhas", "beleza", "estetica"],
  moda: ["moda", "estilo", "roupas", "tendencias", "vestuario"],
  decoracao: ["decoracao de interiores", "decoracao", "casa", "design de interiores", "ambientes"],
  "fotografia-produtos": ["fotografia de produtos", "fotografia", "produtos", "e-commerce", "imagem"],
  violao: ["violao", "musica", "aprender violao", "aula de violao", "instrumento musical"],
  desenho: ["desenho", "ilustracao", "desenho artistico", "arte", "desenhar"],
  "design-grafico": ["design grafico", "design", "grafismo", "criacao visual", "ferramentas de design"],
};

const DEFAULT_SEARCHES = ["nicho", "produto", "curso", "aprendizado", "vendas"];

export default function Step4Facebook({
  niche,
  product,
  price,
  searches,
  approaches,
  onSearchesChange,
  onApproachesChange,
  onGenerateApproaches,
}: Props) {
  const [customSearch, setCustomSearch] = useState("");
  const [editing, setEditing] = useState<Set<number>>(new Set());

  const nicheName = niche?.name ?? "seu nicho";
  const priceStr = price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : "";

  const keywordsForNiche = useMemo(() => {
    if (searches.length > 0) return searches;
    const key = niche?.id ?? "";
    return KEYWORDS_BY_NICHE[key] || DEFAULT_SEARCHES;
  }, [searches, niche?.id]);

  const handleOpenFacebook = useCallback((term: string) => {
    const url = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(term)}`;
    window.open(url, "_blank");
  }, []);

  const handleAddSearch = useCallback(() => {
    const term = customSearch.trim();
    if (!term) return;
    onSearchesChange([...searches, term]);
    setCustomSearch("");
  }, [customSearch, searches, onSearchesChange]);

  const handleRemoveSearch = useCallback((idx: number) => {
    onSearchesChange(searches.filter((_, i) => i !== idx));
  }, [searches, onSearchesChange]);

  const handleToggleEdit = useCallback((idx: number) => {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleApproachChange = useCallback((idx: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = [...approaches];
    next[idx].text = e.target.value;
    onApproachesChange(next);
  }, [approaches, onApproachesChange]);

  const handleCopyApproach = useCallback(async (idx: number) => {
    await navigator.clipboard.writeText(approaches[idx].text);
  }, [approaches]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>
        Encontre grupos do seu nicho
      </div>

      <div className="facebook-intro">
        <h3>Nicho: {nicheName}</h3>
        <p>
          As palavras-chave abaixo abrem a pesquisa de grupos do Facebook diretamente. O Facebook pode exigir login. Nao automatizamos entrada em grupos nem publicacoes - voce revisa as regras e publica manualmente.
        </p>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 8 }}>
          PALAVRAS-CHAVE DO SEU NICHO
        </div>
        <div className="facebook-searches">
          {keywordsForNiche.map((term, i) => (
            <div key={i} className="search-chip">
              <span>{term}</span>
              <button className="open-facebook" onClick={() => handleOpenFacebook(term)}>Pesquisar grupos</button>
              <button
                className="icon-btn"
                style={{ padding: 0, width: 28, height: 28 }}
                onClick={() => handleRemoveSearch(i)}
                title="Remover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          <div className="custom-search">
            <input
              className="input"
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              placeholder="Digite outra palavra-chave..."
            />
            <button className="gen-btn primary small" onClick={handleAddSearch}>Adicionar</button>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginTop: 4 }}>
        Gerador de abordagens para publicacoes
      </div>

      <div className="approaches-grid">
        {approaches.map((a, i) => {
          const isEditing = editing.has(i);
          return (
            <div key={i} className="approach-card">
              <div className="approach-head">
                <h4>{a.title}</h4>
                <span className="approach-type">{a.type}</span>
              </div>
              <div className="approach-body">
                {isEditing ? (
                  <textarea className="textarea" value={a.text} onChange={(e) => handleApproachChange(i, e)} rows={6} />
                ) : (
                  <div className="approach-text">{a.text}</div>
                )}
                <div className="approach-actions">
                  {!isEditing && (
                    <>
                      <button className="copy-btn" onClick={() => handleCopyApproach(i)}>Copiar texto</button>
                      <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{a.text.length} caracteres</span>
                      <button className="gen-btn primary small" onClick={() => handleToggleEdit(i)}>Editar</button>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <button className="gen-btn primary small" onClick={() => handleToggleEdit(i)}>Concluir edicao</button>
                      <button className="gen-btn primary small" onClick={() => { onGenerateApproaches(); handleToggleEdit(i); }}>Gerar outra versao</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
        <button className="gen-btn primary small" onClick={onGenerateApproaches}>Gerar todas novamente</button>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-mute)", lineHeight: 1.5, marginTop: 10 }}>
        O marcador <code style={{ color: "var(--red)", background: "rgba(184,32,46,0.15)", padding: "2px 6px", borderRadius: 4 }}>&lt;cole aqui o link da pagina&gt;</code> deve ser substituido pelo link da sua pagina de vendas antes de publicar. Nao crie publicacoes repetitivas nem spam. Respeite as regras de cada grupo.
      </div>
    </div>
  );
}
