"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo deu errado.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
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
          Recuperação de <span style={{ color: "var(--red)" }}>acesso.</span>
        </h1>
        <p className="auth-sub">Enviaremos um link seguro para você redefinir sua senha.</p>
      </section>

      <section className="auth-form-side">
        <div className="card auth-card fade-up">
          <h2>Esqueci minha senha</h2>
          {sent ? (
            <>
              <p className="lead">
                Se este e-mail estiver cadastrado, você receberá um link de redefinição válido por{" "}
                <strong>15 minutos</strong>. Verifique sua caixa de entrada (e o spam).
              </p>
              <Link className="btn btn-primary" href="/" style={{ textAlign: "center" }}>
                Voltar ao login
              </Link>
            </>
          ) : (
            <>
              <p className="lead">Informe o e-mail cadastrado para receber o link de redefinição.</p>
              <form onSubmit={handleSubmit} className="auth-form">
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
                {error && (
                  <div className="alert-error" role="alert">
                    {error}
                  </div>
                )}
                <button className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? "Enviando…" : "Enviar link de recuperação"}
                </button>
              </form>
              <p className="auth-switch">
                Lembrou a senha? <Link href="/">Entrar</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
