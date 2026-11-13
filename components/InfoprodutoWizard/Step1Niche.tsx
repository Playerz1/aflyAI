"use client";

import { useCallback, useMemo, useState } from "react";
import { NICHES, CATEGORIES, NICHE_METHODOLOGY, type Niche } from "@/lib/niches";

type Props = {
  niche: any;
  onSelect: (niche: any) => void;
};

export default function Step1Niche({ niche, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "demand" | "competition" | "offer" | "opportunity">("all");

  const filtered = useMemo(() => {
    let list = NICHES.filter((n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
    );

    if (filter === "demand") list = [...list].sort((a, b) => b.demand - a.demand);
    if (filter === "competition") list = [...list].sort((a, b) => a.competition - b.competition);
    if (filter === "offer") list = [...list].sort((a, b) => a.offer - b.offer);
    if (filter === "opportunity") {
      list = [...list].sort(
        (a, b) => (b.demand - b.offer - b.competition) - (a.demand - a.offer - a.competition)
      );
    }
    return list;
  }, [search, filter]);

  const opportunityLevel = (n: Niche) => {
    const score = n.demand - n.offer - n.competition;
    if (score > 30) return "high";
    if (score > 0) return "med";
    return "low";
  };

  const pctColor = (v: number) => {
    if (v >= 70) return "high";
    if (v >= 40) return "med";
    return "low";
  };

  const handleSelect = useCallback(
    (n: Niche) => {
      onSelect({
        id: n.id,
        name: n.name,
        category: n.category,
        demand: n.demand,
        offer: n.offer,
        competition: n.competition,
      });
    },
    [onSelect]
  );

  const selectedOpp = niche ? opportunityLevel(niche) : null;

  return (
    <>
      <div className="niches-toolbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filter === "all" && search === "" ? "active" : ""}`}
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
          >
            {cat}
          </button>
        ))}
        <button className="filter-chip active" onClick={() => setFilter("demand")}>
          Maior demanda
        </button>
        <button className="filter-chip active" onClick={() => setFilter("competition")}>
          Menor concorrencia
        </button>
        <button className="filter-chip active" onClick={() => setFilter("offer")}>
          Menor oferta
        </button>
        <button className="filter-chip active" onClick={() => setFilter("opportunity")}>
          Melhores oportunidades
        </button>
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Pesquisar nichos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilter("all");
            }}
          />
        </div>
      </div>

      <div className="niches-grid">
        {filtered.map((n) => {
          const sel = niche?.id === n.id;
          const opp = opportunityLevel(n);
          return (
            <div
              key={n.id}
              className={`niche-card ${sel ? "selected" : ""}`}
              onClick={() => handleSelect(n)}
            >
              <div className="niche-header">
                <span className="niche-name">{n.name}</span>
                <span className="niche-category">{n.category}</span>
              </div>
              <div className="niche-metrics">
                <div className="metric">
                  <span className="metric-label">Demanda</span>
                  <span className={`metric-value ${pctColor(n.demand)}`}>{n.demand}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Oferta</span>
                  <span className={`metric-value ${pctColor(n.offer)}`}>{n.offer}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Concorrencia</span>
                  <span className={`metric-value ${pctColor(n.competition)}`}>{n.competition}%</span>
                </div>
              </div>
              <div className="niche-opportunity">
                <span className={`opportunity-dot ${opp}`}></span>
                <span>Oportunidade: {opp === "high" ? "Alta" : opp === "med" ? "Media" : "Baixa"}</span>
              </div>
              <button className="niche-btn">
                {sel ? "Selecionado" : "Selecionar"}
              </button>
            </div>
          );
        })}
      </div>

      {niche && (
        <div className="card" style={{ marginTop: 20, padding: 18, borderColor: "var(--red)" }}>
          <div style={{ display: "flex", alignItems: "start", gap: 14, marginBottom: 12 }}>
            <div className="opportunity-dot" style={{ width: 14, height: 14, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{niche.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{niche.category}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12, fontSize: 12, color: "var(--text-dim)" }}>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{niche.demand}%</div>Demanda</div>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{niche.offer}%</div>Oferta</div>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{niche.competition}%</div>Concorrencia</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12, lineHeight: 1.5 }}>
            {selectedOpp === "high"
              ? "Otima oportunidade: alta demanda com oferta e concorrencia relativamente menores."
              : selectedOpp === "med"
              ? "Oportunidade equilibrada. Ha espaco para se diferenciar com qualidade."
              : "Mercado mais disputado. Foque em um sub-nicho ou diferencial de entrega."}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-mute)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            Estimativa inicial direcional. Nao eh estatistica de fonte pesquisada.
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 8 }}>
          {NICHE_METHODOLOGY.title}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 10 }}>
          {NICHE_METHODOLOGY.notice}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Indicadores:
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 4 }}>
          - {NICHE_METHODOLOGY.indicators.demand}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 4 }}>
          - {NICHE_METHODOLOGY.indicators.offer}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 0 }}>
          - {NICHE_METHODOLOGY.indicators.competition}
        </div>
      </div>
    </>
  );
}
