"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type User = { id: string; name: string; email: string; profilePicture?: string | null };

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConfiguracoesClient({ user }: { user: User }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"perfil" | "seguranca" | "conta">("perfil");
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [newEmail, setNewEmail] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  async function saveProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail, profilePicture: newPhoto }),
      });
      if (res.ok) {
        showMessage("Perfil atualizado com sucesso.", "success");
        router.refresh();
      } else {
        showMessage("Erro ao atualizar perfil.", "error");
      }
    } catch {
      showMessage("Erro ao atualizar perfil.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("Preencha todos os campos.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("As senhas nao coincidem.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes/senha", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showMessage("Senha alterada com sucesso.", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(data.error || "Senha atual incorreta.", "error");
      }
    } catch {
      showMessage("Erro ao alterar senha.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTwoFactor() {
    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes/2fa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !twoFactorEnabled }),
      });
      if (res.ok) {
        setTwoFactorEnabled((prev) => !prev);
        showMessage(twoFactorEnabled ? "2FA desativado." : "2FA ativado com sucesso.", "success");
      } else {
        showMessage("Erro ao alterar configuracao de 2FA.", "error");
      }
    } catch {
      showMessage("Erro ao alterar configuracao de 2FA.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const sectionCard = (title: string, children: React.ReactNode) => (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 800, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={() => router.back()} style={{ cursor: "pointer" }}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Configuracoes</h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActiveSection("perfil")}
          className={`btn ${activeSection === "perfil" ? "btn-primary" : "btn-outline"}`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveSection("seguranca")}
          className={`btn ${activeSection === "seguranca" ? "btn-primary" : "btn-outline"}`}
        >
          Seguranca
        </button>
        <button
          onClick={() => setActiveSection("conta")}
          className={`btn ${activeSection === "conta" ? "btn-primary" : "btn-outline"}`}
        >
          Dados da conta
        </button>
      </div>

      {activeSection === "perfil" && (
        sectionCard("Perfil", (
          <div style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--card-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", overflow: "hidden", position: "relative" }}>
                {newPhoto ? (
                  <img src={newPhoto} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ fontSize: 34, fontWeight: 800, color: "var(--red)" }}>
                    {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setNewPhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="gen-btn primary small"
                  style={{ position: "absolute", bottom: 4, right: 4 }}
                >
                  Alterar foto
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label>Nome</label>
                <input className="input" value={profileName} onChange={(e: any) => setProfileName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="field">
                <label>E-mail</label>
                <input className="input" type="email" value={profileEmail} onChange={(e: any) => setProfileEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="field">
                <label>Novo e-mail (solicitacao de alteracao)</label>
                <input className="input" type="email" value={newEmail} onChange={(e: any) => setNewEmail(e.target.value)} placeholder="novo@email.com" />
                <p style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                  Se o sistema exigir confirmacao, voce recebendo um e-mail para validar o novo endereco.
                </p>
              </div>
            </div>
          </div>
        ))
      )}
      {activeSection === "perfil" && (
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={saveProfile} disabled={loading} style={{ width: "fit-content" }}>
            {loading ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </div>
      )}

      {activeSection === "seguranca" && (
        <>
          {sectionCard("Alterar senha", (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field">
                <label>Senha atual</label>
                <input className="input" type="password" value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" />
              </div>
              <div className="field">
                <label>Nova senha</label>
                <input className="input" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Nova senha" />
              </div>
              <div className="field">
                <label>Confirmar nova senha</label>
                <input className="input" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="Confirme a nova senha" />
              </div>
            </div>
          ))}
          {sectionCard("Autenticacao de dois fatores (2FA)", (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Adicione uma camada extra de seguranca a sua conta.</p>
                </div>
                <button
                  className="btn btn-primary small"
                  onClick={toggleTwoFactor}
                  disabled={loading}
                >
                  {twoFactorEnabled ? "Desativar 2FA" : "Ativar 2FA"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: twoFactorEnabled ? "var(--text-dim)" : "var(--text-mute)" }}>
                {twoFactorEnabled ? "Autenticacao de dois fatores esta ATIVA." : "Autenticacao de dois fatores esta DESATIVADA."}
              </div>
            </>
          ))}
        </>
      )}

      {activeSection === "conta" && (
        sectionCard("Encerrar sessao", (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
              Encerre sua sessao atual e seja redirecionado para a pagina de login.
            </p>
            <button onClick={logout} disabled={loading} className="btn btn-outline" style={{ color: "#e8838c", borderColor: "rgba(232, 131, 140, 0.4)", width: "fit-content" }}>
              {loading ? "Encerrando..." : "Encerrar sessao"}
            </button>
          </div>
        ))
      )}

      {message && (
        <div className="alert-error" style={{ background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(184, 32, 46, 0.1)", borderColor: message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(184, 32, 46, 0.3)", color: message.type === "success" ? "#4ade80" : "#e8838c" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
