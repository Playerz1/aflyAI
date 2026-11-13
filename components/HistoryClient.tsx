"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ProductWithSales = any;

type Props = {
  products: ProductWithSales[];
  userId: string;
};

export default function HistoryClient({ products, userId }: Props) {
  const router = useRouter();
  const [newSale, setNewSale] = useState<{ productId: string; amount: string; quantity: string; note: string } | null>(null);

  const totalRevenue = products.reduce((acc, p) => {
    const sales = p.productSales || [];
    const sum = sales.reduce((s: number, sa: any) => s + sa.amount, 0);
    return acc + sum;
  }, 0);
  const totalSales = products.reduce((acc, p) => acc + (p.productSales?.length || 0), 0);

  async function addSale(productId: string) {
    if (!newSale) return;
    const res = await fetch("/api/productsales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        amount: Number(newSale.amount),
        quantity: Number(newSale.quantity) || 1,
        note: newSale.note,
      }),
    });
    if (res.ok) {
      setNewSale(null);
      router.refresh();
    }
  }

  async function deleteSale(saleId: string) {
    await fetch(`/api/productsales/${saleId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Historico</h1>
          <p style={{ color: "var(--text-dim)", marginTop: 4 }}>Acompanhe seus infoprodutos e vendas registradas.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{fmtBRL(totalRevenue)}</span>
          <span style={{ fontSize: 14, color: "var(--text-dim)" }}>{totalSales} vendas</span>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhum infoproduto criado ainda</h3>
          <p>Use o botao Criar no painel lateral para comecar seu primeiro infoproduto.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {products.map((p) => {
            const sales = p.productSales || [];
            const productRevenue = sales.reduce((acc: number, s: any) => acc + s.amount, 0);

            return (
              <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: 18, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{p.title || "Sem titulo"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                      {p.niche || "Nicho nao definido"} - {p.format === "MODULES" ? "Modulos e aulas" : "PDF completo"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{fmtBRL(productRevenue)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sales.length} vendas</div>
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 10 }}>
                    Progresso do desenvolvimento
                  </div>
                  <div style={{ width: "100%", height: 6, background: "#1f1f1f", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ width: "60%", height: "100%", background: "var(--red)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-mute)", marginBottom: 14 }}>
                    <span>Nicho selecionado</span>
                    <span>Produto configurado</span>
                    <span>Conteudo gerado</span>
                    <span>PDF ou modulos</span>
                    <span>Pagina de vendas</span>
                    <span>Divulgacao</span>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Preco:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                      {p.price != null ? `R$ ${p.price.toFixed(2).replace(".", ",")}` : "Nao definido"}
                    </span>
                    {p.pdfUrl && (
                      <a href={p.pdfUrl} className="gen-btn primary small" target="_blank" rel="noopener noreferrer">Ver PDF</a>
                    )}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--red)" }}>Vendas registradas</div>
                      <button
                        className="gen-btn primary small"
                        onClick={() => setNewSale({ productId: p.id, amount: "", quantity: "", note: "" })}
                      >
                        + Registrar venda
                      </button>
                    </div>

                    {sales.length === 0 ? (
                      <div style={{ fontSize: 13, color: "var(--text-dim)", padding: 12, textAlign: "center" }}>
                        Nenhuma venda registrada para este produto.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {sales.map((s: any) => (
                          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 8, background: "var(--card-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                            <div>
                              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                                {fmtBRL(s.amount)} {s.quantity > 1 ? "x" + s.quantity : ""}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
                                {new Date(s.createdAt).toLocaleDateString("pt-BR")} {s.note ? "- " + s.note : ""}
                              </div>
                            </div>
                            <button
                              className="icon-btn"
                              onClick={() => deleteSale(s.id)}
                              style={{ color: "#e8838c" }}
                              title="Excluir venda"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {newSale && newSale.productId === p.id && (
                      <div style={{ marginTop: 12, padding: 12, background: "var(--card-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div className="field" style={{ marginBottom: 8 }}>
                          <label>Valor (R$)</label>
                          <input
                            className="input"
                            type="text"
                            value={newSale.amount}
                            onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="field" style={{ marginBottom: 8 }}>
                          <label>Quantidade</label>
                          <input
                            className="input"
                            type="text"
                            value={newSale.quantity}
                            onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                            placeholder="1"
                          />
                        </div>
                        <div className="field" style={{ marginBottom: 10 }}>
                          <label>Observacao (opcional)</label>
                          <input
                            className="input"
                            value={newSale.note}
                            onChange={(e) => setNewSale({ ...newSale, note: e.target.value })}
                            placeholder="Observacao sobre a venda"
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary" onClick={() => addSale(p.id)}>Salvar</button>
                          <button className="btn btn-outline" onClick={() => setNewSale(null)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
