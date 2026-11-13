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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => switchTab("dashboard")}
          className={`btn ${tab === "dashboard" ? "btn-primary" : "btn-outline"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => switchTab("historico")}
          className={`btn ${tab === "historico" ? "btn-primary" : "btn-outline"}`}
        >
          Historico
        </button>
      </div>

      {tab === "dashboard" ? (
        <DashboardClient stats={stats} sales={sales} />
      ) : (
        <HistoryClient products={products} userId={user.id} />
      )}

      <Hotbar userId={user.id} />
    </div>
  );
}
