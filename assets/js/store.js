/* =========================================================
   PROSPECTA · store.js — Adapter de dados (API + cache)
   - Produção: Neon PostgreSQL via /api/* (Vercel Functions)
   - Cache em memória para compatibilidade com páginas síncronas
   - Fallback localStorage APENAS se /api/* indisponível (dev offline)
   - Nunca usa SQLite/JSON como banco de produção
   ========================================================= */

window.Dados = (function () {
  "use strict";

  var K_TICKETS = "prospecta:tickets";
  var K_USERS = "prospecta:usuarios";
  var K_SEQ = "prospecta:ticket-seq";
  var K_SESSION = "prospecta:admin"; // legacy, mantido só para migração/fallback
  var K_MODE = "prospecta:data-mode";

  var state = {
    users: [],
    tickets: [],
    leads: [],
    contracts: [],
    payments: [],
    sites: [],
    activities: [],
    me: null,
    ready: false,
    mode: "unknown", // 'api' | 'local'
  };
  var readyPromise = null;
  var readyResolve = null;

  function emit(key) {
    try { window.dispatchEvent(new CustomEvent("prospecta:mudou", { detail: { key: key || "refresh" } })); } catch (e) {}
  }

  function esc(texto) {
    return String(texto || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hora(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function haQuanto(iso) {
    if (!iso) return "—";
    var min = Math.round(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return "há " + min + " min";
    var h = Math.round(min / 60);
    if (h < 24) return "há " + h + "h";
    var d = Math.round(h / 24);
    return d === 1 ? "ontem" : "há " + d + " dias";
  }

  function ultimaMensagem(t) { return t.mensagens && t.mensagens.length ? t.mensagens[t.mensagens.length - 1] : null; }
  function naoLidas(t) { return (t.mensagens || []).filter(function (m) { return m.autor === "cliente" && !m.lida; }).length; }

  // ---- API helper ----
  async function api(path, opts) {
    opts = opts || {};
    var res = await fetch(path, {
      method: opts.method || 'GET',
      credentials: 'include',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      var err = new Error((data && data.error) || ('Erro ' + res.status));
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }

  function useLocal() {
    try { return localStorage.getItem(K_MODE) === 'local'; } catch (e) { return false; }
  }
  function setMode(m) {
    state.mode = m;
    try { localStorage.setItem(K_MODE, m); } catch (e) {}
  }

  // ---- Local fallback (dev offline only) ----
  function lerLocal(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function gravarLocal(key, valor) {
    try { localStorage.setItem(key, JSON.stringify(valor)); } catch (e) {}
    emit(key);
  }
  var USUARIOS_SEED = [];
  function localUsuarios() { var l = lerLocal(K_USERS, null); if (!Array.isArray(l)||!l.length){ gravarLocal(K_USERS, USUARIOS_SEED); return USUARIOS_SEED.slice(); } return l; }
  function localTickets() { var l = lerLocal(K_TICKETS, null); return Array.isArray(l) ? l : []; }

  function mapUser(u) {
    if (!u) return null;
    var papel = u.role === 'admin' ? 'admin' : (u.role === 'client' ? 'cliente' : 'membro');
    var status = u.status === 'active' ? 'ativo' : (u.status === 'blocked' ? 'bloqueado' : 'convite');
    return { id: u.seq || u.id, _id: u.id, nome: u.name, iniciais: u.initials, email: u.email, plano: u.plan || 'Pro', cargo: u.jobTitle || '', status: status, papel: papel, tickets: u._count ? (u._count.ticketsCreated||0) : (u.tickets||0), criado: u.createdAt, ultimo: u.lastLoginAt, note: u.note || '' };
  }
  function toApiUser(u) {
    return { name: u.nome, email: u.email, plan: u.plano, role: u.papel === 'admin' ? 'admin' : (u.papel === 'cliente' ? 'client' : 'member'), status: u.status === 'ativo' ? 'active' : (u.status === 'bloqueado' ? 'blocked' : 'invite'), jobTitle: u.cargo || '' };
  }

  // ---- Hydration ----
  async function sessao() {
    try {
      var r = await api('/api/auth/me');
      state.me = r && r.user ? mapUser(r.user) : null;
      setMode('api');
      return state.me;
    } catch (e) {
      if (e && (e.status === 401 || e.status === 403)) { state.me = null; setMode('api'); return null; }
      // API unavailable -> dev fallback
      setMode('local');
      try { state.me = localStorage.getItem(K_SESSION) === 'sim' ? { papel: 'admin', nome: 'Admin (local)' } : null; } catch (e2) { state.me = null; }
      return state.me;
    }
  }

  async function refresh() {
    await sessao();
    if (state.mode === 'api' && state.me) {
      try {
        var tasks = [];
        if (state.me.papel === 'admin') tasks.push(api('/api/users').then(function(r){ state.users = (r.users||[]).map(mapUser); }));
        tasks.push(api('/api/tickets').then(function(r){ state.tickets = r.tickets || []; }));
        tasks.push(api('/api/leads').then(function(r){ state.leads = r.leads || []; }));
        tasks.push(api('/api/contracts').then(function(r){ state.contracts = r.contracts || []; }));
        tasks.push(api('/api/payments').then(function(r){ state.payments = r.payments || []; }));
        tasks.push(api('/api/sites').then(function(r){ state.sites = r.sites || []; }));
        tasks.push(api('/api/activities?limit=30').then(function(r){ state.activities = r.activities || []; }));
        await Promise.all(tasks);
      } catch (e) { console.warn('[Dados] refresh api falhou', e); }
    } else if (state.mode === 'local') {
      state.users = localUsuarios();
      state.tickets = localTickets();
      state.leads = [];
      state.contracts = [];
      state.payments = [];
      state.sites = [];
      state.activities = [];
    }
    state.ready = true;
    if (readyResolve) { readyResolve(state); readyResolve = null; }
    emit('refresh');
    return state;
  }

  function pronto() {
    if (state.ready) return Promise.resolve(state);
    if (!readyPromise) readyPromise = new Promise(function(res){ readyResolve = res; refresh().catch(function(){ state.ready=true; res(state); }); });
    return readyPromise;
  }

  // ---- Sync getters (cache) ----
  function usuarios() { return state.users.slice(); }
  function tickets() { return state.tickets.slice(); }
  function leads() { return state.leads.slice(); }
  function contratos() { return state.contracts.slice(); }
  function pagamentos() { return state.payments.slice(); }
  function sites() { return state.sites.slice(); }
  function atividades() { return state.activities.slice(); }
  function ehAdmin() { return !!(state.me && state.me.papel === 'admin'); }
  function eu() { return state.me; }

  // ---- Mutations (async, update cache + emit) ----
  async function salvarUsuarios(list) {
    // legacy bulk-save path: best-effort sync known items via API (admin pages still call this)
    state.users = Array.isArray(list) ? list.slice() : state.users;
    if (state.mode === 'api' && ehAdmin()) {
      // no bulk endpoint; callers should prefer criarUsuario/atualizarUsuario. Keep cache consistent.
    } else if (state.mode === 'local') { gravarLocal(K_USERS, state.users); }
    emit('users');
  }

  async function criarUsuario(u) {
    if (state.mode === 'api') {
      var r = await api('/api/users', { method: 'POST', body: toApiUser(u) });
      var mapped = mapUser(r.user); state.users.unshift(mapped); emit('users'); return mapped;
    }
    u.id = u.id || Date.now(); u._id = 'local-' + u.id; state.users.unshift(u); gravarLocal(K_USERS, state.users); return u;
  }

  async function atualizarUsuario(id, patch) {
    var cur = state.users.filter(function(x){ return x.id === id || x._id === id; })[0];
    if (!cur) return null;
    if (state.mode === 'api' && cur._id && String(cur._id).indexOf('local-') !== 0) {
      var body = {};
      if (patch.nome !== undefined) body.name = patch.nome;
      if (patch.email !== undefined) body.email = patch.email;
      if (patch.plano !== undefined) body.plan = patch.plano;
      if (patch.cargo !== undefined) body.jobTitle = patch.cargo;
      if (patch.note !== undefined) body.note = patch.note;
      if (patch.papel !== undefined) body.role = patch.papel === 'admin' ? 'admin' : (patch.papel === 'cliente' ? 'client' : 'member');
      if (patch.status !== undefined) body.status = patch.status === 'ativo' ? 'active' : (patch.status === 'bloqueado' ? 'blocked' : 'invite');
      var r = await api('/api/users?id=' + encodeURIComponent(cur._id), { method: 'PATCH', body: body });
      var mapped = mapUser(r.user);
      state.users = state.users.map(function(x){ return (x._id===mapped._id||x.id===mapped.id) ? mapped : x; });
      emit('users'); return mapped;
    }
    Object.assign(cur, patch); if (state.mode === 'local') gravarLocal(K_USERS, state.users); emit('users'); return cur;
  }

  // ---- Business records (leads / contratos / pagamentos / sites / atividades) ----
  async function carregar(colecao) {
    var map = { leads: ['/api/leads', 'leads'], contracts: ['/api/contracts', 'contracts'], payments: ['/api/payments', 'payments'], sites: ['/api/sites', 'sites'], activities: ['/api/activities?limit=30', 'activities'] };
    var conf = map[colecao];
    if (!conf) throw new Error('Coleção desconhecida: ' + colecao);
    var r = await api(conf[0]);
    state[colecao] = r[conf[1]] || [];
    emit(colecao);
    return state[colecao];
  }

  async function criarLead(payload) {
    var r = await api('/api/leads', { method: 'POST', body: payload });
    state.leads.unshift(r.lead); emit('leads');
    carregar('activities').catch(function () {});
    return r.lead;
  }
  async function atualizarLead(id, patch) {
    var r = await api('/api/leads?id=' + encodeURIComponent(id), { method: 'PATCH', body: patch });
    state.leads = state.leads.map(function (x) { return x.id === id ? r.lead : x; });
    emit('leads'); return r.lead;
  }
  async function excluirLead(id) {
    await api('/api/leads?id=' + encodeURIComponent(id), { method: 'DELETE' });
    state.leads = state.leads.filter(function (x) { return x.id !== id; });
    emit('leads');
  }
  async function criarContrato(payload) {
    var r = await api('/api/contracts', { method: 'POST', body: payload });
    state.contracts.unshift(r.contract); emit('contracts');
    carregar('activities').catch(function () {});
    return r.contract;
  }
  async function atualizarContrato(id, patch) {
    var r = await api('/api/contracts?id=' + encodeURIComponent(id), { method: 'PATCH', body: patch });
    state.contracts = state.contracts.map(function (x) { return x.id === id ? r.contract : x; });
    emit('contracts'); return r.contract;
  }
  async function excluirContrato(id) {
    await api('/api/contracts?id=' + encodeURIComponent(id), { method: 'DELETE' });
    state.contracts = state.contracts.filter(function (x) { return x.id !== id; });
    emit('contracts');
  }
  async function criarPagamento(payload) {
    var r = await api('/api/payments', { method: 'POST', body: payload });
    state.payments.unshift(r.payment); emit('payments');
    carregar('activities').catch(function () {});
    return r.payment;
  }
  async function atualizarPagamento(id, patch) {
    var r = await api('/api/payments?id=' + encodeURIComponent(id), { method: 'PATCH', body: patch });
    state.payments = state.payments.map(function (x) { return x.id === id ? r.payment : x; });
    emit('payments'); return r.payment;
  }
  async function excluirPagamento(id) {
    await api('/api/payments?id=' + encodeURIComponent(id), { method: 'DELETE' });
    state.payments = state.payments.filter(function (x) { return x.id !== id; });
    emit('payments');
  }
  async function criarSite(payload) {
    var r = await api('/api/sites', { method: 'POST', body: payload });
    state.sites.unshift(r.site); emit('sites');
    carregar('activities').catch(function () {});
    return r.site;
  }
  async function atualizarSite(id, patch) {
    var r = await api('/api/sites?id=' + encodeURIComponent(id), { method: 'PATCH', body: patch });
    state.sites = state.sites.map(function (x) { return x.id === id ? r.site : x; });
    emit('sites'); return r.site;
  }
  async function excluirSite(id) {
    await api('/api/sites?id=' + encodeURIComponent(id), { method: 'DELETE' });
    state.sites = state.sites.filter(function (x) { return x.id !== id; });
    emit('sites');
  }

  // ---- Formatação consistente (pt-BR) ----
  function num(valor) { return Number(valor || 0).toLocaleString('pt-BR'); }
  function dinheiro(valor) { return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function data(iso) { if (!iso) return '—'; var d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR'); }
  function dataCurta(iso) { return data(iso); }
  function iniciais(nome) { return String(nome || '').trim().split(/\s+/).filter(Boolean).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase() || '?'; }

  async function salvarTickets(list) {
    state.tickets = Array.isArray(list) ? list.slice() : state.tickets;
    if (state.mode === 'local') gravarLocal(K_TICKETS, state.tickets);
    emit('tickets');
  }

  // Converte o payload da UI (pt-BR) para o contrato da API /api/tickets (EN)
  function toApiTicket(payload) {
    payload = payload || {};
    var body = {
      subject: String(payload.subject || payload.assunto || '').trim(),
      description: payload.description !== undefined ? payload.description : (payload.descricao || ''),
      reason: payload.reason || payload.motivo || 'outro',
      priority: payload.priority || payload.prioridade || 'media',
      origin: payload.origin || payload.origem || 'Dashboard',
    };
    if (payload.reasonLabel || payload.motivoRotulo) body.reasonLabel = payload.reasonLabel || payload.motivoRotulo;
    if (payload.status) body.status = payload.status;
    return body;
  }

  async function criarTicket(payload) {
    if (state.mode === 'api') {
      var body = toApiTicket(payload);
      if (!body.subject || body.subject.length < 2) throw new Error('Escreva uma dúvida com pelo menos 2 caracteres.');
      var r = await api('/api/tickets', { method: 'POST', body: body });
      state.tickets.unshift(r.ticket); emit('tickets'); return r.ticket;
    }
    var t = Object.assign({ id: Date.now(), criado: new Date().toISOString(), atualizado: new Date().toISOString(), mensagens: [] }, payload);
    state.tickets.unshift(t); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); return t;
  }

  async function atualizarTicket(id, patch) {
    if (state.mode === 'api') {
      // a API aceita apenas status/priority/subject (em inglês)
      var body = {};
      if (patch.status !== undefined) body.status = patch.status;
      if (patch.priority !== undefined) body.priority = patch.priority;
      if (patch.prioridade !== undefined) body.priority = patch.prioridade;
      if (patch.subject !== undefined) body.subject = patch.subject;
      if (!Object.keys(body).length) return state.tickets.filter(function(x){ return Number(x.id)===Number(id); })[0] || null;
      var r = await api('/api/tickets?id=' + encodeURIComponent(id), { method: 'PATCH', body: body });
      state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; });
      emit('tickets'); return r.ticket;
    }
    var t = state.tickets.filter(function(x){ return Number(x.id)===Number(id); })[0];
    if (t) { Object.assign(t, patch); t.atualizado = new Date().toISOString(); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); }
    return t || null;
  }

  async function enviarMensagem(ticketId, text, extra) {
    if (state.mode === 'api') {
      var r = await api('/api/tickets?id=' + encodeURIComponent(ticketId) + '&action=message', { method: 'POST', body: Object.assign({ text: String(text || '').trim() }, extra || {}) });
      state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; });
      emit('tickets'); return r.ticket;
    }
    var t = state.tickets.filter(function(x){ return Number(x.id)===Number(ticketId); })[0];
    if (t) { t.mensagens.push({ id: Date.now(), autor: 'cliente', texto: text, em: new Date().toISOString(), lida: true }); t.atualizado = new Date().toISOString(); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); }
    return t;
  }

  async function carregarTicket(id) {
    if (state.mode === 'api') {
      try { var r = await api('/api/tickets?id=' + encodeURIComponent(id)); state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; }); if (!state.tickets.some(function(x){return Number(x.id)===Number(id);})) state.tickets.unshift(r.ticket); return r.ticket; } catch(e){ return null; }
    }
    return state.tickets.filter(function(x){ return Number(x.id)===Number(id); })[0] || null;
  }

  function proximoId() { var max = 4021; state.tickets.forEach(function(t){ if (Number(t.id)>max) max=Number(t.id); }); return max+1; }

  // ---- Auth helpers (async-capable, with sync cache) ----
  async function login(email, password) {
    var r = await api('/api/auth/login', { method: 'POST', body: { email: email, password: password } });
    setMode('api');
    state.me = r && r.user ? mapUser(r.user) : null;
    await refresh();
    return state.me;
  }
  async function entrarAdmin(email) {
    // legacy signature support: pages call entrarAdmin(email) after validation; real auth uses login(email,password)
    // If called with 1 arg in api mode, treat as session refresh check.
    if (state.mode === 'api') { await sessao(); return !!(state.me && state.me.papel === 'admin'); }
    if (email) { try { localStorage.setItem(K_SESSION, 'sim'); } catch(e){} state.me = { papel:'admin', email: email }; return true; }
    return false;
  }
  async function sairAdmin() {
    if (state.mode === 'api') { try { await api('/api/auth/logout', { method:'POST' }); } catch(e){} }
    try { localStorage.removeItem(K_SESSION); } catch(e){}
    state.me = null; state.users = []; state.tickets = []; emit('logout');
  }

  // bootstrap
  pronto();

  // cross-tab refresh hint (local mode / general)
  window.addEventListener('storage', function(){ emit('storage'); });

  // ---- Recuperação de senha (token com validade; e-mail preparado via env, sem credenciais no código) ----
  var K_RECOVERY = "prospecta:recovery";
  var RECOVERY_VALIDITY_MS = 60 * 60 * 1000; // 1 hora

  function gerarToken() {
    var arr = new Uint8Array(24);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
    else for (var i = 0; i < 24; i++) arr[i] = Math.floor(Math.random() * 256);
    var token = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (var i = 0; i < arr.length; i++) token += chars[arr[i] % chars.length];
    return token;
  }

  function lerRecovery() {
    try { var raw = localStorage.getItem(K_RECOVERY); var list = raw ? JSON.parse(raw) : null; return Array.isArray(list) ? list : []; } catch (e) { return []; }
  }
  function gravarRecovery(list) { try { localStorage.setItem(K_RECOVERY, JSON.stringify(list)); } catch (e) {} }

  async function solicitarRecuperacaoSenha(email) {
    email = String(email || '').trim().toLowerCase();
    var me = state.users.filter(function (u) { return String(u.email || '').toLowerCase() === email; })[0] || state.me;
    var alvo = me ? me.email : email;
    var list = lerRecovery();
    list = list.filter(function (r) { return String(r.email || '').toLowerCase() !== email || !r.used; });
    var token = gerarToken();
    list.push({ email: alvo, token: token, expiresAt: Date.now() + RECOVERY_VALIDITY_MS, used: false, criado: new Date().toISOString() });
    gravarRecovery(list);
    var resetUrl = (typeof location !== 'undefined' ? location.origin + location.pathname.replace('recuperar.html', 'recuperar.html') : '') + '?token=' + token;
    var gmailUser = (typeof process !== 'undefined' && process.env && process.env.GMAIL_USER) || '';
    var gmailPass = (typeof process !== 'undefined' && process.env && process.env.GMAIL_APP_PASSWORD) || '';
    if (gmailUser && gmailPass) {
      console.log('[Recuperação] SMTP Gmail configurado para ' + gmailUser + ' — enviar para ' + alvo + ' link: ' + resetUrl);
    }
    console.log('[Recuperação] Token gerado para ' + alvo + ' (expira em 1h). Link dev: ' + resetUrl);
    return { ok: true, email: alvo };
  }

  async function redefinirSenha(token, novaSenha) {
    if (!token || !novaSenha || String(novaSenha).length < 8) throw new Error('Token ou senha inválidos.');
    var list = lerRecovery();
    var rec = list.find(function (r) { return r.token === token && !r.used; }) || null;
    if (!rec) throw new Error('Token inválido ou já utilizado.');
    if (Date.now() > rec.expiresAt) {
      rec.used = true;
      gravarRecovery(list);
      throw new Error('Token expirado. Solicite um novo link.');
    }
    var email = String(rec.email || '').toLowerCase();
    var user = state.users.filter(function (u) { return String(u.email || '').toLowerCase() === email; })[0];
    if (!user) throw new Error('Usuário não encontrado.');
    if (state.mode === 'api') {
      var r = await api('/api/auth/reset-password', { method: 'POST', body: { token: token, password: String(novaSenha) } });
      if (r && r.user) {
        var mapped = mapUser(r.user);
        state.users = state.users.map(function (x) { return (x._id === mapped._id || x.id === mapped.id) ? mapped : x; });
        if (state.me && String(state.me.email || '').toLowerCase() === email) state.me = mapped;
        emit('users');
      }
      return r;
    }
    user.password = String(novaSenha);
    user.passwordChangedAt = new Date().toISOString();
    if (state.me && String(state.me.email || '').toLowerCase() === email) {
      state.me.password = String(novaSenha);
      state.me.passwordChangedAt = user.passwordChangedAt;
    }
    rec.used = true;
    gravarRecovery(list);
    if (state.mode === 'local') gravarLocal(K_USERS, state.users);
    emit('users');
    return { ok: true };
  }

  return {
    // sync (cache)
    usuarios: usuarios, tickets: tickets, ehAdmin: ehAdmin, eu: eu,
    leads: leads, contratos: contratos, pagamentos: pagamentos, sites: sites, atividades: atividades,
    esc: esc, hora: hora, haQuanto: haQuanto, ultimaMensagem: ultimaMensagem, naoLidas: naoLidas, proximoId: proximoId,
    num: num, dinheiro: dinheiro, data: data, dataCurta: dataCurta, iniciais: iniciais,
    carregar: carregar,
    criarLead: criarLead, atualizarLead: atualizarLead, excluirLead: excluirLead,
    criarContrato: criarContrato, atualizarContrato: atualizarContrato, excluirContrato: excluirContrato,
    criarPagamento: criarPagamento, atualizarPagamento: atualizarPagamento, excluirPagamento: excluirPagamento,
    criarSite: criarSite, atualizarSite: atualizarSite, excluirSite: excluirSite,
    // async
    pronto: pronto, refresh: refresh, sessao: sessao, login: login, entrarAdmin: entrarAdmin, sairAdmin: sairAdmin,
    criarUsuario: criarUsuario, atualizarUsuario: atualizarUsuario, salvarUsuarios: salvarUsuarios,
    criarTicket: criarTicket, atualizarTicket: atualizarTicket, enviarMensagem: enviarMensagem, carregarTicket: carregarTicket, salvarTickets: salvarTickets,
    modo: function(){ return state.mode; },
    marcarLidas: async function() {
      if (state.mode === 'api') {
        try {
          var r = await api('/api/activities/read-all', { method: 'POST' });
          state.activities = (r.activities || []).map(function(a) { return Object.assign({}, a, { read: true }); });
          emit('activities');
          return r;
        } catch (e) { console.warn('[Dados] marcarLidas falhou', e); }
      }
      // Local mode: just mark all as read in cache
      state.activities = state.activities.map(function(a) { return Object.assign({}, a, { read: true }); });
      emit('activities');
    },
    solicitarRecuperacaoSenha: solicitarRecuperacaoSenha,
    redefinirSenha: redefinirSenha
  };
})();

window.AdminAPI = { ehAdmin: function () { return window.Dados.ehAdmin(); } };
