/* =========================================================
   PROSPECTA IA — js/prospeccao.js
   Fluxo de prospecção: projeto → nicho → localização → prompt → estabelecimentos
   ========================================================= */

(function () {
  var P = window.Prospecta;

  /* ---------- Dados fixos ---------- */
  var NICHOS = [
    "Sorveteria", "Pizzaria", "Hamburgueria", "Restaurante", "Lanchonete",
    "Cafeteria", "Padaria", "Doceria", "Açaíteria", "Salão de beleza",
    "Barbearia", "Clínica odontológica", "Clínica médica", "Academia", "Personal trainer",
    "Pet shop", "Clínica veterinária", "Loja de roupas", "Loja de calçados", "Loja de móveis",
    "Imobiliária", "Oficina mecânica", "Lava-rápido", "Autoescola", "Hotel",
    "Pousada", "Agência de viagens", "Fotógrafo", "Advogado", "Contabilidade",
    "Eletricista", "Encanador", "Construtora", "Dedetizadora", "Floricultura"
  ];

  var ESTADOS = [
    { sigla: "AC", nome: "Acre" }, { sigla: "AL", nome: "Alagoas" }, { sigla: "AP", nome: "Amapá" },
    { sigla: "AM", nome: "Amazonas" }, { sigla: "BA", nome: "Bahia" }, { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" }, { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" }, { sigla: "MA", nome: "Maranhão" }, { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "MS", nome: "Mato Grosso do Sul" }, { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "PA", nome: "Pará" }, { sigla: "PB", nome: "Paraíba" }, { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PI", nome: "Piauí" }, { sigla: "PR", nome: "Paraná" }, { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" }, { sigla: "RO", nome: "Rondônia" },
    { sigla: "RS", nome: "Rio Grande do Sul" }, { sigla: "RR", nome: "Roraima" },
    { sigla: "SC", nome: "Santa Catarina" }, { sigla: "SE", nome: "Sergipe" },
    { sigla: "SP", nome: "São Paulo" }, { sigla: "TO", nome: "Tocantins" }
  ];

  /* ---------- Estado do fluxo ---------- */
  var state = {
    step: 1,
    project: "site",
    niche: null,
    state: null,
    city: null,
    establishments: []
  };

  /* ---------- Elementos ---------- */
  var els = {
    steps: document.querySelectorAll(".step"),
    contents: document.querySelectorAll(".step-content"),
    projectCards: document.querySelectorAll(".project-card"),
    nichosGrid: document.getElementById("nichos-grid"),
    nichosSearch: document.getElementById("nichos-search"),
    statesList: document.getElementById("states-list"),
    cityInput: document.getElementById("city-input"),
    establishmentsGrid: document.getElementById("establishments-grid"),
    establishmentsEmpty: document.getElementById("establishments-empty"),
    establishmentsSearch: document.getElementById("establishments-search"),
    promptBox: document.getElementById("prompt-box"),
  };

  /* ---------- Navegação de etapas ---------- */
  function showStep(n) {
    state.step = n;
    els.steps.forEach(function (s) {
      var sn = parseInt(s.getAttribute("data-step"), 10);
      s.classList.toggle("step--active", sn === n);
      s.classList.toggle("step--completed", sn < n);
    });
    els.contents.forEach(function (c) {
      c.classList.toggle("is-active", c.id === "step-" + n);
    });
  }

  function nextStep() {
    if (state.step < 5) showStep(state.step + 1);
  }
  function prevStep() {
    if (state.step > 1) showStep(state.step - 1);
  }

  /* ---------- ETAPA 1: Tipo de projeto ---------- */
  els.projectCards.forEach(function (card) {
    card.addEventListener("click", function () {
      els.projectCards.forEach(function (c) { c.classList.remove("is-selected"); });
      card.classList.add("is-selected");
      state.project = card.getAttribute("data-project");
      updateSummary();
    });
  });

  document.getElementById("btn-step-1-next").addEventListener("click", function () {
    nextStep();
  });

  /* ---------- ETAPA 2: Nicho ---------- */
  function renderNichos(filter) {
    filter = (filter || "").toLowerCase();
    var filtered = NICHOS.filter(function (n) { return n.toLowerCase().indexOf(filter) >= 0; });
    els.nichosGrid.innerHTML = filtered.map(function (nicho) {
      var selected = state.niche === nicho ? "is-selected" : "";
      return '<div class="nicho-chip ' + selected + '" data-nicho="' + P.esc(nicho) + '">' + P.esc(nicho) + '</div>';
    }).join("");

    els.nichosGrid.querySelectorAll(".nicho-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        els.nichosGrid.querySelectorAll(".nicho-chip").forEach(function (c) { c.classList.remove("is-selected"); });
        chip.classList.add("is-selected");
        state.niche = chip.getAttribute("data-nicho");
        document.getElementById("btn-step-2-next").disabled = false;
        updateSummary();
      });
    });
  }

  els.nichosSearch.addEventListener("input", function () {
    renderNichos(this.value);
  });

  document.getElementById("btn-step-2-prev").addEventListener("click", prevStep);
  document.getElementById("btn-step-2-next").addEventListener("click", function () {
    nextStep();
  });

  /* ---------- ETAPA 3: Localização ---------- */
  function renderStates() {
    els.statesList.innerHTML = ESTADOS.map(function (e) {
      var selected = state.state && state.state.sigla === e.sigla ? "is-selected" : "";
      return '<div class="state-item ' + selected + '" data-sigla="' + e.sigla + '" data-nome="' + e.nome + '">' + e.nome + " (" + e.sigla + ")</div>";
    }).join("");

    els.statesList.querySelectorAll(".state-item").forEach(function (item) {
      item.addEventListener("click", function () {
        els.statesList.querySelectorAll(".state-item").forEach(function (i) { i.classList.remove("is-selected"); });
        item.classList.add("is-selected");
        state.state = { sigla: item.getAttribute("data-sigla"), nome: item.getAttribute("data-nome") };
        state.city = null;
        els.cityInput.value = "";
        els.cityInput.disabled = false;
        els.cityInput.focus();
        document.getElementById("btn-step-3-next").disabled = false;
        updateSummary();
      });
    });
  }

  els.cityInput.addEventListener("input", function () {
    state.city = this.value.trim() || null;
    document.getElementById("btn-step-3-next").disabled = !(state.state && state.city);
    updateSummary();
  });

  document.getElementById("btn-step-3-prev").addEventListener("click", prevStep);
  document.getElementById("btn-step-3-next").addEventListener("click", function () {
    nextStep();
  });

  renderStates();

  /* ---------- ETAPA 4: Prompt Lovable ---------- */
  function generatePrompt() {
    var projectLabel = state.project === "site" ? "website institucional" : "aplicativo web/mobile";
    var nicheLabel = state.niche || "não definido";
    var locationLabel = (state.city ? state.city + ", " : "") + (state.state ? state.state.nome + " (" + state.state.sigla + ")" : "não definida");

    var prompt = '' +
      'Crie um ' + projectLabel + ' moderno e profissional para um estabelecimento do nicho ' + nicheLabel + ', localizado em ' + locationLabel + '.\n\n' +
      'IDENTIDADE VISUAL:\n' +
      '- Tema premium com fundo preto/azul escuro (#05070c, #090e19)\n' +
      '- Azul elétrico (#1677ff) e azul neon (#00d4ff) como cores de destaque\n' +
      '- Efeitos glassmorphism (backdrop blur, transparências, bordas finas)\n' +
      '- Gradientes sofisticados entre azul e preto\n' +
      '- Tipografia moderna (Inter), ícones Lucide\n' +
      '- Animações fluidas, transições suaves, efeitos hover\n\n' +
      'ESTRUTURA DAS PÁGINAS:\n' +
      '- Página inicial com hero section, call-to-action e confiança (trust bar)\n' +
      '- Página de serviços/produtos do nicho ' + nicheLabel + '\n' +
      '- Página de contato com formulário e WhatsApp\n' +
      '- Página sobre / quem somos\n' +
      '- Rodapé com links e redes sociais\n\n' +
      'SEÇÕES NECESSÁRIAS:\n' +
      '- Hero com headline, descrição e botão de chamada\n' +
      '- Depoimentos ou prova social\n' +
      '- Dados de localização (cidade e estado) para SEO local\n' +
      '- Botões de contato visíveis (WhatsApp, telefone, e-mail)\n' +
      '- Formulário de orçamento/agendamento\n\n' +
      'RESPONSIVIDADE:\n' +
      '- Mobile-first, adaptação para tablet e desktop\n' +
      '- Menu hambúrguer em telas pequenas\n' +
      '- Cards reorganizados por breakpoint\n\n' +
      'EXPERIÊNCIA MOBILE:\n' +
      '- Carregamento rápido, imagens otimizadas\n' +
      '- Botões com tamanho adequado para toque\n' +
      '- Formulários fáceis de preencher no celular\n\n' +
      'FUNCIONALIDADES ESPECÍFICAS DO SEGMENTO (' + nicheLabel + '):\n' +
      '- Destaque para os principais serviços oferecidos\n' +
      '- Informações de horário de funcionamento\n' +
      '- Localização com mapa ou endereço completo\n' +
      '- Integração com WhatsApp para atendimento direto\n\n' +
      'TEXTOS COMERCIAIS:\n' +
      '- Copy persuasiva focada em conversão local\n' +
      '- Chamadas para ação claras (agendar, orçar, contatar)\n' +
      '- Valorização da presença digital para negócios locais\n\n' +
      'SEO LOCAL:\n' +
      '- Meta tags com cidade e estado (' + locationLabel + ')\n' +
      '- Dados estruturados (schema.org LocalBusiness)\n' +
      '- Palavras-chave do nicho + cidade no conteúdo\n\n' +
      'Tecnologias: HTML5, CSS3, JavaScript vanilla, design responsivo, sem frameworks pesados.';

    return prompt;
  }

  function renderPrompt() {
    var prompt = generatePrompt();
    els.promptBox.textContent = prompt;
  }

  document.getElementById("btn-copy-prompt").addEventListener("click", function () {
    var text = els.promptBox.textContent;
    navigator.clipboard.writeText(text).then(function () {
      P.toast("Prompt copiado", "O prompt está na área de transferência.", "success");
    }).catch(function () {
      // Fallback
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      P.toast("Prompt copiado", "O prompt está na área de transferência.", "success");
    });
  });

  document.getElementById("btn-open-lovable").addEventListener("click", function () {
    var prompt = els.promptBox.textContent;
    var url = "https://lovable.dev/?prompt=" + encodeURIComponent(prompt);
    window.open(url, "_blank");
    P.toast("Lovable aberto", "Cole o prompt se não for preenchido automaticamente.");
  });

  document.getElementById("btn-step-4-prev").addEventListener("click", prevStep);
  document.getElementById("btn-step-4-next").addEventListener("click", function () {
    // Salvar projeto no backend se autenticado
    saveProject().then(function () {
      nextStep();
      loadEstablishments();
    });
  });

  /* ---------- ETAPA 5: Estabelecimentos ---------- */
  function loadEstablishments() {
    // Tenta buscar de uma API real de estabelecimentos; se não houver, usa mock vazio com mensagem
    els.establishmentsGrid.innerHTML = "";
    els.establishmentsEmpty.classList.add("hidden");

    // Nota: não há API pública gratuita sem chave para busca de estabelecimentos por nicho.
    // O sistema prepara a estrutura e avisa o usuário.
    els.establishmentsGrid.innerHTML = '' +
      '<div class="empty-results" style="text-align:center;padding:64px 24px">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="12" cy="17" r="1"/><path d="M5 19h14"/></svg>' +
      '<div class="empty-results__title">Integração de busca de estabelecimentos</div>' +
      '<div class="empty-results__text" style="margin-bottom:20px">Para buscar estabelecimentos reais, configure uma API de mapas/locais (ex.: Google Places) nas variáveis de ambiente.</div>' +
      '<button class="btn btn--outline" id="btn-add-manual">Adicionar estabelecimento manualmente</button>' +
      '</div>';

    document.getElementById("btn-add-manual").addEventListener("click", function () {
      var nome = prompt("Nome do estabelecimento:");
      if (!nome) return;
      var nicho = prompt("Nicho (ex: Sorveteria):", state.niche || "");
      if (!nicho) return;
      var cidade = prompt("Cidade:", state.city || "");
      if (!cidade) return;
      var estado = prompt("Estado (sigla, ex: SP):", state.state ? state.state.sigla : "");
      if (!estado) return;
      var telefone = prompt("Telefone/WhatsApp (opcional):");
      var site = prompt("Site atual (opcional):");

      var estab = {
        id: "est_" + Date.now(),
        nome: nome,
        nicho: nicho,
        cidade: cidade,
        estado: estado,
        telefone: telefone || "",
        site: site || "",
        whatsapp: telefone ? telefone.replace(/\D/g, "") : "",
        avaliacao: null,
        criado: new Date().toISOString()
      };

      state.establishments.unshift(estab);
      renderEstablishments();
      P.toast("Estabelecimento adicionado", nome + " foi registrado.");
    });
  }

  function renderEstablishments() {
    var filter = (els.establishmentsSearch.value || "").toLowerCase();
    var list = state.establishments.filter(function (e) {
      var s = (e.nome + " " + e.nicho + " " + e.cidade + " " + e.estado).toLowerCase();
      return s.indexOf(filter) >= 0;
    });

    if (!list.length) {
      els.establishmentsGrid.innerHTML = "";
      els.establishmentsEmpty.classList.remove("hidden");
      return;
    }

    els.establishmentsEmpty.classList.add("hidden");
    els.establishmentsGrid.innerHTML = list.map(function (e) {
      var inicial = P.iniciais(e.nome);
      var hasWhats = Boolean(e.whatsapp);
      return '' +
        '<div class="establishment-card" data-id="' + e.id + '">' +
        '<div class="establishment-card__header">' +
        '<div class="establishment-card__name">' + P.esc(e.nome) + '</div>' +
        '<div class="establishment-card__rating">' +
        (e.avaliacao ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.14 14.13l1.18-6.88L9.91 9.27l3.09-6.26L12 2z"/><path d="M12 15V7"/><path d="M7 12h10"/>' +
          '<span style="margin-left:4px">' + e.avaliacao + '</span>' +
        '</div>' : '<span>Sem avaliação</span>') +
        '</div>' +
        '</div>' +
        '<div class="establishment-card__meta">' +
        '<span>📍 ' + P.esc(e.cidade) + ', ' + P.esc(e.estado) + '</span>' +
        '</div>' +
        '<div class="establishment-card__meta">' +
        '<span>🏷️ ' + P.esc(e.nicho) + '</span>' +
        '</div>' +
        (e.telefone ? '<div class="establishment-card__meta"><span>📞 ' + P.esc(e.telefone) + '</span></div>' : '') +
        (e.site ? '<div class="establishment-card__meta"><span>🌐 ' + P.esc(e.site) + '</span></div>' : '') +
        '<div class="establishment-card__actions">' +
        '<button class="btn--text" onclick="ProspectaProspeccao.selectEstablishment(\'' + e.id + '\')">' +
        (hasWhats ? 'Abrir WhatsApp' : 'Selecionar') +
        '</button>' +
        '<button class="btn--text" style="color:var(--text-muted)" onclick="event.stopPropagation();ProspectaProspeccao.deleteEstablishment(\'' + e.id + '\')">Remover</button>' +
        '</div>' +
        '</div>';
    }).join("");

    els.establishmentsGrid.querySelectorAll(".establishment-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.getAttribute("data-id");
        ProspectaProspeccao.selectEstablishment(id);
      });
    });
  }

  els.establishmentsSearch.addEventListener("input", function () {
    renderEstablishments();
  });

  document.getElementById("btn-step-5-prev").addEventListener("click", prevStep);
  document.getElementById("btn-step-5-new").addEventListener("click", function () {
    state = { step: 1, project: "site", niche: null, state: null, city: null, establishments: state.establishments };
    showStep(1);
    renderNichos("");
    renderStates();
    updateSummary();
  });

  /* ---------- Seleção de estabelecimento → WhatsApp ---------- */
  window.ProspectaProspeccao = {
    selectEstablishment: function (id) {
      var e = state.establishments.find(function (x) { return x.id === id; });
      if (!e) return;

      // Salvar como lead/estabelecimento no backend
      saveEstablishment(e).then(function () {
        openApproachModal(e);
      });
    },
    deleteEstablishment: function (id) {
      if (!confirm("Remover este estabelecimento?")) return;
      state.establishments = state.establishments.filter(function (x) { return x.id !== id; });
      renderEstablishments();
    },
    renderEstablishments: renderEstablishments,
    state: state
  };

  /* ---------- Modal de abordagem WhatsApp ---------- */
  function openApproachModal(e) {
    var demoLink = "https://" + (e.site || "seusite.com.br");

    var approaches = {
      direta: "Olá, tudo bem? Sou da Prospecta IA e criei um site profissional demonstrativo para o " + e.nicho + " " + P.esc(e.nome) + " em " + P.esc(e.cidade) + ". Confira aqui: " + demoLink + ". Quando puder, gostaria de conversar com você!",
      gradual: "Olá, tudo bem? Vi que você tem um " + P.esc(e.nicho) + " em " + P.esc(e.cidade) + " e queria saber se está aberto a melhorar sua presença online. Não é nada de venda agora, só queria trocar uma ideia.",
      normal: "Olá! Apresento a Prospecta IA, especialista em criar sites e aplicativos com IA para comércios locais como o seu, " + P.esc(e.nome) + ". Tenho um projeto demonstrativo pronto para você: " + demoLink + ". Interessado em saber mais?",
      personalizada: ""
    };

    var modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = '' +
      '<div class="modal__panel" style="max-width:640px">' +
      '<div class="modal__header">' +
      '<div><div class="modal__title">Escolha a abordagem</div><div style="font-size:12.5px;color:var(--text-muted);margin-top:4px">' + P.esc(e.nome) + " · " + P.esc(e.nicho) + " · " + P.esc(e.cidade) + '</div></div>' +
      '<button class="icon-btn" id="approach-close" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '</div>' +
      '<div class="modal__body" style="padding:26px">' +
      '<div class="field" style="margin-bottom:20px">' +
      '<label class="label">Mensagem</label>' +
      '<textarea class="textarea" id="approach-msg" rows="5" placeholder="Digite sua mensagem…">' + approaches.direta + '</textarea>' +
      '</div>' +
      '<div style="display:flex;gap:10px">' +
      Object.keys(approaches).map(function (key) {
        var labels = { direta: "Direta com demo", gradual: "Gradual", normal: "Normal", personalizada: "Personalizada" };
        return '<button type="button" class="btn btn--outline btn--sm" onclick="setApproach(\'' + key + '\')">' + labels[key] + '</button>';
      }).join("") +
      '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
      '<button class="btn btn--outline" id="approach-cancel">Cancelar</button>' +
      '<button class="btn btn--primary" id="approach-send">Abrir WhatsApp</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.classList.add("is-open");

    var textarea = document.getElementById("approach-msg");
    var btnSend = document.getElementById("approach-send");
    var btnClose = document.getElementById("approach-close");
    var btnCancel = document.getElementById("approach-cancel");

    window.setApproach = function (key) {
      textarea.value = approaches[key];
    };

    function closeModal() {
      modal.classList.remove("is-open");
      setTimeout(function () { document.body.removeChild(modal); }, 300);
      delete window.setApproach;
    }

    btnClose.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);

    btnSend.addEventListener("click", function () {
      var msg = textarea.value.trim();
      if (!msg) { P.toast("Mensagem vazia", "Escreva algo antes de abrir o WhatsApp."); return; }
      var phone = e.whatsapp || e.telefone || "";
      if (!phone) {
        P.toast("Sem telefone", "Este estabelecimento não tem telefone cadastrado.");
        return;
      }
      var waUrl = "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);
      window.open(waUrl, "_blank");
      P.toast("WhatsApp aberto", "Conversa iniciada com " + e.nome + ".");
      closeModal();
    });

    textarea.addEventListener("input", function () {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(200, textarea.scrollHeight) + "px";
    });
  }

  /* ---------- Persistência (backend) ---------- */
  async function saveProject() {
    var me = P.getUser();
    if (!me) return Promise.resolve();
    var payload = {
      tipo: state.project,
      nicho: state.niche,
      estado: state.state ? state.state.nome : null,
      cidade: state.city,
      prompt: els.promptBox.textContent
    };
    try {
      await P.api("/api/projects", { method: "POST", body: payload });
    } catch (e) {
      // API pode não existir ainda; não bloqueia o fluxo
      console.warn("saveProject API", e);
    }
  }

  async function saveEstablishment(e) {
    var me = P.getUser();
    if (!me) return Promise.resolve();
    try {
      await P.api("/api/establishments", { method: "POST", body: e });
    } catch (err) {
      console.warn("saveEstablishment API", err);
    }
  }

  /* ---------- Resumo atualizado ---------- */
  function updateSummary() {
    var projLabel = state.project === "site" ? "Site" : "Aplicativo";
    document.getElementById("summary-project").textContent = projLabel;
    document.getElementById("summary-niche").textContent = state.niche || "—";
    document.getElementById("summary-state").textContent = state.state ? state.state.nome + " (" + state.state.sigla + ")" : "—";
    document.getElementById("summary-city").textContent = state.city || "—";

    document.getElementById("summary-project-2").textContent = projLabel;
    document.getElementById("summary-niche-2").textContent = state.niche || "—";
    document.getElementById("summary-location-2").textContent = (state.city ? state.city + ", " : "") + (state.state ? state.state.nome + " (" + state.state.sigla + ")" : "—");

    document.getElementById("btn-step-2-next").disabled = !state.niche;
    document.getElementById("btn-step-3-next").disabled = !(state.state && state.city);
  }

  /* ---------- Inicialização ---------- */
  renderNichos("");
  renderPrompt();
  updateSummary();

  // Avança direto para próxima etapa ao selecionar nicho (já tratado no click)
})();
