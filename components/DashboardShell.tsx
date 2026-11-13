"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardClient from "@/components/DashboardClient";
import HistoryClient from "@/components/HistoryClient";
import { Hotbar } from "@/components/Nav";

type User = { id: string; name: string };
type Stats = { faturamento: number; ticketMedio: number; vendas: number };
type SalePoint = { date: string; amount: number };

type Props = {
  user: User;
  stats: Stats;
  sales: SalePoint[];
  products: any[];
};

export default function DashboardShell({ user, stats, sales, products }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"dashboard" | "historico">(
    (searchParams.get("tab") as any) === "historico" ? "historico" : "dashboard"
  );

  useEffect(() => {
    if (tab === "historico") {
      router.push("/dashboard?tab=historico", { scroll: false });
    } else {
      router.push("/dashboard", { scroll: false });
    }
  }, [tab, router]);

  const switchTab = (t: "dashboard" | "historico") => {
    setTab(t);
  };

  // Saudação personalizada dinâmica baseada no horário
  const getSaudacao = (): string => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    if (hour >= 18 && hour < 24) return "Boa noite";
    return "Boa madrugada";
  };

  const saudacao = getSaudacao();
  const nomeUsuario = user.name ? user.name.split(" ")[0] : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {tab === "dashboard" && (
        <div className="dash-header-section">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{saudacao}</span>
            {nomeUsuario && (
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginLeft: 4 }}>
                , {nomeUsuario}
              </span>
            )}
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{nomeUsuario ? "" : "!"}</span>
          </div>
          <p style={{ color: "var(--text-dim)", marginBottom: 20 }}>
            Bom dia!
          </p>
        </div>
      )}

      {tab === "dashboard" ? (
        <DashboardClient stats={stats} sales={sales} />
      ) : (
        <HistoryClient products={products} userId={user.id} />
      )}

      <Hotbar userId={user.id} />
    </div>
  );
}
