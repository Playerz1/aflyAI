/* =========================================================
   PROSPECTA IA — js/contratos.js
   CRM de negociações: lista, filtros, registro de vendas, WhatsApp
   ========================================================= */

(function () {
  var P = window.Prospecta;
  var D = window.Prospecta.api;

  var negotiations = [];
  var filters = { status: "all", niche: "all", period: "all" };

  var els = {
    body: document.getElementById("negotiations-body"),
    empty: document.getElementById("negotiations-empty"),
    filterStatus: document.getElementById("filter-status"),
    filterNiche: document.getElementById("filter-niche"),
    filterPeriod: document.getElementById("filter-period"),
    statTotal: document.getElementById("stat-total-negotiations"),
    statSold: document.getElementById("stat-sold"),
    statRevenue: document.getElementById("stat-revenue"),
    btnNew: document.getElementById("btn-new-negotiation"),

    // Modal venda
    modal: document.getElementById("modal-sale"),
    modalClose: document.getElementById("modal-sale-close"),
    saleCancel: document.getElementById("sale-cancel"),
    saleSubmit: document.getElementById("sale-submit"),
    saleForm: document.getElementById("sale-form"),
    saleNegId: document.getElementById("sale-negotiation-id"),
    saleValue: document.getElementById("sale-value"),
    saleTypeRadios: document.querySelectorAll('input[name="sale-type"]'),
    saleMonthly: document.getElementById("sale-monthly"),
    recurringFields: document.getElementById("recurring-fields"),
    saleDate: document.getElementById("sale-date"),
    saleDescription: document.getElementById("sale-description"),
    saleNotes: document.getElementById("sale-notes"),
  };

  /* ---------- Inicialização ---------- */
  function init() {
    // Data padrão: hoje
    var today = new Date().toISOString().split("T")[0];
    els.saleDate.value = today;

    // Filtros
    els.filterStatus.addEventListener("change", function () { filters.status = this.value; render(); });
    els.filterNiche.addEventListener("change", function () { filters.niche = this.value; render(); });
    els.filterPeriod.addEventListener("change", function () { filters.period = this.value; render(); });

    // Modal
    els.modalClose.addEventListener("click", closeModal);
    els.saleCancel.addEventListener("click", closeModal);
    els.saleForm.addEventListener("submit", handleSaleSubmit);

    // Tipo de cobrança
    els.saleTypeRadios.forEach(function (r) {
      r.addEventListener("change", function () {
        els.recurringFields.classList.toggle("is-visible", r.value === "recorrente");
      });
    });

    // Nova negociação
    els.btnNew.addEventListener("click", openNewNegotiation);

    loadData();
  }

  /* ---------- Carregar dados ---------- */
  async function loadData() {
    try {
      var res = await D("/api/negotiations");
      negotiations = res && res.negotiations ? res.negotiations : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn("negotiations API", e);
      negotiations = [];
    }

    // Popular nichos no filtro
    var niches = new Set(negotiations.map(function (n) { return n.niche; }).filter(Boolean));
    var nicheHtml = niches.size ? Array.from(niches).sort().map(function (n) {
      return '<option value="' + P.esc(n) + '">' + P.esc(n) + '</option>';
    }).join("") : "";
    els.filterNiche.innerHTML = '<option value="all">Todos os nichos</option>' + nicheHtml;

    render();
  }

  /* ---------- Renderizar ---------- */
  function render() {
    var list = negotiations.filter(function (n) {
      if (filters.status !== "all" && n.status !== filters.status) return false;
      if (filters.niche !== "all" && n.niche !== filters.niche) return false;
      if (filters.period !== "all") {
        var d = new Date(n.createdAt);
        var now = new Date();
        var days = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        var limit = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : 90;
        if (days > limit) return false;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    // Estatísticas
    var total = negotiations.length;
    var sold = negotiations.filter(function (n) { return n.status === "vendido"; }).length;
    var revenue = negotiations.filter(function (n) { return n.status === "vendido"; }).reduce(function (s, n) { return s + Number(n.value || 0); }, 0);

    P.setText("#stat-total-negotiations", P.numero(total));
    P.setText("#stat-sold", P.numero(sold));
    P.setText("#stat-revenue", P.dinheiro(revenue));

    if (!list.length) {
      els.body.innerHTML = "";
      els.empty.classList.remove("hidden");
      return;
    }

    els.empty.classList.add("hidden");
    els.body.innerHTML = list.map(function (n) {
      var inicial = P.iniciais(n.name || n.nome || "E");
      var statusClass = {
        "em_negociacao": "status--negociacao",
        "aguardando_resposta": "status--aguardando",
        "interessado": "status--interessado",
        "vendido": "status--vendido",
        "nao_vendido": "status--nao-vendido",
        "sem_resposta": "status--sem-resposta"
      }[n.status] || "status--sem-resposta";
      var statusLabel = {
        "em_negociacao": "Em negociação",
        "aguardando_resposta": "Aguardando resposta",
        "interessado": "Interessado",
        "vendido": "Vendido",
        "nao_vendido": "Não vendido",
        "sem_resposta": "Sem resposta"
      }[n.status] || n.status;

      var hasWhats = Boolean(n.whatsapp || n.phone || n.telefone);

      return '' +
        '<tr>' +
        '<td>' +
        '<div class="establishment-info">' +
        '<div class="establishment__avatar">' + inicial + '</div>' +
        '<div class="establishment__details">' +
        '<div class="establishment__name">' + P.esc(n.name || n.nome || "Estabelecimento") + '</div>' +
        '<div class="establishment__sub">' + P.esc(n.email || "") + '</div>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '<td>' + P.esc(n.niche || "—") + '</td>' +
        '<td>' + P.esc(n.city || n.cidade || "—") + '</td>' +
        '<td>' + P.dataHoraBR(n.createdAt) + '</td>' +
        '<td>' + P.esc(n.approachType || n.tipo_abordagem || "—") + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
        '<td class="actions-cell">' +
        (hasWhats ?
          '<button class="btn--icon btn--icon--whatsapp" title="Abrir WhatsApp" onclick="ProspectaContratos.openWhatsApp(\'' + n.id + '\')">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
          '</button>' : '') +
        '<button class="btn--icon" title="Ver detalhes" onclick="ProspectaContratos.viewDetail(\'' + n.id + '\')">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
        '</button>' +
        (n.status === "vendido" ? '' :
          '<button class="btn--icon" title="Registrar venda" onclick="ProspectaContratos.registerSale(\'' + n.id + '\')" style="border-color:' + P.esc('var(--primary)') + ';color:var(--primary);background:var(--primary-glow)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          '</button>') +
        '</td>' +
        '</tr>';
    }).join("");
  }

  /* ---------- Abrir WhatsApp ---------- */
  window.ProspectaContratos = {
    openWhatsApp: function (id) {
      var n = negotiations.find(function (x) { return x.id === id; });
      if (!n) return;
      var phone = (n.whatsapp || n.phone || n.telefone || "").replace(/\D/g, "");
      if (!phone) { P.toast("Sem telefone", "Este estabelecimento não tem telefone cadastrado."); return; }
      var msg = "Olá, " + P.esc(n.name || n.nome) + "! Aqui é da Prospecta IA, seguindo nossa conversa sobre o seu " + P.esc(n.niche) + " em " + P.esc(n.city || n.cidade) + ". Como posso ajudar?";
      window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg), "_blank");
    },
    viewDetail: function (id) {
      var n = negotiations.find(function (x) { return x.id === id; });
      if (!n) return;
      var msg = "Estabelecimento: " + P.esc(n.name || n.nome) + "\n" +
        "Nicho: " + P.esc(n.niche) + "\n" +
        "Cidade: " + P.esc(n.city || n.cidade) + "\n" +
        "Telefone: " + P.esc(n.phone || n.telefone || "—") + "\n" +
        "Status: " + n.status + "\n" +
        "Tipo abordagem: " + P.esc(n.approachType || n.tipo_abordagem || "—") + "\n" +
        "Link demo: " + P.esc(n.demoLink || n.link_projeto || "—") + "\n" +
        "Observações: " + P.esc(n.notes || n.observacoes || "—") + "\n" +
        "Criado em: " + P.dataHoraBR(n.createdAt);
      alert(msg);
    },
    registerSale: function (id) {
      var n = negotiations.find(function (x) { return x.id === id; });
      if (!n) return;
      els.saleNegId.value = id;
      els.saleValue.value = "";
      els.saleDescription.value = "";
      els.saleNotes.value = "";
      els.saleTypeRadios.forEach(function (r) { r.checked = r.value === "unica"; });
      els.recurringFields.classList.remove("is-visible");
      els.saleMonthly.value = "";
      els.modal.classList.add("is-open");
    },
    render: render,
  };

  /* ---------- Modal de venda ---------- */
  function closeModal() {
    els.modal.classList.remove("is-open");
  }

  function openNewNegotiation() {
    // Redireciona para prospecção para criar uma nova
    window.location.href = "prospeccao.html";
  }

  async function handleSaleSubmit(e) {
    e.preventDefault();
    var id = els.saleNegId.value;
    var value = Number(els.saleValue.value || 0);
    var type = document.querySelector('input[name="sale-type"]:checked').value;
    var monthly = Number(els.saleMonthly.value || 0);
    var date = els.saleDate.value;
    var description = els.saleDescription.value.trim();
    var notes = els.saleNotes.value.trim();

    if (!value || value <= 0) { P.toast("Valor inválido", "Informe um valor maior que zero."); return; }
    if (!date) { P.toast("Data inválida", "Informe a data da venda."); return; }

    var payload = {
      negotiationId: id,
      value: value,
      type: type,
      monthlyValue: type === "recorrente" ? monthly : 0,
      date: date,
      description: description,
      notes: notes
    };

    els.saleSubmit.disabled = true;
    try {
      var res = await D("/api/sales", { method: "POST", body: payload });
      if (res && res.ok) {
        P.toast("Venda registrada", "O dashboard será atualizado automaticamente.", "success");
        closeModal();
        loadData(); // recarrega
      } else {
        throw new Error(res && res.error ? res.error : "Falha ao salvar");
      }
    } catch (err) {
      els.saleSubmit.disabled = false;
      P.toast("Erro", (err && err.message) || "Não foi possível registrar a venda.");
    }
  }

  /* ---------- Iniciar ---------- */
  if (document.getElementById("negotiations-body")) {
    init();
  }
})();
