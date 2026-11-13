"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function RedefinirForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("A senha deve ter pelo menos 8 caracteres, com letras e números.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo deu errado.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <h2>Link inválido</h2>
        <p className="lead">
          Este link de redefinição é inválido ou está incompleto. Solicite um novo link de
          recuperação.
        </p>
        <Link className="btn btn-primary" href="/recuperar-senha" style={{ textAlign: "center" }}>
          Solicitar novo link
        </Link>
      </>
    );
  }

  if (success) {
    return (
      <>
        <h2>Senha redefinida com sucesso</h2>
        <p className="lead">
          Sua nova senha foi salva e todas as sessões ativas foram encerradas por segurança. Faça
          login novamente com a nova senha.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
        >
          Voltar ao login
        </button>
      </>
    );
  }

  return (
    <>
      <h2>Redefinir senha</h2>
      <p className="lead">Escolha uma nova senha para sua conta AflyAI.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="password">Nova senha</label>
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
        <div className="field">
          <label htmlFor="confirm">Confirmar nova senha</label>
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
        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
      <p className="auth-switch">
        <Link href="/">Voltar ao login</Link>
      </p>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="auth-main">
      <section className="auth-brand">
        <div className="logo-row">
          <div className="logo-mark">A</div>
          <span className="logo-text">AflyAI</span>
        </div>
        <h1 className="auth-title">
          Nova senha, <span style={{ color: "var(--red)" }}>novo acesso.</span>
        </h1>
        <p className="auth-sub">Defina uma senha forte para proteger sua conta.</p>
      </section>
      <section className="auth-form-side">
        <div className="card auth-card fade-up">
          <Suspense fallback={<p className="lead">Carregando…</p>}>
            <RedefinirForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
