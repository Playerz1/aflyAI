"use client";

import { useCallback, useMemo, useState } from "react";
import { NICHES, CATEGORIES, NICHE_METHODOLOGY, type Niche } from "@/lib/niches";

type Props = {
  niche: any;
  onSelect: (niche: any) => void;
};

type OpportunityLevel = "high" | "medium" | "low";

function calcOppIndex(n: Niche): number {
  const invOffer = 100 - n.offer;
  const invComp = 100 - n.competition;
  return Math.round(0.5 * n.demand + 0.25 * invOffer + 0.25 * invComp);
}

function classifyOpp(idx: number): OpportunityLevel {
  if (idx >= 70) return "high";
  if (idx >= 45) return "medium";
  return "low";
}

function oppLabel(l: OpportunityLevel): string {
  if (l === "high") return "Oportunidade alta";
  if (l === "medium") return "Oportunidade media";
  return "Oportunidade baixa";
}

function oppColor(l: OpportunityLevel): string {
  if (l === "high") return "var(--red)";
  if (l === "medium") return "#c9821e";
  return "var(--text-mute)";
}

export default function Step1Niche({ niche, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortOpp, setSortOpp] = useState(false);

  const enriched = useMemo(() => {
    return NICHES.map((n) => {
      const idx = calcOppIndex(n);
      const lvl = classifyOpp(idx);
      return { ...n, oppIndex: idx, oppLevel: lvl };
    });
  }, []);

  const filtered = useMemo(() => {
    let list = enriched.filter((n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
    );
    if (filter !== "all") {
      list = list.filter((n) => n.oppLevel === filter);
    }
    if (sortOpp) {
      list = [...list].sort((a, b) => b.oppIndex - a.oppIndex);
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [search, filter, sortOpp, enriched]);

  const handleSelect = useCallback(
    (n: Niche & { oppIndex: number; oppLevel: OpportunityLevel }) => {
      onSelect({
        id: n.id,
        name: n.name,
        category: n.category,
        demand: n.demand,
        offer: n.offer,
        competition: n.competition,
        oppIndex: n.oppIndex,
        oppLevel: n.oppLevel,
      });
    },
    [onSelect]
  );

  const sel = niche ? enriched.find((n) => n.id === niche.id) : null;

  return (
    <>
      <div className="niches-toolbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${filter === "all" && search === "" ? "active" : ""}`}
            onClick={() => { setFilter("all"); setSearch(""); setSortOpp(false); }}
          >
            {cat}
          </button>
        ))}
        <button className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => { setFilter("all"); setSortOpp(false); }}>
          Todas as oportunidades
        </button>
        <button className={`filter-chip ${filter === "high" ? "active" : ""}`} onClick={() => { setFilter("high"); setSortOpp(false); }}>
          Oportunidade alta
        </button>
        <button className={`filter-chip ${filter === "medium" ? "active" : ""}`} onClick={() => { setFilter("medium"); setSortOpp(false); }}>
          Oportunidade media
        </button>
        <button className={`filter-chip ${filter === "low" ? "active" : ""}`} onClick={() => { setFilter("low"); setSortOpp(false); }}>
          Oportunidade baixa
        </button>
        <button className={`filter-chip ${sortOpp ? "active" : ""}`} onClick={() => setSortOpp(!sortOpp)}>
          Ordenar por melhor oportunidade
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
              setSortOpp(false);
            }}
          />
        </div>
      </div>

      <div className="niches-grid">
        {filtered.map((n) => {
          const isSelected = sel?.id === n.id;
          return (
            <div
              key={n.id}
              className={`niche-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelect(n)}
            >
              <div className="niche-header">
                <span className="niche-name">{n.name}</span>
                <span className="niche-category">{n.category}</span>
              </div>
              <div className="niche-metrics">
                <div className="metric">
                  <span className="metric-label">Demanda</span>
                  <span className="metric-value">{n.demand}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Oferta</span>
                  <span className="metric-value">{n.offer}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Concorrencia</span>
                  <span className="metric-value">{n.competition}%</span>
                </div>
              </div>
              <div className="niche-opportunity">
                <span className="opportunity-dot" style={{ backgroundColor: oppColor(n.oppLevel) }} />
                <span style={{ color: oppColor(n.oppLevel) }}>{oppLabel(n.oppLevel)} — Indice {n.oppIndex}</span>
              </div>
              <div className="niche-badge" style={{ borderColor: oppColor(n.oppLevel), color: oppColor(n.oppLevel) }}>
                {oppLabel(n.oppLevel)}
              </div>
              <button className="niche-btn">{isSelected ? "Selecionado" : "Selecionar"}</button>
            </div>
          );
        })}
      </div>

      {sel && (
        <div className="card" style={{ marginTop: 20, padding: 18, borderColor: "var(--red)" }}>
          <div style={{ display: "flex", alignItems: "start", gap: 14, marginBottom: 12 }}>
            <div className="opportunity-dot" style={{ width: 14, height: 14, backgroundColor: oppColor(sel.oppLevel), flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{sel.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sel.category}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12, fontSize: 12, color: "var(--text-dim)" }}>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{sel.demand}%</div>Demanda</div>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{sel.offer}%</div>Oferta</div>
            <div><div style={{ fontWeight: 800, color: "var(--text)", fontSize: 16 }}>{sel.competition}%</div>Concorrencia</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
              Indice de oportunidade: {sel.oppIndex}
            </div>
            <div style={{ fontSize: 11, color: oppColor(sel.oppLevel), fontWeight: 700 }}>
              {oppLabel(sel.oppLevel)}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12, lineHeight: 1.5 }}>
            {sel.oppLevel === "high"
              ? "Alta demanda com oferta e concorrencia relativamente menores. Boa area para lancar um infoproduto."
              : sel.oppLevel === "medium"
              ? "Oportunidade equilibrada. Diferenciacao pela qualidade e foco em sub-nicho sao importantes."
              : "Mercado mais disputado. Requer diferencial forte ou abordagem em sub-nicho especifico."}
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
          Calculadora de oportunidade:
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 4 }}>
          Indice = 50% da demanda + 25% da oferta invertida + 25% da concorrencia invertida.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 4 }}>
          70 a 100: Oportunidade alta.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 4 }}>
          45 a 69: Oportunidade media.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 0 }}>
          0 a 44: Oportunidade baixa.
        </div>
      </div>
    </>
  );
}
