"use client";

import { useEffect, useState } from "react";

type Log = { id: string; action: string; detail: string | null; createdAt: string };

export default function AtividadePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [action, setAction] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/logs");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, detail }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao registrar evento.");
      return;
    }
    setAction("");
    setDetail("");
    load();
  }

  return (
    <div className="fade-up">
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Atividade</h1>
        <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
          Registre eventos e acompanhe o histórico da sua conta.
        </p>
      </header>

      <form
        onSubmit={addLog}
        className="card"
        style={{ padding: 20, marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div className="field" style={{ flex: "1 1 200px" }}>
          <label htmlFor="action">Evento</label>
          <input
            id="action"
            className="input"
            placeholder="ex: deploy.realizado"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: "2 1 280px" }}>
          <label htmlFor="detail">Detalhe (opcional)</label>
          <input
            id="detail"
            className="input"
            placeholder="ex: versão 2.1 publicada"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando…" : "Registrar"}
        </button>
      </form>

      {error && <p style={{ color: "#ff6b71", marginTop: 12, fontSize: 14 }}>{error}</p>}

      <section className="card" style={{ marginTop: 20, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Detalhe</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ color: "var(--text-mute)" }}>Carregando…</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ color: "var(--text-mute)" }}>
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--red)", fontWeight: 600 }}>{log.action}</td>
                  <td>{log.detail ?? "—"}</td>
                  <td style={{ fontSize: 13 }}>{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
