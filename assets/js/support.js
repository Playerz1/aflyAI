/* =========================================================
   PROSPECTA · support.js — Central de ajuda (tickets)
   - Produção: persiste via /api/tickets (Neon) quando API ativa
   - Fallback localStorage APENAS para dev offline
   - Mantém API pública usada pelo app (abrir/fechar/carregar/buscar/etc.)
   ========================================================= */

window.Suporte = (function () {
  "use strict";

  var KEY = "prospecta:tickets";
  var SEQ = "prospecta:ticket-seq";

  var MOTIVOS = {
    duvida: { rotulo: "Dúvida de uso", auto: "Perfeito! Já recebi sua dúvida. Um especialista da Prospecta vai olhar aqui e te responder por este chat em instantes." },
    site: { rotulo: "Problema em um site", auto: "Entendi, você está com problema em um site. Pode me dizer qual site e o que acontece (link, erro ou tela)?" },
    contrato: { rotulo: "Contrato e cobrança", auto: "Recebi sua solicitação sobre contrato/cobrança. Nossa equipe financeira responde por aqui em até 2h." },
    lead: { rotulo: "Leads ou extensão", auto: "Certo! Para leads e extensão, me confirma se o problema é na captura, na importação ou na qualificação." },
    acesso: { rotulo: "Acesso e login", auto: "Vamos resolver o acesso! Você já tentou redefinir a senha em Configuração → Conta?" },
    outro: { rotulo: "Outro assunto", auto: "Obrigado pelo contato! Já recebi sua mensagem e vou te responder por este chat." }
  };

  var state = { ticketId: null, typing: false, cache: [], pollTimer: null };
  var POLL_MS = 5000; // atualização ao vivo do chat a cada 5s

  /* ---------------- polling (tempo ao vivo) ---------------- */
  function pararPolling() {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  }
  function iniciarPolling() {
    pararPolling();
    if (!apiAtiva() || !state.ticketId) return;
    state.pollTimer = setInterval(async function () {
      if (!state.ticketId || !painel() || !painel().classList.contains("is-open")) return;
      if (D() && D().carregarTicket) {
        try { var t = await D().carregarTicket(state.ticketId); if (t) renderMensagens(); } catch (e) {}
      }
    }, POLL_MS);
  }
  window.addEventListener("beforeunload", pararPolling);

  function D() { return window.Dados; }
  function apiAtiva() { return D() && D().modo && D().modo() === 'api'; }
  function getEU() {
    var me = D() && D().eu ? D().eu() : null;
    return me || { nome: '', iniciais: '', plano: '', email: '' };
  }

  /* ---------------- storage/cache ---------------- */
  function carregar() {
    if (D() && D().tickets) { state.cache = D().tickets(); return state.cache; }
    try { var raw = localStorage.getItem(KEY); var list = raw ? JSON.parse(raw) : null; return Array.isArray(list) ? list : []; } catch (e) { return []; }
  }

  function salvar(list) { // legado/fallback
    state.cache = Array.isArray(list) ? list : state.cache;
    try { localStorage.setItem(KEY, JSON.stringify(state.cache)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("prospecta:tickets"));
  }

  function proximoId() {
    if (D() && D().proximoId) return D().proximoId();
    var n; try { n = parseInt(localStorage.getItem(SEQ) || "4021", 10); } catch (e) { n = 4021; }
    n += 1; try { localStorage.setItem(SEQ, String(n)); } catch (e) {} return n;
  }

  function buscar(id) { return carregar().filter(function (t) { return Number(t.id) === Number(id); })[0]; }

  function atualizar(id, fn) {
    var list = carregar();
    var t = list.filter(function (x) { return Number(x.id) === Number(id); })[0];
    if (!t) return null;
    fn(t);
    if (apiAtiva() && D() && D().atualizarTicket) {
      // best-effort async sync (status/messages may be handled by dedicated endpoints)
      D().atualizarTicket(id, { status: t.status, prioridade: t.prioridade, motivo: t.motivo, motivoRotulo: t.motivoRotulo }).catch(function(){});
    } else if (D() && D().salvarTickets) { D().salvarTickets(list); }
    else { salvar(list); }
    return t;
  }

  /* ---------------- utilidades ---------------- */
  function esc(str) { return String(str || "").replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }
  function hora(iso) { var d = new Date(iso); if (isNaN(d)) return ""; return d.toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }); }
  function haQuanto(iso) { var diff = Math.max(0, Date.now() - new Date(iso).getTime()); var min = Math.round(diff/60000); if (min<1) return "agora"; if (min<60) return "há "+min+" min"; var h=Math.round(min/60); if (h<24) return "há "+h+"h"; var dd=Math.round(h/24); return dd===1?"ontem":"há "+dd+" dias"; }
  function ultimaMensagem(t) { if (!t.mensagens || !t.mensagens.length) return null; return t.mensagens[t.mensagens.length - 1]; }
  function naoLidas(t) { return (t.mensagens || []).filter(function (m) { return m.autor !== "cliente" && !m.lida; }).length; }

  /* ---------------- painel ---------------- */
  function painel() { return document.querySelector("[data-support]"); }
  function ehAdmin() { return document.body.getAttribute("data-role") === "admin" || !!(window.AdminAPI && window.AdminAPI.ehAdmin && window.AdminAPI.ehAdmin()); }

  function renderAberto() {
    var p = painel();
    if (!p) return;
    p.innerHTML =
      '<div class="support__head">' +
      '<span class="kpi__icon kpi__icon--primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path d="M9 10h6M9 14h4"/></svg></span>' +
      '<div><h3>Central de ajuda</h3><p>Abra um atendimento e converse por aqui</p></div>' +
      '<button class="icon-btn" data-support-close aria-label="Fechar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      "</button>" +
      "</div>" +
      '<div class="support__body" data-support-view></div>' +
      '<div class="support__foot" data-support-foot></div>';
    p.querySelector("[data-support-close]").addEventListener("click", fechar);
    irParaLista();
  }

  function irParaLista() {
    pararPolling();
    var p = painel(); if (!p) return;
    var view = p.querySelector("[data-support-view]"); var foot = p.querySelector("[data-support-foot]");
    if (!view || !foot) return;
    var meus = carregar().sort(function (a, b) { return new Date(b.atualizado || b.criado || 0) - new Date(a.atualizado || a.criado || 0); });
    var html = "";
    if (ehAdmin()) html += '<div class="support__admin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/></svg>Você é admin: todos os tickets ficam em Tickets.</div>';
    html += '<a class="btn btn--primary btn--block" href="#" data-support-new style="margin-bottom:14px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Abrir atendimento</a>';
    html += '<div class="panel__title" style="margin:0 0 8px">Meus atendimentos</div>';
    if (!meus.length) {
      html += '<div class="empty" style="padding:26px 10px"><div class="empty__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="empty__title">Nenhum atendimento aberto</div><div class="empty__text">Clique em “Abrir atendimento”, descreva sua dúvida e escolha o motivo.</div></div>';
    } else {
      meus.forEach(function (t) {
        var ul = ultimaMensagem(t); var nl = naoLidas(t);
        var statusLabel = t.status === "resolvido" ? "Resolvido" : t.status === "respondido" ? "Respondido" : "Aberto";
        var statusClass = t.status === "resolvido" ? "st--resolvido" : t.status === "respondido" ? "st--respondido" : "st--aberto";
        html += '<button class="ticket-row" data-support-open="' + t.id + '"><span class="kpi__icon kpi__icon--primary" style="width:34px;height:34px;border-radius:10px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></span><span class="ticket-row__body"><span class="ticket-row__title">#' + t.id + " · " + esc(t.motivoRotulo || (MOTIVOS[t.motivo] ? MOTIVOS[t.motivo].rotulo : '') || t.motivo || '') + '</span><span class="ticket-row__meta">' + haQuanto(t.atualizado) + (nl ? " · " + nl + " nova" + (nl > 1 ? "s" : "") : "") + '</span><span class="ticket-row__preview">' + (ul ? ((ul.autor === "cliente" ? "Você: " : "Suporte: ") + esc(ul.texto)) : "") + '</span></span><span class="st ' + statusClass + '">' + statusLabel + "</span></button>";
      });
    }
    view.innerHTML = html;
    foot.innerHTML = '<div class="t-12 muted" style="text-align:center">Resposta média em 2h · Seg a Sáb, 8h às 20h</div>';
    view.querySelectorAll("[data-support-new]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); irParaFormulario(); }); });
    view.querySelectorAll("[data-support-open]").forEach(function (b) { b.addEventListener("click", function () { irParaChat(Number(b.getAttribute("data-support-open"))); }); });
  }

  function irParaFormulario() {
    var p = painel(); var view = p.querySelector("[data-support-view]"); var foot = p.querySelector("[data-support-foot]");
    var motivos = Object.keys(MOTIVOS).map(function (k, i) {
      return '<label class="motivo"><input type="radio" name="motivo" value="' + k + '"' + (i === 0 ? " checked" : "") + '><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span>' + esc(MOTIVOS[k].rotulo) + "</label>";
    }).join("");
    view.innerHTML = '<form class="support-form" data-support-form><div class="field"><label class="label" for="sp-assunto">Dúvida ou pergunta</label><input class="input" id="sp-assunto" maxlength="90" required placeholder="Ex.: Como troco o domínio do meu site?"></div><div class="field"><label class="label" for="sp-desc">Descreva com detalhes <span class="label__hint">(opcional)</span></label><textarea class="textarea" id="sp-desc" placeholder="Conte o que aconteceu, em qual página e desde quando…"></textarea></div><div class="field"><span class="label">Motivo do contato</span><div class="motivo-grid" data-motivo-grid>' + motivos + '</div></div><div class="field"><label class="label" for="sp-prio">Prioridade</label><select class="select" id="sp-prio"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta — estou travado</option></select></div></form>';
    view.querySelectorAll('input[name="motivo"]').forEach(function (r) { r.addEventListener("change", function () { view.querySelectorAll(".motivo").forEach(function (m) { m.classList.toggle("is-checked", !!m.querySelector("input:checked")); }); }); });
    foot.innerHTML = '<div class="row" style="gap:8px"><button type="button" class="btn btn--outline" data-support-back style="flex:1">Voltar</button><button type="button" class="btn btn--primary" data-support-create style="flex:2">Criar ticket</button></div>';
    foot.querySelector("[data-support-back]").addEventListener("click", irParaLista);
    foot.querySelector("[data-support-create]").addEventListener("click", function () {
      var form = view.querySelector("[data-support-form]"); if (!form.reportValidity()) return;
      criarTicket({ assunto: form.querySelector("#sp-assunto").value.trim(), descricao: form.querySelector("#sp-desc").value.trim(), motivo: form.querySelector("input[name=motivo]:checked").value, prioridade: form.querySelector("#sp-prio").value });
    });
    setTimeout(function () { var i = view.querySelector("#sp-assunto"); if (i) i.focus(); }, 120);
  }

  async function criarTicket(dados) {
    var agora = new Date(); var m = MOTIVOS[dados.motivo] || MOTIVOS.outro;
    var texto = dados.assunto + (dados.descricao ? "\n\n" + dados.descricao : "");
    if (apiAtiva() && D() && D().criarTicket) {
      try {
        var ticket = await D().criarTicket({ assunto: dados.assunto, descricao: dados.descricao || '', motivo: dados.motivo, motivoRotulo: m.rotulo, prioridade: dados.prioridade, origem: (document.querySelector(".topbar__title") || {}).textContent || "Dashboard", cliente: { nome: getEU().nome, iniciais: getEU().iniciais, email: getEU().email, plano: getEU().plano } });
        if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Ticket #" + ticket.id + " criado!", "Nosso time responde por aqui mesmo.");
        irParaChat(ticket.id);
        // Sem auto-resposta em produção (admin responde). Mantém UX limpa.
        return ticket;
      } catch (e) {
        if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Erro ao criar ticket", (e && e.message) || "Tente novamente.");
        return null;
      }
    }
    // fallback local dev
    var id = proximoId();
    var ticket = { id: id, assunto: dados.assunto, motivo: dados.motivo, motivoRotulo: m.rotulo, prioridade: dados.prioridade, status: "aberto", cliente: { nome: getEU().nome, iniciais: getEU().iniciais, email: getEU().email, plano: getEU().plano }, origem: (document.querySelector(".topbar__title") || {}).textContent || "Dashboard", criado: agora.toISOString(), atualizado: agora.toISOString(), mensagens: [{ id: 1, autor: "cliente", texto: texto, em: agora.toISOString(), lida: true }] };
    var list = carregar(); list.unshift(ticket); salvar(list);
    if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Ticket #" + id + " criado!", "Nosso time responde por aqui mesmo.");
    irParaChat(id);
    setTimeout(function () { state.typing = true; renderMensagens(); setTimeout(function () { var t = atualizar(id, function (t) { var ultimo = t.mensagens[t.mensagens.length - 1]; if (ultimo && ultimo.autor !== "cliente") return; t.mensagens.push({ id: Date.now(), autor: "suporte", texto: m.auto, em: new Date().toISOString(), lida: false }); t.status = "respondido"; t.atualizado = new Date().toISOString(); }); state.typing = false; if (t) renderMensagens(); }, 1200); }, 900);
  }

  async function irParaChat(id) {
    state.ticketId = id;
    iniciarPolling();
    var p = painel(); var view = p.querySelector("[data-support-view]"); var foot = p.querySelector("[data-support-foot]");
    if (apiAtiva() && D() && D().carregarTicket) { try { await D().carregarTicket(id); } catch(e){} }
    var t = buscar(id); if (!t) { irParaLista(); return; }
    if (!apiAtiva()) atualizar(id, function (t) { t.mensagens.forEach(function (m) { if (m.autor !== "cliente") m.lida = true; }); });
    var statusClass = t.status === "resolvido" ? "st--resolvido" : t.status === "respondido" ? "st--respondido" : "st--aberto";
    view.innerHTML = '<div class="row" style="margin-bottom:10px;gap:8px"><button class="btn btn--ghost btn--sm" data-support-back style="padding:0 8px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>Voltar</button><span class="t-13 bold truncate">#' + t.id + " · " + esc(t.assunto) + '</span><span class="st ' + statusClass + '" style="margin-left:auto" data-support-status>' + (t.status === "resolvido" ? "Resolvido" : t.status === "respondido" ? "Respondido" : "Aberto") + '</span></div><div class="chat" data-chat></div>';
    foot.innerHTML = '<div class="composer"><textarea class="textarea" rows="1" placeholder="Escreva uma mensagem…" data-chat-input maxlength="1000" aria-label="Mensagem"></textarea><button class="composer__send" data-chat-send aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></button></div>';
    var input = foot.querySelector("[data-chat-input]"); var send = foot.querySelector("[data-chat-send]");
    view.querySelector("[data-support-back]").addEventListener("click", irParaLista);
    async function enviar() {
      var txt = input.value.trim(); if (!txt) return;
      if (apiAtiva() && D() && D().enviarMensagem) {
        try { await D().enviarMensagem(id, txt); input.value = ""; input.style.height = "44px"; renderMensagens(); if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Mensagem enviada", "O time responde por aqui."); return; } catch(e){ if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Erro", (e&&e.message)||"Falha ao enviar"); return; }
      }
      atualizar(id, function (t) { t.mensagens.push({ id: Date.now(), autor: "cliente", texto: txt, em: new Date().toISOString(), lida: true }); t.atualizado = new Date().toISOString(); if (t.status !== "aberto") t.status = "aberto"; });
      input.value = ""; input.style.height = "44px"; renderMensagens(); if (window.Prospecta && window.Prospecta.toast) window.Prospecta.toast("Mensagem enviada", "O time responde por aqui.");
    }
    send.addEventListener("click", enviar);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } });
    input.addEventListener("input", function () { input.style.height = "44px"; input.style.height = Math.min(120, input.scrollHeight) + "px"; });
    renderMensagens(); setTimeout(function () { input.focus(); }, 150);
  }

  function renderMensagens() {
    var p = painel(); if (!p || !p.classList.contains("is-open")) return;
    var chat = p.querySelector("[data-chat]"); var t = buscar(state.ticketId); if (!chat || !t) return;
    var html = '<div class="chat__day">Atendimento iniciado em ' + hora(t.criado) + "</div>";
    html += '<div class="msg msg--system">Ticket <b>#' + t.id + "</b> criado · motivo: <b>" + esc(t.motivoRotulo || (MOTIVOS[t.motivo] ? MOTIVOS[t.motivo].rotulo : '') || t.motivo || '') + "</b></div>";
    (t.mensagens || []).forEach(function (m) {
      var cls = m.autor === "cliente" ? "msg--out" : "msg--in";
      var quem = m.autor === "cliente" ? "Você" : (m.autor === "admin" ? "Admin" : "Suporte Prospecta");
      html += '<div class="msg ' + cls + '">' + esc(m.texto) + '<span class="msg__meta">' + quem + " · " + hora(m.em) + "</span></div>";
    });
    if (state.typing) html += '<div class="msg msg--in typing"><i></i><i></i><i></i></div>';
    chat.innerHTML = html; chat.parentElement.scrollTop = chat.parentElement.scrollHeight;
  }

  function fechar() { pararPolling(); var p = painel(); if (p) p.classList.remove("is-open"); }
  function abrir(ticketId) { var p = painel(); if (!p) return; p.classList.add("is-open"); if (ticketId) irParaChat(ticketId); else irParaLista(); }
  function aoAbrir() { if (state.ticketId) renderMensagens(); else irParaLista(); }

  document.addEventListener("DOMContentLoaded", function () {
    var p = painel(); if (!p) return; renderAberto();
    if (D() && D().pronto) D().pronto().then(function(){ if (p.classList.contains('is-open')) aoAbrir(); });
  });
  window.addEventListener("storage", function (e) { if (e.key === KEY && state.ticketId) renderMensagens(); });
  document.addEventListener("prospecta:mudou", function () { var p = painel(); if (p && p.classList.contains("is-open")) { if (state.ticketId) renderMensagens(); else irParaLista(); } });

  return { abrir: abrir, fechar: fechar, aoAbrir: aoAbrir, carregar: carregar, salvar: salvar, buscar: buscar, atualizar: atualizar, MOTIVOS: MOTIVOS, esc: esc, hora: hora, haQuanto: haQuanto, ultimaMensagem: ultimaMensagem, naoLidas: naoLidas, proximoId: proximoId, abrirChat: irParaChat };
})();
