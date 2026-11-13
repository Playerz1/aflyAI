"use client";

import { useCallback, useMemo, useState } from "react";

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

const DEFAULT_SEARCHES = [
  "Grupo de {nicho}",
  "{nicho} iniciantes",
  "Como vender {nicho}",
  "Receitas de {nicho}",
  "Empreendedorismo em {nicho}",
];

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

  const searchesWithNiche = useMemo(() => {
    if (searches.length) return searches;
    return DEFAULT_SEARCHES.map((s) => s.replace(/{nicho}/g, nicheName));
  }, [searches, nicheName]);

  const handleOpenFacebook = useCallback(() => {
    const term = searchesWithNiche[0] || nicheName;
    const url = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(term)}`;
    window.open(url, "_blank");
  }, [searchesWithNiche, nicheName]);

  const handleOpenSearch = useCallback((term: string) => {
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

  const handleRegenerateApproach = useCallback((idx: number) => {
    onGenerateApproaches();
  }, [onGenerateApproaches]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>
        Encontre grupos do seu nicho
      </div>

      <div className="facebook-intro">
        <h3>Nicho: {nicheName}</h3>
        <p>
          As pesquisas abaixo abrem o Facebook diretamente na busca de grupos relacionados ao seu nicho. O Facebook pode exigir login. Nao automatizamos entrada em grupos nem publicacoes - voce revisa as regras e publica manualmente.
        </p>
        <div className="facebook-searches">
          {searchesWithNiche.map((term, i) => (
            <div key={i} className="search-chip">
              <span>{term}</span>
              <button className="open-facebook" onClick={() => handleOpenSearch(term)}>Abrir no Facebook</button>
              <button
                className="icon-btn"
                style={{ padding: 0, width: 28, height: 28 }}
                onClick={() => handleRemoveSearch(i)}
                title="Remover pesquisa"
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
              placeholder="Nova palavra-chave de pesquisa..."
            />
            <button className="gen-btn primary small" onClick={handleAddSearch}>Adicionar</button>
          </div>
          <button className="open-facebook" onClick={handleOpenFacebook}>
            Abrir Facebook (primeira pesquisa)
          </button>
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
                  <textarea
                    className="textarea"
                    value={a.text}
                    onChange={(e) => handleApproachChange(i, e)}
                    rows={6}
                  />
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
                      <button className="gen-btn primary small" onClick={() => { handleRegenerateApproach(i); handleToggleEdit(i); }}>Gerar outra versao</button>
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
        O marcador <code style={{ color: "var(--red)", background: "rgba(229,9,20,0.15)", padding: "2px 6px", borderRadius: 4 }}>&lt;cole aqui o link da pagina&gt;</code> deve ser substituido pelo link da sua pagina de vendas antes de publicar. Nao crie publicacoes repetitivas nem spam. Respeite as regras de cada grupo.
      </div>
    </div>
  );
}
