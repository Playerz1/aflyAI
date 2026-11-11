/* =========================================================
   PROSPECTA IA — js/prospeccao.js
   Fluxo de prospecção: projeto → nicho → localização → prompt → estabelecimentos
   Busca via OpenStreetMap/Overpass/Nominatim (sem API paga)
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

  var NICHO_OSM_TAGS = {
    "Sorveteria": ["amenity=ice_cream"],
    "Pizzaria": ["amenity=pizza"],
    "Hamburgueria": ["amenity=fast_food"],
    "Restaurante": ["amenity=restaurant"],
    "Lanchonete": ["amenity=fast_food"],
    "Cafeteria": ["amenity=cafe"],
    "Padaria": ["amenity=bakery"],
    "Doceria": ["shop=confectionery"],
    "Açaíteria": ["amenity=ice_cream"],
    "Salão de beleza": ["amenity=hairdresser"],
    "Barbearia": ["amenity=hairdresser"],
    "Clínica odontológica": ["amenity=dentist"],
    "Clínica médica": ["amenity=clinic"],
    "Academia": ["amenity=gym"],
    "Personal trainer": ["amenity=gym"],
    "Pet shop": ["shop=pet"],
    "Clínica veterinária": ["amenity=veterinary"],
    "Loja de roupas": ["shop=clothes"],
    "Loja de calçados": ["shop=shoes"],
    "Loja de móveis": ["shop=furniture"],
    "Imobiliária": ["amenity=real_estate_agency"],
    "Oficina mecânica": ["amenity=car_repair"],
    "Lava-rápido": ["amenity=car_wash"],
    "Autoescola": ["amenity=driving_school"],
    "Hotel": ["tourism=hotel"],
    "Pousada": ["tourism=guest_house"],
    "Agência de viagens": ["amenity=travel_agency"],
    "Fotógrafo": ["amenity=photographer"],
    "Advogado": ["amenity=lawyer"],
    "Contabilidade": ["amenity=accountant"],
    "Eletricista": ["shop=electrician"],
    "Encanador": ["shop=plumber"],
    "Construtora": ["amenity=construction"],
    "Dedetizadora": ["amenity=pest_control"],
    "Floricultura": ["shop=florist"]
  };

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
    establishments: [],
    myBase: [],
    searchResults: []
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

    var lines = [];
    lines.push("Crie um " + projectLabel + " moderno e profissional para um estabelecimento do nicho " + nicheLabel + ", localizado em " + locationLabel + ".\n");
    lines.push("IDENTIDADE VISUAL:");
    lines.push("- Tema premium com fundo preto/azul escuro (#080B12, #0F1420)");
    lines.push("- Azul elétrico (#3985FF) e azul neon (#00D4FF) como cores de destaque");
    lines.push("- Efeitos glassmorphism (backdrop blur, transparências, bordas finas)");
    lines.push("- Gradientes sofisticados entre azul e preto");
    lines.push("- Tipografia moderna (Inter), ícones Lucide");
    lines.push("- Animações fluidas, transições suaves, efeitos hover\n");
    lines.push("ESTRUTURA DAS PÁGINAS:");
    lines.push("- Página inicial com hero section, call-to-action e confiança (trust bar)");
    lines.push("- Página de serviços/produtos do nicho " + nicheLabel);
    lines.push("- Página de contato com formulário e WhatsApp");
    lines.push("- Página sobre / quem somos");
    lines.push("- Rodapé com links e redes sociais\n");
    lines.push("SEÇÕES NECESSÁRIAS:");
    lines.push("- Hero com headline, descrição e botão de chamada");
    lines.push("- Depoimentos ou prova social");
    lines.push("- Dados de localização (cidade e estado) para SEO local");
    lines.push("- Botões de contato visíveis (WhatsApp, telefone, e-mail)");
    lines.push("- Formulário de orçamento/agendamento\n");
    lines.push("RESPONSIVIDADE:");
    lines.push("- Mobile-first, adaptação para tablet e desktop");
    lines.push("- Menu hambúrguer em telas pequenas");
    lines.push("- Cards reorganizados por breakpoint\n");
    lines.push("EXPERIÊNCIA MOBILE:");
    lines.push("- Carregamento rápido, imagens otimizadas");
    lines.push("- Botões com tamanho adequado para toque");
    lines.push("- Formulários fáceis de preencher no celular\n");
    lines.push("FUNCIONALIDADES ESPECÍFICAS DO SEGMENTO (" + nicheLabel + "):");
    lines.push("- Destaque para os principais serviços oferecidos");
    lines.push("- Informações de horário de funcionamento");
    lines.push("- Localização com mapa ou endereço completo");
    lines.push("- Integração com WhatsApp para atendimento direto\n");
    lines.push("TEXTOS COMERCIAIS:");
    lines.push("- Copy persuasiva focada em conversão local");
    lines.push("- Chamadas para ação claras (agendar, orçar, contatar)");
    lines.push("- Valorização da presença digital para negócios locais\n");
    lines.push("SEO LOCAL:");
    lines.push("- Meta tags com cidade e estado (" + locationLabel + ")");
    lines.push("- Dados estruturados (schema.org LocalBusiness)");
    lines.push("- Palavras-chave do nicho + cidade no conteúdo\n");
    lines.push("Tecnologias: HTML5, CSS3, JavaScript vanilla, design responsivo, sem frameworks pesados.");

    return lines.join("\n");
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
    saveProject().then(function () {
      nextStep();
      loadEstablishments();
    });
  });

  /* ---------- ETAPA 5: Estabelecimentos (OpenStreetMap/Overpass) ---------- */
  var OVERPASS_URL = "https://overpass-api.de/api/interpreter";
  var NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

  function showEstablishmentLoading() {
    els.establishmentsGrid.innerHTML = '<div style="text-align:center;padding:64px 24px;color:var(--text-muted)"><div class="skeleton" style="width:40px;height:40px;border-radius:50%;margin:0 auto 16px"></div><div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px">Buscando estabelecimentos...</div><div style="font-size:14px">Aguarde enquanto consultamos fontes públicas.</div></div>';
    els.establishmentsEmpty.classList.add("hidden");
  }

  async function geocodeCity(city, stateSigla) {
    var query = city + ", " + stateSigla + ", Brazil";
    var url = NOMINATIM_URL + "?q=" + encodeURIComponent(query) + "&format=json&limit=1&countrycodes=BR";
    try {
      var resp = await fetch(url, { headers: { "Accept-Language": "pt-BR,pt;q=0.9" } });
      var data = await resp.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
      }
    } catch (e) { console.warn("Nominatim error", e); }
    return null;
  }

  async function searchOverpass(lat, lon, tags, radius) {
    var tagFilter = tags.map(function (t) { return '["' + t.split('=')[0] + '"="' + t.split('=')[1] + '"]'; }).join("");
    var query = [] ;
    query.push('[out:json][timeout:25];');
    query.push('(');
    query.push('  node' + tagFilter + '["name"]["around:' + radius + ',' + lat + ',' + lon + '];');
    query.push('  way' + tagFilter + '["name"]["around:' + radius + ',' + lat + ',' + lon + '];');
    query.push('  relation' + tagFilter + '["name"]["around:' + radius + ',' + lat + ',' + lon + '];');
    query.push(');');
    query.push('out center tags limit 50;');

    try {
      var resp = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: query.join("\n")
      });
      var data = await resp.json();
      return data.elements || [];
    } catch (e) { console.warn("Overpass error", e); return []; }
  }

  function normalizeEstablishment(el, niche) {
    var tags = el.tags || {};
    var lat = el.lat || (el.center && el.center.lat);
    var lon = el.lon || (el.center && el.center.lon);
    var name = tags.name || "Estabelecimento";
    var address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:postcode"]].filter(Boolean).join(", ");
    var city = tags["addr:city"] || state.city || "";
    var stateName = tags["addr:state"] || (state.state ? state.state.nome : "") || "";
    var phone = tags.phone || tags["contact:phone"] || "";
    var website = tags.website || tags["contact:website"] || "";
    var category = tags.amenity || tags.shop || tags.tourism || niche;
    return {
      id: "osm_" + (el.type || "") + "_" + el.id,
      nome: name,
      nicho: niche,
      cidade: city,
      estado: stateName,
      endereco: address || "Endereço não disponível",
      telefone: phone || "",
      site: website || "",
      lat: lat || null,
      lon: lon || null,
      categoria: category,
      fonte: "OpenStreetMap (Overpass API)",
      mapa: lat && lon ? "https://www.openstreetmap.org/#map=16/" + lat + "/" + lon : "",
      avaliacao: null,
      criado: new Date().toISOString()
    };
  }

  async function loadEstablishments() {
    if (!state.state || !state.city || !state.niche) {
      els.establishmentsGrid.innerHTML = "";
      els.establishmentsEmpty.classList.remove("hidden");
      return;
    }

    showEstablishmentLoading();

    try {
      var geo = await geocodeCity(state.city, state.state.sigla);
      if (!geo) {
        throw new Error("Não foi possível localizar a cidade no OpenStreetMap.");
      }

      var tags = NICHO_OSM_TAGS[state.niche] || ["amenity=" + state.niche.toLowerCase()];
      var raw = await searchOverpass(geo.lat, geo.lon, tags, 10000);

      var results = raw.map(function (el) { return normalizeEstablishment(el, state.niche); });

      // Remove duplicates by name
      var seen = new Set();
      var unique = results.filter(function (e) {
        var key = e.nome.toLowerCase() + "|" + e.cidade.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      state.searchResults = unique;
      renderEstablishments();
    } catch (err) {
      console.error("Establishment search error", err);
      els.establishmentsGrid.innerHTML = '';
      els.establishmentsEmpty.classList.remove("hidden");
      els.establishmentsEmpty.querySelector(".empty-results__title").textContent = "Erro na busca";
      els.establishmentsEmpty.querySelector(".empty-results__text").textContent = (err && err.message) || "Não foi possível buscar estabelecimentos. Tente novamente.";
    }
  }

  function renderEstablishments() {
    var filter = (els.establishmentsSearch.value || "").toLowerCase();
    var list = state.searchResults.filter(function (e) {
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
      var hasWhats = Boolean(e.telefone);
      var isSaved = state.myBase.some(function (b) { return b.id === e.id; });
      var html = [];
      html.push('<div class="establishment-card" data-id="' + e.id + '">');
      html.push('<div class="establishment-card__header">');
      html.push('<div class="establishment-card__name">' + P.esc(e.nome) + '</div>');
      html.push('<div class="establishment-card__rating">');
      html.push('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.14 14.13l1.18-6.88L9.91 9.27l3.09-6.26L12 2z"/><path d="M12 15V7"/><path d="M7 12h10"/></svg>');
      html.push('<span style="margin-left:4px">' + P.esc(e.categoria) + '</span>');
      html.push('</div>');
      html.push('</div>');
      html.push('<div class="establishment-card__meta">');
      html.push('<span>📍 ' + P.esc(e.cidade) + ', ' + P.esc(e.estado) + '</span>');
      html.push('</div>');
      html.push('<div class="establishment-card__meta">');
      html.push('<span>🏷️ ' + P.esc(e.nicho) + '</span>');
      html.push('</div>');
      if (e.endereco && e.endereco !== "Endereço não disponível") {
        html.push('<div class="establishment-card__meta"><span>🏠 ' + P.esc(e.endereco) + '</span></div>');
      }
      if (e.telefone) {
        html.push('<div class="establishment-card__meta"><span>📞 ' + P.esc(e.telefone) + '</span></div>');
      }
      if (e.site) {
        html.push('<div class="establishment-card__meta"><span>🌐 ' + P.esc(e.site) + '</span></div>');
      }
      html.push('<div class="establishment-card__actions">');
      html.push('<button class="btn--text" onclick="ProspectaProspeccao.selectEstablishment(\'' + e.id + '\')">');
      html.push(hasWhats ? 'Abrir WhatsApp' : 'Selecionar');
      html.push('</button>');
      html.push('<button class="btn--text ' + (isSaved ? "saved" : "") + '" onclick="event.stopPropagation();ProspectaProspeccao.toggleSave(\'' + e.id + '\')">');
      html.push(isSaved ? 'Remover da Base' : 'Salvar na Base');
      html.push('</button>');
      html.push('</div>');
      html.push('</div>');
      return html.join("");
    }).join("");

    els.establishmentsGrid.querySelectorAll(".establishment-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.tagName === "BUTTON") return;
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
    state = { step: 1, project: "site", niche: null, state: null, city: null, establishments: state.establishments, myBase: state.myBase, searchResults: [] };
    showStep(1);
    renderNichos("");
    renderStates();
    updateSummary();
  });

  /* ---------- Seleção de estabelecimento → WhatsApp ---------- */
  window.ProspectaProspeccao = {
    selectEstablishment: function (id) {
      var e = state.searchResults.find(function (x) { return x.id === id; }) || state.myBase.find(function (x) { return x.id === id; });
      if (!e) return;
      saveEstablishment(e).then(function () {
        openApproachModal(e);
      });
    },
    toggleSave: function (id) {
      var idx = state.myBase.findIndex(function (b) { return b.id === id; });
      if (idx >= 0) {
        state.myBase.splice(idx, 1);
        P.toast("Removido", "Estabelecimento removido da sua base.");
      } else {
        var e = state.searchResults.find(function (x) { return x.id === id; });
        if (e) {
          state.myBase.push(e);
          P.toast("Salvo", "Estabelecimento adicionado à sua base.");
        }
      }
      renderEstablishments();
    },
    renderEstablishments: renderEstablishments,
    state: state,
    loadMyBase: loadMyBase,
    exportMyBaseCSV: exportMyBaseCSV
  };

  /* ---------- Modal de abordagem WhatsApp ---------- */
  function openApproachModal(e) {
    var demoLink = "https://" + (e.site || "seusite.com.br");

    var approaches = {};
    approaches.direta = "Olá, tudo bem? Sou da Prospecta IA e criei um site profissional demonstrativo para o " + e.nicho + " " + P.esc(e.nome) + " em " + P.esc(e.cidade) + ". Confira aqui: " + demoLink + ". Quando puder, gostaria de conversar com você!";
    approaches.gradual = "Olá, tudo bem? Vi que você tem um " + P.esc(e.nicho) + " em " + P.esc(e.cidade) + " e queria saber se está aberto a melhorar sua presença online. Não é nada de venda agora, só queria trocar uma ideia.";
    approaches.normal = "Olá! Apresento a Prospecta IA, especialista em criar sites e aplicativos com IA para comércios locais como o seu, " + P.esc(e.nome) + ". Tenho um projeto demonstrativo pronto para você: " + demoLink + ". Interessado em saber mais?";
    approaches.personalizada = "";

    var modal = document.createElement("div");
    modal.className = "modal";
    var modalHtml = [];
    modalHtml.push('<div class="modal__panel" style="max-width:640px">');
    modalHtml.push('<div class="modal__header">');
    modalHtml.push('<div><div class="modal__title">Escolha a abordagem</div><div style="font-size:12.5px;color:var(--text-muted);margin-top:4px">' + P.esc(e.nome) + " · " + P.esc(e.nicho) + " · " + P.esc(e.cidade) + '</div></div>');
    modalHtml.push('<button class="icon-btn" id="approach-close" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>');
    modalHtml.push('</div>');
    modalHtml.push('<div class="modal__body" style="padding:26px">');
    modalHtml.push('<div class="field" style="margin-bottom:20px">');
    modalHtml.push('<label class="label">Mensagem</label>');
    modalHtml.push('<textarea class="textarea" id="approach-msg" rows="5" placeholder="Digite sua mensagem…">' + approaches.direta + '</textarea>');
    modalHtml.push('</div>');
    modalHtml.push('<div style="display:flex;gap:10px">');
    Object.keys(approaches).forEach(function (key) {
      var labels = { direta: "Direta com demo", gradual: "Gradual", normal: "Normal", personalizada: "Personalizada" };
      modalHtml.push('<button type="button" class="btn btn--outline btn--sm" onclick="setApproach(\'' + key + '\')">' + labels[key] + '</button>');
    });
    modalHtml.push('</div>');
    modalHtml.push('</div>');
    modalHtml.push('<div class="modal__footer">');
    modalHtml.push('<button class="btn btn--outline" id="approach-cancel">Cancelar</button>');
    modalHtml.push('<button class="btn btn--primary" id="approach-send">Abrir WhatsApp</button>');
    modalHtml.push('</div>');
    modalHtml.push('</div>');
    modal.innerHTML = modalHtml.join("");

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
      var phone = (e.telefone || e.whatsapp || "").replace(/\D/g, "");
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

  /* ---------- Minha Base ---------- */
  async function loadMyBase() {
    try {
      var me = P.getUser();
      if (!me) return;
      var res = await P.api("/api/establishments");
      state.myBase = res && res.establishments ? res.establishments : [];
    } catch (e) {
      console.warn("loadMyBase API", e);
      state.myBase = [];
    }
  }

  async function saveEstablishment(e) {
    var me = P.getUser();
    if (!me) return Promise.resolve();
    try {
      await P.api("/api/establishments", { method: "POST", body: e });
    } catch (err) {
      // May already exist; ignore
    }
  }

  function exportMyBaseCSV() {
    if (!state.myBase.length) {
      P.toast("Base vazia", "Não há estabelecimentos salvos para exportar.");
      return;
    }
    var headers = ["Nome", "Nicho", "Cidade", "Estado", "Endereço", "Telefone", "Site", "Categoria", "Fonte"];
    var rows = state.myBase.map(function (e) {
      return [
        e.nome || "",
        e.nicho || "",
        e.cidade || "",
        e.estado || "",
        e.endereco || "",
        e.telefone || "",
        e.site || "",
        e.categoria || "",
        e.fonte || ""
      ].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    });
    var csv = [headers.join(","), rows.join("\n")].join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "minha_base_estabelecimentos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    P.toast("CSV exportado", "Sua base foi exportada para CSV.");
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
      console.warn("saveProject API", e);
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

  // Minha Base e export CSV buttons
  document.getElementById("btn-view-mybase").addEventListener("click", function () {
    loadMyBase().then(function () {
      state.searchResults = state.myBase.slice();
      renderEstablishments();
      if (state.myBase.length === 0) {
        P.toast("Minha Base", "Você ainda não tem estabelecimentos salvos.");
      } else {
        P.toast("Minha Base", state.myBase.length + " estabelecimento(s) salvo(s).");
      }
    });
  });

  document.getElementById("btn-export-csv").addEventListener("click", function () {
    exportMyBaseCSV();
  });

})();
