"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: "◧" },
  { href: "/dashboard/atividade", label: "Atividade", icon: "≡" },
  { href: "/dashboard/metricas", label: "Métricas", icon: "◭" },
  { href: "/dashboard/conta", label: "Minha conta", icon: "○" },
];

export default function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "var(--red)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          A
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>AflyAI</span>
      </div>

      <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 9,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--text)" : "var(--text-dim)",
                background: active ? "rgba(229,9,20,0.12)" : "transparent",
                border: active ? "1px solid rgba(229,9,20,0.35)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ color: active ? "var(--red)" : "var(--text-mute)", width: 18 }}>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid var(--border)", padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--red)",
            }}
          >
            {initials || "U"}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: "100%", marginTop: 12 }}>
          ⏻ Sair da conta
        </button>
      </div>
    </aside>
  );
}
