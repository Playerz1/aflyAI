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
    <main className="auth-main">
      <section className="auth-brand">
        <div className="logo-row">
          <div className="logo-mark">A</div>
          <span className="logo-text">AflyAI</span>
        </div>
        <h1 className="auth-title">
          Gestão inteligente, <span style={{ color: "var(--red)" }}>em preto e vermelho.</span>
        </h1>
        <p className="auth-sub">
          Acompanhe faturamento, ticket médio e vendas em um dashboard escuro, rápido e profissional.
        </p>
        <div className="auth-badges">
          {["Faturamento em tempo real", "Gráfico interativo", "Acesso seguro"].map((f) => (
            <div key={f} className="badge">
              <span className="badge-dot">●</span> {f}
            </div>
          ))}
        </div>
      </section>

      <section className="auth-form-side">
        <div className="card auth-card fade-up">
          <h2>{isRegister ? "Criar conta" : "Entrar"}</h2>
          <p className="lead">
            {isRegister ? "Preencha os dados para começar agora." : "Bem-vindo de volta. Acesse seu painel."}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
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

            {error && <div className="alert-error" role="alert">{error}</div>}

            <button className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Aguarde…" : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Já tem uma conta? " : "Ainda não tem conta? "}
            <Link href={isRegister ? "/" : "/cadastro"}>
              {isRegister ? "Entrar" : "Criar agora"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
