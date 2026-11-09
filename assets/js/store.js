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
  var USUARIOS_SEED = [
    { id: 1, _id: 'local-1', nome: "Rafael Mendes", iniciais: "RM", email: "rafael@agenciamendes.com", plano: "Pro", cargo: "Proprietário", status: "ativo", papel: "admin", tickets: 4, criado: "2025-03-04T10:12:00", ultimo: "2026-11-08T09:42:00" },
    { id: 2, _id: 'local-2', nome: "Ana Lima", iniciais: "AL", email: "ana@agenciamendes.com", plano: "Pro", cargo: "Comercial", status: "ativo", papel: "membro", tickets: 1, criado: "2025-04-18T14:30:00", ultimo: "2026-11-08T08:15:00" }
  ];
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
        await Promise.all(tasks);
      } catch (e) { console.warn('[Dados] refresh api falhou', e); }
    } else if (state.mode === 'local') {
      state.users = localUsuarios();
      state.tickets = localTickets();
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
      var r = await api('/api/users/' + cur._id, { method: 'PATCH', body: body });
      var mapped = mapUser(r.user);
      state.users = state.users.map(function(x){ return (x._id===mapped._id||x.id===mapped.id) ? mapped : x; });
      emit('users'); return mapped;
    }
    Object.assign(cur, patch); if (state.mode === 'local') gravarLocal(K_USERS, state.users); emit('users'); return cur;
  }

  async function salvarTickets(list) {
    state.tickets = Array.isArray(list) ? list.slice() : state.tickets;
    if (state.mode === 'local') gravarLocal(K_TICKETS, state.tickets);
    emit('tickets');
  }

  async function criarTicket(payload) {
    if (state.mode === 'api') {
      var r = await api('/api/tickets', { method: 'POST', body: payload });
      state.tickets.unshift(r.ticket); emit('tickets'); return r.ticket;
    }
    var t = Object.assign({ id: Date.now(), criado: new Date().toISOString(), atualizado: new Date().toISOString(), mensagens: [] }, payload);
    state.tickets.unshift(t); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); return t;
  }

  async function atualizarTicket(id, patch) {
    if (state.mode === 'api') {
      var r = await api('/api/tickets/' + id, { method: 'PATCH', body: patch });
      state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; });
      emit('tickets'); return r.ticket;
    }
    var t = state.tickets.filter(function(x){ return Number(x.id)===Number(id); })[0];
    if (t) { Object.assign(t, patch); t.atualizado = new Date().toISOString(); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); }
    return t || null;
  }

  async function enviarMensagem(ticketId, text, extra) {
    if (state.mode === 'api') {
      var r = await api('/api/tickets/' + ticketId + '/messages', { method: 'POST', body: Object.assign({ text: text }, extra || {}) });
      state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; });
      emit('tickets'); return r.ticket;
    }
    var t = state.tickets.filter(function(x){ return Number(x.id)===Number(ticketId); })[0];
    if (t) { t.mensagens.push({ id: Date.now(), autor: 'cliente', texto: text, em: new Date().toISOString(), lida: true }); t.atualizado = new Date().toISOString(); gravarLocal(K_TICKETS, state.tickets); emit('tickets'); }
    return t;
  }

  async function carregarTicket(id) {
    if (state.mode === 'api') {
      try { var r = await api('/api/tickets/' + id); state.tickets = state.tickets.map(function(x){ return Number(x.id)===Number(r.ticket.id) ? r.ticket : x; }); if (!state.tickets.some(function(x){return Number(x.id)===Number(id);})) state.tickets.unshift(r.ticket); return r.ticket; } catch(e){ return null; }
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

  return {
    // sync (cache)
    usuarios: usuarios, tickets: tickets, ehAdmin: ehAdmin, eu: eu,
    esc: esc, hora: hora, haQuanto: haQuanto, ultimaMensagem: ultimaMensagem, naoLidas: naoLidas, proximoId: proximoId,
    // async
    pronto: pronto, refresh: refresh, sessao: sessao, login: login, entrarAdmin: entrarAdmin, sairAdmin: sairAdmin,
    criarUsuario: criarUsuario, atualizarUsuario: atualizarUsuario, salvarUsuarios: salvarUsuarios,
    criarTicket: criarTicket, atualizarTicket: atualizarTicket, enviarMensagem: enviarMensagem, carregarTicket: carregarTicket, salvarTickets: salvarTickets,
    modo: function(){ return state.mode; },
  };
})();

window.AdminAPI = { ehAdmin: function () { return window.Dados.ehAdmin(); } };
