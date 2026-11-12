"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContaPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d.user));
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="fade-up">
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Minha conta</h1>
        <p style={{ color: "var(--text-dim)", marginTop: 6 }}>
          Informações da sua conta e opção de sair.
        </p>
      </header>

      <section className="card" style={{ padding: 26, marginTop: 26, maxWidth: 520 }}>
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "rgba(229,9,20,0.12)",
                  border: "1px solid rgba(229,9,20,0.35)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--red)",
                }}
              >
                {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
                <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{user.email}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <span className="badge badge-red">{user.role === "ADMIN" ? "Administrador" : "Membro"}</span>
              <span className="badge badge-green">Conta ativa</span>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "24px 0" }} />

            <button className="btn btn-danger" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "Encerrando sessão…" : "⏻ Sair da conta"}
            </button>
          </>
        ) : (
          <p style={{ color: "var(--text-mute)" }}>Carregando dados…</p>
        )}
      </section>
    </div>
  );
}
