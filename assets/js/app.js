/* =========================================================
   PROSPECTA · app.js
   JavaScript compartilhado por todas as páginas (HTML puro)
   - Sidebar móvel (hambúrguer + overlay)
   - Abas, segmented, toast, modal
   - Marca o item ativo do menu automaticamente
   - Pequenos helpers usados pelos formulários das páginas
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  function initSidebar() {
    var body = document.body;
    var menuBtn = document.querySelector("[data-menu-toggle]");
    var overlay = document.querySelector(".overlay");

    function open() {
      body.classList.add("nav-open");
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    }
    function close() {
      body.classList.remove("nav-open");
      if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    }

    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        body.classList.contains("nav-open") ? close() : open();
      });
    }
    if (overlay) overlay.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        close();
        closeModals();
      }
    });

    // Fecha o menu ao clicar em um link (navegação)
    document.querySelectorAll(".sidebar__nav a.nav__item").forEach(function (link) {
      link.addEventListener("click", close);
    });

    // Se a tela virar desktop, garante que o overlay suma
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* ---------- Item ativo do menu ---------- */
  function initActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll(".sidebar__nav .nav__item").forEach(function (link) {
      if (link.getAttribute("data-nav") === page) link.classList.add("is-active");
    });
  }

  /* ---------- Abas ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      var tabs = group.querySelectorAll(".tab");
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) { t.classList.remove("is-active"); });
          tab.classList.add("is-active");

          var target = tab.getAttribute("data-target");
          if (!target) return;
          var scope = group.getAttribute("data-tabs");
          document.querySelectorAll('[data-panel][data-owner="' + scope + '"]').forEach(function (p) {
            p.classList.toggle("hide", p.getAttribute("data-panel") !== target);
          });
        });
      });
    });
  }

  /* ---------- Segmented control ---------- */
  function initSegmented() {
    document.querySelectorAll(".seg").forEach(function (seg) {
      seg.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          seg.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
        });
      });
    });
  }

  /* ---------- Filtros (chips) ---------- */
  function initChips() {
    document.querySelectorAll("[data-chip-group]").forEach(function (group) {
      group.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          group.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
          chip.classList.add("is-active");
          filterRows(group.getAttribute("data-chip-group"), chip.getAttribute("data-filter"));
        });
      });
    });
  }

  function filterRows(group, value) {
    document.querySelectorAll('[data-row-group="' + group + '"]').forEach(function (table) {
      table.setAttribute("data-active-filter", value || "all");
    });
    document.querySelectorAll('[data-row-group="' + group + '"] tr[data-status]').forEach(function (row) {
      var match = !value || value === "all" || row.getAttribute("data-status") === value;
      row.classList.toggle("hide", !match);
    });
  }

  // Reaplica o filtro ativo depois de renderizar linhas dinâmicas
  window.ProspectaFiltro = function (group) {
    var table = document.querySelector('[data-row-group="' + group + '"]');
    if (!table) return;
    filterRows(group, table.getAttribute("data-active-filter") || "all");
  };

  /* ---------- Busca em tabela (client-side) ---------- */
  function initTableSearch() {
    document.querySelectorAll("[data-search]").forEach(function (input) {
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var table = document.querySelector(input.getAttribute("data-search"));
        if (!table) return;
        table.querySelectorAll("tbody tr").forEach(function (row) {
          row.classList.toggle("hide", q !== "" && row.innerText.toLowerCase().indexOf(q) === -1);
        });
      });
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(title, message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.querySelector("[data-toast-title]").textContent = title || "Feito!";
    el.querySelector("[data-toast-text]").textContent = message || "";
    el.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-open"); }, 3200);
  }

  /* ---------- Modal ---------- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("is-open");
    document.body.style.overflow = "hidden";
    var first = m.querySelector("input, select, textarea");
    if (first) setTimeout(function () { first.focus(); }, 120);
  }

  function closeModals() {
    document.querySelectorAll(".modal.is-open").forEach(function (m) { m.classList.remove("is-open"); });
    document.body.style.overflow = "";
  }

  function initModals() {
    document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () { openModal(btn.getAttribute("data-modal-open")); });
    });
    document.querySelectorAll("[data-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", closeModals);
    });
    document.querySelectorAll(".modal").forEach(function (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModals();
      });
    });
  }

  /* ---------- Botões que só dão feedback (MVP sem backend) ---------- */
  function initDemoActions() {
    document.querySelectorAll("[data-toast]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.getAttribute("data-toast").split("|");
        toast(parts[0], parts[1]);
      });
    });
  }

  /* ---------- Notification dropdown ---------- */
  function initNotifications() {
    var notifBtn = document.getElementById('notif-btn');
    var notifDropdown = document.getElementById('notif-dropdown');
    var notifDot = document.getElementById('notif-dot');
    var notifList = document.getElementById('notif-list');
    var notifClear = notifDropdown ? notifDropdown.querySelector('.notif-clear') : null;
    if (!notifBtn || !notifDropdown || !notifList) return;

    function renderNotifications(activities) {
      if (!activities || !activities.length) {
        notifList.innerHTML = '<div class="empty" style="padding:24px 16px"><div class="empty__title">Sem notificações</div><div class="empty__text">Quando houver novidades, elas aparecem aqui.</div></div>';
        if (notifDot) notifDot.style.display = 'none';
        return;
      }
      var unreadCount = activities.filter(function(a) { return !a.read; }).length;
      if (notifDot) notifDot.style.display = unreadCount > 0 ? '' : 'none';

      var html = activities.map(function(a) {
        var iconClass = 'notif-item__icon--alert';
        var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
        if (a.type === 'ticket') { iconClass = 'notif-item__icon--ticket'; iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>'; }
        else if (a.type === 'lead') { iconClass = 'notif-item__icon--lead'; iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'; }
        else if (a.type === 'payment') { iconClass = 'notif-item__icon--payment'; iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 5v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>'; }
        else if (a.type === 'contract') { iconClass = 'notif-item__icon--contract'; iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg>'; }
        var unreadClass = a.read ? '' : ' unread';
        return '<div class="notif-item' + unreadClass + '" data-id="' + a.id + '">' +
          '<div class="notif-item__icon ' + iconClass + '">' + iconSvg + '</div>' +
          '<div class="notif-item__body">' +
            '<div class="notif-item__title">' + (window.Dados && window.Dados.esc ? window.Dados.esc(a.title) : a.title) + '</div>' +
            '<div class="notif-item__text">' + (window.Dados && window.Dados.esc ? window.Dados.esc(a.text) : a.text) + '</div>' +
            '<div class="notif-item__time">' + (window.Dados && window.Dados.haQuanto ? window.Dados.haQuanto(a.time) : '') + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      notifList.innerHTML = html;
    }

    function loadNotifications() {
      if (window.Dados && window.Dados.atividades) {
        var acts = window.Dados.atividades();
        renderNotifications(acts);
      }
    }

    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('is-open');
      if (notifDropdown.classList.contains('is-open')) {
        loadNotifications();
      }
    });

    document.addEventListener('click', function(e) {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('is-open');
      }
    });

    if (notifClear) {
      notifClear.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.Dados && window.Dados.marcarLidas) {
          window.Dados.marcarLidas().then(loadNotifications);
        }
      });
    }

    // Listen for data refresh
    window.addEventListener('prospecta:mudou', function(e) {
      if (e.detail && e.detail.key === 'activities') loadNotifications();
    });

    // Initial load
    loadNotifications();
  }

  /* ---------- Switch: persistência simples no localStorage ---------- */
  function initSwitches() {
    document.querySelectorAll("input[type=checkbox][data-remember]").forEach(function (input) {
      var key = "prospecta:" + input.getAttribute("data-remember");
      try {
        var saved = localStorage.getItem(key);
        if (saved !== null) input.checked = saved === "1";
      } catch (e) { }
      input.addEventListener("change", function () {
        try { localStorage.setItem(key, input.checked ? "1" : "0"); } catch (e) { }
      });
    });
  }

  /* ---------- Copiar para a área de transferência ---------- */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var selector = btn.getAttribute("data-copy");
        var source = selector === "self" ? btn : document.querySelector(selector);
        var text = source ? (source.innerText || source.textContent || "").trim() : "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            toast("Copiado!", "O conteúdo está na sua área de transferência.");
          });
        } else {
          toast("Copiado!", "Não foi possível acessar a área de transferência.");
        }
      });
    });
  }

  /* ---------- Contadores animados (KPIs) ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // valores vindos da API são renderizados diretamente (sem animação de contagem)
    if (document.body && document.body.getAttribute("data-dados-reais") === "1") return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var prefix = el.getAttribute("data-prefix") || "";
        var suffix = el.getAttribute("data-suffix") || "";
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var start = performance.now();
        var dur = 700;

        function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = prefix + val.toLocaleString("pt-BR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Central de ajuda (painel lateral de suporte) ----------
     Marcação padrão presente em todas as páginas:
       <button class="nav__item nav__item--btn" data-support-toggle>Ajuda</button>
       <div class="support" id="support" data-support></div>
     A lógica de atendimento vive em assets/js/support.js.
  ---------------------------------------------------------------- */
  function initSupportPanel() {
    var panel = document.querySelector("[data-support]");
    if (!panel) return;

    document.querySelectorAll("[data-support-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        panel.classList.toggle("is-open");
        if (window.Suporte && panel.classList.contains("is-open")) window.Suporte.aoAbrir();
      });
    });
  }

  /* ---------- Expõe helpers globalmente (usado em editor.html) ---------- */
  window.Prospecta = {
    toast: toast,
    openModal: openModal,
    closeModals: closeModals
  };

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    // sessão/auth (store.js): preenche usuário no topo/rodapé e protege rotas quando API ativa
    (function initAuthUI(){
      var D = window.Dados; if (!D || !D.pronto) return;
      var page = document.body.getAttribute('data-page') || '';
      var publicPages = { login:1, cadastro:1, 'admin-login':1 };
      D.pronto().then(function(){
        var me = D.eu ? D.eu() : null;
        var mode = D.modo ? D.modo() : 'unknown';
        if (mode === 'api' && !me && !publicPages[page]) {
          if (/^(admin|tickets|usuarios)$/.test(page)) location.replace('login.html?destino=' + page + '.html');
          else location.replace('login.html');
          return;
        }
        if (me) {
          var name = me.nome || 'Usuário';
          var ini = me.iniciais || (name.split(/\s+/).map(function(p){return p[0]||''}).join('').slice(0,2).toUpperCase());
          document.querySelectorAll('.sidebar__foot-name').forEach(function(el){ el.textContent = name; });
          document.querySelectorAll('.sidebar__foot-mail').forEach(function(el){ if(!el.hasAttribute('data-keep-mail')) el.textContent = me.email || ''; });
          document.querySelectorAll('.sidebar__foot .avatar, .user-menu .avatar').forEach(function(el){ el.textContent = ini; });
          var um = document.querySelector('.user-menu__name'); if (um) um.textContent = name.split(/\s+/)[0] || name;
          if (me.papel !== 'admin') {
            document.querySelectorAll('a[href="admin.html"],a[href="tickets.html"],a[href="usuarios.html"]').forEach(function(a){ var li=a.closest('li'); if(li) li.style.display='none'; else a.style.display='none'; });
          }
        }
        document.querySelectorAll('[data-logout], [data-logout-link]').forEach(function(el){
          if (el.__prospectaLogout) return; el.__prospectaLogout = true;
          el.addEventListener('click', function(e){ e.preventDefault(); Promise.resolve(D.sairAdmin && D.sairAdmin()).finally(function(){ location.href='login.html'; }); });
        });
      }).catch(function(){});
    })();

    initSidebar();
    initActiveNav();
    initTabs();
    initSegmented();
    initChips();
    initTableSearch();
    initModals();
    initDemoActions();
initSwitches();
    initCopy();
    initCounters();
    initSupportPanel();
    initNotifications();
  });
})();
