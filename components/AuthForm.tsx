"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isRegister && password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo deu errado.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
      }}
      className="auth-main"
    >
      {/* Brand side */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 72px",
          borderRight: "1px solid var(--border)",
          background:
            "radial-gradient(1200px 500px at -10% 110%, rgba(229,9,20,0.10), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--red)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            A
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>AflyAI</span>
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginTop: 56,
            maxWidth: 480,
          }}
        >
          Gestão inteligente, <span style={{ color: "var(--red)" }}>em preto e vermelho.</span>
        </h1>
        <p style={{ color: "var(--text-dim)", marginTop: 18, maxWidth: 420, fontSize: 16, lineHeight: 1.6 }}>
          Painel administrativo individual com métricas, atividade e controle total da sua conta —
          em uma interface escura, rápida e profissional.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 40, flexWrap: "wrap" }}>
          {["Métricas em tempo real", "Registro de atividades", "Sessões seguras"].map((f) => (
            <div
              key={f}
              className="badge badge-gray"
              style={{ padding: "8px 14px", fontSize: 13 }}
            >
              <span style={{ color: "var(--red)", fontWeight: 700 }}>●</span> {f}
            </div>
          ))}
        </div>
      </section>

      {/* Form side */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div className="card fade-up" style={{ width: "100%", maxWidth: 400, padding: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {isRegister ? "Criar conta" : "Entrar"}
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 6 }}>
            {isRegister
              ? "Preencha os dados para começar agora."
              : "Bem-vindo de volta. Acesse seu painel."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 28 }}>
            {isRegister && (
              <div className="field">
                <label htmlFor="name">Nome</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {isRegister && (
              <div className="field">
                <label htmlFor="confirm">Confirmar senha</label>
                <input
                  id="confirm"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  background: "rgba(229,9,20,0.08)",
                  border: "1px solid rgba(229,9,20,0.35)",
                  color: "#ff6b71",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13.5,
                }}
              >
                {error}
              </div>
            )}

            <button className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Aguarde…" : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--text-dim)" }}>
            {isRegister ? "Já tem uma conta? " : "Ainda não tem conta? "}
            <Link href={isRegister ? "/" : "/cadastro"} style={{ color: "var(--red)", fontWeight: 600 }}>
              {isRegister ? "Entrar" : "Criar agora"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
