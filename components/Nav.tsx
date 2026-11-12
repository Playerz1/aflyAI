"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AddSaleModal from "./AddSaleModal";

export function Sidebar({ user }: { user: { name: string } }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">A</div>
          <span className="logo-text">AflyAI</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            <span>Dashboard</span>
          </div>
        </nav>

        <button className="btn-add-big" onClick={() => setModalOpen(true)} aria-label="Adicionar venda">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Adicionar</span>
        </button>

        <div className="sidebar-footer">
          <div className="avatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</div>
          <div className="user-meta">
            <span className="user-name">{user.name.split(" ")[0]}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <AddSaleModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export function Hotbar() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <nav className="hotbar">
        <div className="hotbar-item active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span>Dashboard</span>
        </div>

        <button className="hotbar-add" onClick={() => setModalOpen(true)} aria-label="Adicionar venda">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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

      <AddSaleModal open={modalOpen} onClose={() => setModalOpen(false)} />
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
