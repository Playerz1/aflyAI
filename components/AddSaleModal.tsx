"use client";

import { useEffect, useState } from "react";

export default function AddSaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setAmount("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (Number.isNaN(value) || value <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: value }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar venda.");
      return;
    }
    onClose();
    window.location.reload();
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Nova venda</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label htmlFor="sale-title">Descrição (opcional)</label>
            <input
              id="sale-title"
              className="input"
              placeholder="ex: Consultoria mensal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="sale-amount">Valor (R$)</label>
            <input
              id="sale-amount"
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Registrar venda"}
          </button>
        </form>
      </div>
    </div>
  );
}
