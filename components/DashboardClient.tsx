"use client";

import { useEffect, useState } from "react";
import RevenueChart, { type SalePoint } from "./RevenueChart";

type Stats = {
  faturamento: number;
  ticketMedio: number;
  vendas: number;
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardClient({ stats, sales }: { stats: Stats; sales: SalePoint[] }) {
  const router = useRouter();

  const cards = [
    {
      label: "Faturamento total",
      value: fmtBRL(stats.faturamento),
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Ticket medio",
      value: fmtBRL(stats.ticketMedio),
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      ),
    },
    {
      label: "Vendas totais",
      value: String(stats.vendas),
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
  ];

  const recentSales = sales.slice(-5).reverse();

  return (
    <div className="dash-content fade-up">
      <section className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="card stat-card">
            <div className="stat-icon">{c.icon}</div>
            <span className="stat-label">{c.label}</span>
            <span className="stat-value">{c.value}</span>
          </div>
        ))}
      </section>

      <RevenueChart sales={sales} />
    </div>
  );
}
