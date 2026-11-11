/* =========================================================
   PROSPECTA · app-shell.js
   Injeta shell unificado (sidebar + topbar + logout)
   nas páginas da aplicação. Cada página precisa de um
   <div class="app-shell"> com dois pontos de injeção:
     data-shell-sidebar   -> recebe a sidebar
     data-shell-topbar    -> recebe o topbar
   ========================================================= */

window.AppShell = (function () {
  "use strict";

  var selectors = { sidebar: "[data-shell-sidebar]", topbar: "[data-shell-topbar]", overlay: "[data-shell-overlay]" };

  /* ---------- Estruturas de HTML ---------- */

  var sidebarHtml = function (opts) {
    var isAdmin = opts.isAdmin;
    var user = opts.user || {};
    var nome = user.nome || "Conta";
    var email = user.email || "—";
    var iniciais = user.iniciais || iniciaisDoNome(nome);
    var avatarSrc = user.avatar ? "url(" + user.avatar + ")" : "";

    var menuItens = [];
    if (isAdmin) {
      menuItens = [
        { href: "admin.html", label: "Painel admin", icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>', nav: "admin" },
        { href: "tickets.html", label: "Tickets", icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>', nav: "tickets" },
        { href: "usuarios.html", label: "Usuários", icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M16 20a4.5 4.5 0 0 1 5-4.4"/>', nav: "usuarios" },
      ];
    } else {
      menuItens = [
        { href: "dashboard.html", label: "Dashboard", icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>', nav: "dashboard" },
        { href: "equipes.html", label: "Equipes", icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M16 20a4.5 4.5 0 0 1 5-4.4"/>', nav: "equipes" },
        { href: "configuracoes.html", label: "Configuração", icon: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>', nav: "configuracoes" },
        { href: "login.html", label: "Sair", icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>', nav: "logout", isLogout: true },
      ];
    }

    var menuHtml = menuItens.map(function (it) {
      if (it.isLogout) {
        return '<button class="nav__item nav__item--btn" data-logout>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + it.icon + '</svg>' +
          it.label +
          '</button>';
      }
      var active = window.location.pathname.split("/").pop() === it.href ? ' is-active' : '';
      return '<a class="nav__item' + active + '" href="' + it.href + '" data-nav="' + it.nav + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + it.icon + '</svg>' +
        it.label +
        '</a>';
    }).join("");

    var promoHtml = isAdmin ? '' :
      '<div class="sidebar__promo">' +
      '<h4>Prospecta Pro</h4>' +
      '<p>Seu plano inclui atendimento prioritário, relatórios de faturamento e gerenciamento de equipes.</p>' +
      '<a class="btn btn--outline btn--block mt-16" href="configuracoes.html">Ver plano</a>' +
      '</div>';

    return '' +
    '<aside class="sidebar" id="shell-sidebar">' +
    '  <a class="sidebar__brand" href="' + (isAdmin ? "admin.html" : "dashboard.html") + '">' +
    '    <span class="brand__logo">P</span>' +
    '    <span>' +
    '      <span class="brand__name">Prospecta</span>' +
    '      <span class="brand__plan">' + (isAdmin ? "Painel admin" : "Painel do usuário") + '</span>' +
    '    </span>' +
    '  </a>' +
    '  <nav class="sidebar__nav" id="shell-sidebar-nav">' + menuHtml + '</nav>' +
    promoHtml +
    '  <a class="sidebar__foot" href="configuracoes.html" style="text-decoration:none;color:inherit">' +
    '    <span class="avatar avatar--glow" id="shell-sidebar-avatar" style="background-image:' + (avatarSrc ? avatarSrc : "none") + ';">' + iniciais + '</span>' +
    '    <span class="sidebar__foot-info">' +
    '      <span class="sidebar__foot-name" id="shell-sidebar-name">' + nome + '</span>' +
    '      <span class="sidebar__foot-mail" id="shell-sidebar-email">' + email + '</span>' +
    '    </span>' +
    '  </a>' +
    '</aside>';
  };

  var topbarHtml = function (opts) {
    var title = opts.title || "";
    var crumbs = opts.crumbs || "";
    var isAdmin = opts.isAdmin;

    return '' +
    '<header class="topbar" id="shell-topbar">' +
    '  <button class="icon-btn menu-btn" data-menu-toggle aria-label="Abrir menu" aria-expanded="false">' +
    '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
    '  </button>' +
    '  <div>' +
    '    <div class="topbar__title">' + esc(title) + '</div>' +
    '    ' + (crumbs ? '<div class="topbar__crumbs">' + esc(crumbs) + '</div>' : '') +
    '  </div>' +
    '  <div class="topbar__spacer"></div>' +
    '  <button class="user-menu" id="shell-user-menu" aria-label="Menu do usuário">' +
    '    <span class="avatar avatar--sm" id="shell-topbar-avatar" style="background-image:' + ((opts.user && opts.user.avatar) ? "url(" + opts.user.avatar + ")" : "none") + ';">' + (opts.user && opts.user.iniciais ? opts.user.iniciais : "U") + '</span>' +
    '    <span class="user-menu__name" id="shell-topbar-name">' + ((opts.user && opts.user.nome) ? opts.user.nome : "Conta") + '</span>' +
    '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
    '  </button>' +
    '</header>' +
    '<div class="overlay" data-shell-overlay></div>';
  };

  /* ---------- Utilitários ---------- */

  function iniciaisDoNome(nome) {
    if (!nome) return "U";
    return String(nome).split(/\s+/)
      .map(function (p) { return (p[0] || ""); })
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  }

  function esc(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getPageName() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  /* ---------- Renderização ---------- */

  function render(opts) {
    opts = opts || {};
    var sidebarEl = document.querySelector(selectors.sidebar);
    var topbarEl = document.querySelector(selectors.topbar);
    var overlayEl = document.querySelector(selectors.overlay);

    if (sidebarEl) sidebarEl.innerHTML = sidebarHtml(opts);
    if (topbarEl) topbarEl.innerHTML = topbarHtml(opts);
    if (overlayEl && !overlayEl.innerHTML) overlayEl.innerHTML = "";

    setupShell(opts);
  }

  function setupShell(opts) {
    // Botão hamburguer mobile
    var menuBtn = document.querySelector("[data-menu-toggle]");
    var overlayEl = document.querySelector(selectors.overlay);
    var sidebarEl = document.querySelector(selectors.sidebar);

    if (menuBtn) {
      menuBtn.removeEventListener("click", toggleMenu);
      menuBtn.addEventListener("click", toggleMenu);
    }
    if (overlayEl) {
      overlayEl.removeEventListener("click", closeMenu);
      overlayEl.addEventListener("click", closeMenu);
    }

    // Logout global
    document.querySelectorAll("[data-logout]").forEach(function (el) {
      el.removeEventListener("click", doLogout);
      el.addEventListener("click", doLogout);
    });

    // Atualiza user UI (avatar/nome) quando disponível
    if (opts.user) {
      var u = opts.user;
      var ini = u.iniciais || iniciaisDoNome(u.nome);
      var src = u.avatar ? "url(" + u.avatar + ")" : "none";

      document.querySelectorAll("#shell-sidebar-avatar").forEach(function (el) { el.textContent = ini; if (src !== "none") { el.style.backgroundImage = src; el.textContent = ""; } else { el.style.backgroundImage = ""; el.textContent = ini; } });
      document.querySelectorAll("#shell-sidebar-name").forEach(function (el) { el.textContent = u.nome || "Conta"; });
      document.querySelectorAll("#shell-sidebar-email").forEach(function (el) { el.textContent = u.email || "—"; });
      document.querySelectorAll("#shell-topbar-avatar").forEach(function (el) { el.textContent = ini; if (src !== "none") { el.style.backgroundImage = src; el.textContent = ""; } else { el.style.backgroundImage = ""; el.textContent = ini; } });
      document.querySelectorAll("#shell-topbar-name").forEach(function (el) { el.textContent = u.nome || "Conta"; });
    }
  }

  function toggleMenu() {
    var body = document.body;
    var open = !body.classList.contains("nav-open");
    body.classList.toggle("nav-open", open);
    document.querySelector("[data-menu-toggle]").setAttribute("aria-expanded", open);
  }

  function closeMenu() {
    document.body.classList.remove("nav-open");
    document.querySelector("[data-menu-toggle]").setAttribute("aria-expanded", "false");
  }

  async function doLogout(e) {
    e.preventDefault();
    try {
      var res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Falha ao sair");
    } catch (err) { console.warn(err); }
    window.location.href = "login.html";
  }

  /* ---------- API pública ---------- */

  return {
    render: render,
    setup: setupShell,
    toggleMenu: toggleMenu,
    closeMenu: closeMenu,
    logout: doLogout,
    getPageName: getPageName,
  };
})();
