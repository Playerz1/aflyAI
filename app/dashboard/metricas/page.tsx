"use client";

import { useEffect, useMemo, useState } from "react";

type Metric = { id: string; label: string; value: number; unit: string | null; day: string };

export default function MetricasPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/metrics");
    if (res.ok) {
      const data = await res.json();
      setMetrics(data.metrics);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(
    () => metrics.reduce((acc, m) => acc + m.value, 0),
    [metrics]
  );

  const max = useMemo(
    () => Math.max(...metrics.map((m) => Math.abs(m.value)), 1),
    [metrics]
  );

  async function addMetric(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, value: Number(value), unit }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar métrica.");
      return;
    }
    setLabel("");
    setValue("");
    setUnit("");
    load();
  }

  return (
    <div className="fade-up">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Métricas</h1>
          <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
            Cadastre valores e visualize o comparativo.
          </p>
        </div>
        <div className="badge badge-red">Total acumulado: {total.toLocaleString("pt-BR")}</div>
      </header>

      <form
        onSubmit={addMetric}
        className="card"
        style={{ padding: 20, marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div className="field" style={{ flex: "2 1 200px" }}>
          <label htmlFor="label">Rótulo</label>
          <input
            id="label"
            className="input"
            placeholder="ex: Vendas de novembro"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: "1 1 120px" }}>
          <label htmlFor="value">Valor</label>
          <input
            id="value"
            type="number"
            step="any"
            className="input"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: "1 1 120px" }}>
          <label htmlFor="unit">Unidade</label>
          <input
            id="unit"
            className="input"
            placeholder="ex: R$, %, req"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando…" : "Adicionar"}
        </button>
      </form>

      {error && <p style={{ color: "#ff6b71", marginTop: 12, fontSize: 14 }}>{error}</p>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 22 }}>
        {loading ? (
          <p style={{ color: "var(--text-mute)" }}>Carregando…</p>
        ) : metrics.length === 0 ? (
          <p style={{ color: "var(--text-mute)" }}>Nenhuma métrica cadastrada ainda.</p>
        ) : (
          metrics.slice().reverse().map((m) => (
            <div key={m.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{m.label}</span>
                <span className="badge badge-gray">{m.unit ?? "#"}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>
                {m.value.toLocaleString("pt-BR")}
              </div>
              <div
                style={{
                  height: 6,
                  background: "var(--surface-3)",
                  borderRadius: 99,
                  marginTop: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (Math.abs(m.value) / max) * 100)}%`,
                    height: "100%",
                    background: "var(--red)",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 10 }}>
                {new Date(m.day).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
