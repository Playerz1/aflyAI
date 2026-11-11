/* =========================================================
   PROSPECTA IA — js/global.js
   Utilitários compartilhados: toast, API, auth, formatação
   ========================================================= */

window.Prospecta = (function () {
  "use strict";

  var baseApi = "";

  /* ---------- Toast ---------- */
  function toast(titulo, texto, tipo) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.innerHTML =
        '<svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>' +
        '<div><strong data-toast-title>Feito!</strong><small data-toast-text></small></div>';
      document.body.appendChild(el);
    }
    var tEl = el.querySelector("[data-toast-title]");
    var sEl = el.querySelector("[data-toast-text]");
    if (tEl) tEl.textContent = titulo || "Feito!";
    if (sEl) sEl.textContent = texto || "";
    el.className = "toast";
    if (tipo === "success") el.classList.add("toast--success");
    el.classList.add("is-open");
    setTimeout(function () { el.classList.remove("is-open"); }, 4000);
  }

  /* ---------- Formatação ---------- */
  function dinheiro(valor) {
    var n = Number(valor || 0);
    return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function numero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function dataBR(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function dataHoraBR(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function iniciais(nome) {
    if (!nome) return "U";
    return String(nome).split(/\s+/)
      .map(function (p) { return (p[0] || ""); })
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";
  }

  /* ---------- Chamada à API ---------- */
  function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json", Accept: "application/json" };
    var init = { method: opts.method || "GET", headers: headers, credentials: "include" };
    if (opts.body) init.body = JSON.stringify(opts.body);
    return fetch(path, init).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (txt) {
          throw new Error(txt || r.statusText || "Erro na API");
        });
      }
      if (r.status === 204 || r.headers.get("content-length") === "0") return null;
      return r.json();
    });
  }

  /* ---------- Estado de sessão ---------- */
  function getSession() {
    try {
      var s = localStorage.getItem("prospecta:session");
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function setSession(user) {
    try { localStorage.setItem("prospecta:session", JSON.stringify({ user: user })); } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem("prospecta:session"); } catch (e) {}
  }
  function isAuthenticated() { return !!getSession(); }
  function getUser() { var s = getSession(); return s ? s.user : null; }

  /* ---------- Helpers DOM ---------- */
  function esc(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setText(sel, value) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = value; });
  }

  return {
    toast: toast,
    dinheiro: dinheiro,
    numero: numero,
    dataBR: dataBR,
    dataHoraBR: dataHoraBR,
    iniciais: iniciais,
    api: api,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    isAuthenticated: isAuthenticated,
    getUser: getUser,
    esc: esc,
    setText: setText,
  };
})();
