"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import InfoprodutoWizard from "./InfoprodutoWizard";

export function Sidebar({ user }: { user: { id: string; name: string } }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">A</div>
          <span className="logo-text">AflyAI</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            onClick={() => router.push("/dashboard?tab=")}
            role="button"
            tabIndex={0}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button
            className="nav-item"
            onClick={() => router.push("/dashboard?tab=historico")}
            role="button"
            tabIndex={0}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Historico</span>
          </button>
          <button
            className="nav-item"
            onClick={() => router.push("/configuracoes")}
            role="button"
            tabIndex={0}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 14a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.65a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l.06.06a1.65 1.65 0 0 0 1 1.51V19a1.65 1.65 0 0 0 1.51 1H17a1.65 1.65 0 0 0 1-1.51 1.65 1.65 0 0 0-1.51-1.82z" />
            </svg>
            <span>Configuracoes</span>
          </button>
        </nav>

        <button className="btn-add-small" onClick={() => setWizardOpen(true)} aria-label="Criar infoproduto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Criar</span>
        </button>

        <div className="sidebar-footer">
          <div className="avatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</div>
          <div className="user-meta">
            <div className="user-name">{user.name.split(" ")[0]}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <InfoprodutoWizard open={wizardOpen} onClose={() => setWizardOpen(false)} userId={user.id} />
    </>
  );
}

export function Hotbar({ userId }: { userId: string }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <nav className="hotbar">
        <button
          className="hotbar-item"
          onClick={() => router.push("/dashboard?tab=")}
          role="button"
          tabIndex={0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          className="hotbar-item"
          onClick={() => router.push("/dashboard?tab=historico")}
          role="button"
          tabIndex={0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Historico</span>
        </button>

        <button className="hotbar-add" onClick={() => setWizardOpen(true)} aria-label="Criar infoproduto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          className="hotbar-item"
          onClick={() => router.push("/configuracoes")}
          role="button"
          tabIndex={0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 14a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.65a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l.06.06a1.65 1.65 0 0 0 1 1.51V19a1.65 1.65 0 0 0 1.51 1H17a1.65 1.65 0 0 0 1-1.51 1.65 1.65 0 0 0-1.51-1.82z" />
          </svg>
          <span>Config</span>
        </button>

        <button
          className="hotbar-item hotbar-exit"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </nav>

      <InfoprodutoWizard open={wizardOpen} onClose={() => setWizardOpen(false)} userId={userId} />
    </>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button className="icon-btn" onClick={logout} title="Sair da conta" aria-label="Sair da conta" disabled={busy}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
