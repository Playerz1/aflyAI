/* =========================================================
   PROSPECTA · app.js — UI compartilhada
   Toast, formatação de dinheiro, inicialização de shell
   ========================================================= */

window.Prospecta = (function () {
  "use strict";

  var D = window.Dados;

  /* ---------- Toast ---------- */
  function toast(titulo, texto) {
    var el = document.getElementById("toast");
    if (!el) return;
    var tEl = el.querySelector("[data-toast-title]");
    var sEl = el.querySelector("[data-toast-text]");
    if (tEl) tEl.textContent = titulo || "Feito!";
    if (sEl) sEl.textContent = texto || "";
    el.classList.add("is-open");
    setTimeout(function () { el.classList.remove("is-open"); }, 4000);
  }

  /* ---------- Formatação ---------- */
  function dinheiro(valor) {
    return D ? D.dinheiro(valor) : ("R$ " + Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  function num(valor) {
    return D ? D.num(valor) : Number(valor || 0).toLocaleString("pt-BR");
  }

  /* ---------- Inicialização do shell nas páginas da app ---------- */
  function initShell(opts) {
    opts = opts || {};
    if (window.AppShell) {
      window.AppShell.render(opts);
    }
    setupGlobalLogout();
  }

  function setupGlobalLogout() {
    document.querySelectorAll("[data-logout]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        if (confirm("Deseja sair da sua conta?")) {
          D.logout().then(function () {
            window.location.href = "login.html";
          }).catch(function () {
            window.location.href = "login.html";
          });
        }
      });
    });
  }

  /* ---------- Avatar utils ---------- */
  function iniciarAvatares(usuario) {
    if (!usuario) return;
    var ini = usuario.iniciais || iniciaisDoNome(usuario.nome);
    var src = usuario.avatar ? "url(" + usuario.avatar + ")" : "none";
    document.querySelectorAll(".avatar-update").forEach(function (el) {
      if (src !== "none") { el.style.backgroundImage = src; el.textContent = ""; } else { el.style.backgroundImage = ""; el.textContent = ini; }
    });
    document.querySelectorAll(".nome-update").forEach(function (el) { el.textContent = usuario.nome || "Conta"; });
    document.querySelectorAll(".email-update").forEach(function (el) { el.textContent = usuario.email || "—"; });
  }
  function iniciaisDoNome(nome) {
    if (!nome) return "U";
    return String(nome).split(/\s+/).map(function (p) { return (p[0] || ""); }).join("").slice(0, 2).toUpperCase() || "U";
  }

  return {
    toast: toast,
    dinheiro: dinheiro,
    num: num,
    initShell: initShell,
    iniciarAvatares: iniciarAvatares,
    iniciaisDoNome: iniciaisDoNome,
    setupGlobalLogout: setupGlobalLogout,
  };
})();
