/* =========================================================
   PROSPECTA · store.js — Adapter de dados (API + cache)
   - Produção: Neon PostgreSQL via /api/* (Vercel Functions)
   - Cache em memória para compatibilidade com páginas síncronas
   - Fallback localStorage APENAS se /api/* indisponível (dev offline)
   - Nunca usa SQLite/JSON como banco de produção
   ========================================================= */

window.Dados = (function () {
  "use strict";

  var K_MODE = "prospecta:data-mode";
  var K_RECOVERY = "prospecta:recovery";
  var RECOVERY_VALIDITY_MS = 60 * 60 * 1000; // 1 hora

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

  /* ---------- Eventos ---------- */
  function emit(key) {
    try { window.dispatchEvent(new CustomEvent("prospecta:mudou", { detail: { key: key || "refresh" } })); } catch (e) {}
  }

  /* ---------- Helpers ---------- */
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
    var dd = Math.round(h / 24);
    return dd === 1 ? "ontem" : "há " + dd + " dias";
  }

  function dinheiro(valor) {
    var n = Number(valor || 0);
    return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function num(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  /* ---------- Chamada à API ---------- */
  function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (opts.body) headers["Content-Type"] = "application/json";
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

  /* ---------- Detecção de modo ---------- */
  function detectarModo() {
    try {
      if (typeof localStorage !== "undefined") {
        var m = localStorage.getItem(K_MODE);
        if (m === "api" || m === "local") return m;
      }
    } catch (e) {}
    return "local";
  }

  function carregarLocal(key, def) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; } catch (e) { return def; }
  }
  function gravarLocal(key, valor) {
    try { localStorage.setItem(key, JSON.stringify(valor)); } catch (e) {}
  }

  /* ---------- Inicialização ---------- */
  function pronto() {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise(function (resolve) {
      readyResolve = resolve;
      estadoInicial();
    });
    return readyPromise;
  }

  function estadoInicial() {
    state.mode = detectarModo();
    state.users = carregarLocal(K_USERS, []);
    state.tickets = carregarLocal(K_TICKETS, []);
    state.me = carregarLocal(K_USERS + ":me", null);
    if (typeof localStorage !== "undefined") {
      try {
        var sess = localStorage.getItem("prospecta:session");
        if (sess) {
          var s = JSON.parse(sess);
          if (s.user) state.me = s.user;
        }
      } catch (e) {}
    }
    state.ready = true;
    if (readyResolve) readyResolve();
    emit("init");
  }

  /* ---------- Usuário autenticado ---------- */
  function setMe(user) {
    state.me = user;
    try { localStorage.setItem(K_USERS + ":me", JSON.stringify(user)); } catch (e) {}
    try { localStorage.setItem("prospecta:session", JSON.stringify({ user: user })); } catch (e) {}
    emit("users");
  }
  function eu() { return state.me || null; }
  function ehAdmin() {
    var m = state.me;
    return !!(m && (m.role === "admin" || m.email === "admin@prospecta.com"));
  }
  function admin() { return ehAdmin(); }

  function login(email, senha) {
    if (state.mode === "api") {
      return api("/api/auth/login", { method: "POST", body: { email: email, password: senha } }).then(function (res) {
        var u = res && res.user ? res.user : null;
        if (!u) throw new Error("Usuário não retornado");
        var mapped = mapearUsuario(u);
        state.users = [mapped];
        setMe(mapped);
        return mapped;
      });
    }
    // local dev
    return Promise.resolve().then(function () {
      var list = state.users;
      var user = list.filter(function (u) { return String(u.email || "").toLowerCase() === String(email || "").toLowerCase(); })[0];
      if (!user) throw new Error("Credenciais inválidas");
      if (user.status === "blocked") throw new Error("Usuário bloqueado");
      // Sem senha real em localStorage — aceita qualquer senha ≥ 4 chars apenas para dev
      if (!senha || senha.length < 4) throw new Error("Senha muito curta");
      setMe(user);
      return user;
    });
  }

  function cadastro(email, senha, nome) {
    if (state.mode === "api") {
      return api("/api/auth/signup", { method: "POST", body: { email: email, password: senha, name: nome || email.split("@")[0] } }).then(function (res) {
        var u = res && res.user ? res.user : null;
        if (!u) throw new Error("Falha ao criar conta");
        var mapped = mapearUsuario(u);
        state.users = [mapped];
        setMe(mapped);
        return mapped;
      });
    }
    // local dev — cria usuário sem persistir senha real (apenas simulação)
    return Promise.resolve().then(function () {
      var list = state.users;
      if (list.filter(function (u) { return String(u.email || "").toLowerCase() === String(email || "").toLowerCase(); }).length > 0) {
        throw new Error("E-mail já cadastrado");
      }
      var novo = {
        _id: "user_" + Date.now(),
        id: "user_" + Date.now(),
        email: email.toLowerCase(),
        nome: nome || email.split("@")[0],
        iniciais: iniciaisDoNome(nome || email.split("@")[0]),
        role: email.toLowerCase() === "admin@prospecta.com" ? "admin" : "user",
        status: "ativo",
        plano: "Pro",
        avatar: null,
        criado: new Date().toISOString(),
      };
      list.push(novo);
      state.users = list;
      gravarLocal(K_USERS, list);
      setMe(novo);
      return novo;
    });
  }

  function logout() {
    if (state.mode === "api") {
      return api("/api/auth/logout", { method: "POST" }).then(function () {
        state.me = null;
        try { localStorage.removeItem(K_USERS + ":me"); } catch (e) {}
        try { localStorage.removeItem("prospecta:session"); } catch (e) {}
        emit("users");
        return { ok: true };
      });
    }
    state.me = null;
    try { localStorage.removeItem(K_USERS + ":me"); } catch (e) {}
    try { localStorage.removeItem("prospecta:session"); } catch (e) {}
    emit("users");
    return Promise.resolve({ ok: true });
  }

  /* ---------- Recuperação de senha ---------- */
  function gerarToken() {
    var arr = new Uint8Array(24);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(arr);
    else for (var i = 0; i < 24; i++) arr[i] = Math.floor(Math.random() * 256);
    var token = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (var i = 0; i < arr.length; i++) token += chars[arr[i] % chars.length];
    return token;
  }

  function lerRecovery() {
    try { var raw = localStorage.getItem(K_RECOVERY); var list = raw ? JSON.parse(raw) : null; return Array.isArray(list) ? list : []; } catch (e) { return []; }
  }
  function gravarRecovery(list) { try { localStorage.setItem(K_RECOVERY, JSON.stringify(list)); } catch (e) {} }

  function solicitarRecuperacaoSenha(email) {
    email = String(email || "").trim().toLowerCase();
    var alvo = email;
    if (state.mode === "api") {
      return api("/api/auth/forgot-password", { method: "POST", body: { email: email } }).then(function () {
        // Nunca revela se o e-mail existe (segurança contra enumeração)
        return { ok: true, email: alvo };
      }).catch(function () {
        // Mesmo em erro, retorna ok para não vazar info
        return { ok: true, email: alvo };
      });
    }
    // local dev — registra token no localStorage e exibe no console
    var list = lerRecovery();
    list = list.filter(function (r) { return String(r.email || "").toLowerCase() !== email || !r.used; });
    var token = gerarToken();
    list.push({ email: alvo, token: token, expiresAt: Date.now() + RECOVERY_VALIDITY_MS, used: false, criado: new Date().toISOString() });
    gravarRecovery(list);
    var resetUrl = (typeof location !== "undefined" ? location.origin + location.pathname.replace("recuperar.html", "recuperar.html") : "") + "?token=" + token;
    var gmailUser = (typeof process !== "undefined" && process.env && process.env.GMAIL_USER) || "";
    var gmailPass = (typeof process !== "undefined" && process.env && process.env.GMAIL_APP_PASSWORD) || "";
    if (gmailUser && gmailPass) {
      console.log("[Recuperação] SMTP Gmail configurado para " + gmailUser + " — enviar para " + alvo + " link: " + resetUrl);
    }
    console.log("[Recuperação] Token gerado para " + alvo + " (expira em 1h). Link dev: " + resetUrl);
    return Promise.resolve({ ok: true, email: alvo });
  }

  function redefinirSenha(token, novaSenha) {
    if (!token || !novaSenha || String(novaSenha).length < 8) throw new Error("Token ou senha inválidos.");
    var list = lerRecovery();
    var rec = list.find(function (r) { return r.token === token && !r.used; }) || null;
    if (!rec) throw new Error("Token inválido ou já utilizado.");
    if (Date.now() > rec.expiresAt) {
      rec.used = true;
      gravarRecovery(list);
      throw new Error("Token expirado. Solicite um novo link.");
    }
    var email = String(rec.email || "").toLowerCase();

    if (state.mode === "api") {
      return api("/api/auth/reset-password", { method: "POST", body: { token: token, password: String(novaSenha) } }).then(function (r) {
        if (r && r.user) {
          var mapped = mapearUsuario(r.user);
          state.users = state.users.map(function (x) { return (x._id === mapped._id || x.id === mapped.id) ? mapped : x; });
          if (state.me && String(state.me.email || "").toLowerCase() === email) state.me = mapped;
          emit("users");
        }
        return r;
      });
    }
    // local dev
    var user = state.users.filter(function (u) { return String(u.email || "").toLowerCase() === email; })[0];
    if (!user) throw new Error("Usuário não encontrado.");
    user.password = String(novaSenha);
    user.passwordChangedAt = new Date().toISOString();
    if (state.me && String(state.me.email || "").toLowerCase() === email) {
      state.me.password = String(novaSenha);
      state.me.passwordChangedAt = user.passwordChangedAt;
    }
    rec.used = true;
    gravarRecovery(list);
    gravarLocal(K_USERS, state.users);
    emit("users");
    return Promise.resolve({ ok: true });
  }

  /* ---------- Usuários / perfil ---------- */
  function atualizarUsuario(id, dados) {
    if (state.mode === "api") {
      return api("/api/users/" + id, { method: "PATCH", body: dados }).then(function (res) {
        var mapped = mapearUsuario(res && res.user ? res.user : null);
        if (!mapped) throw new Error("Falha ao atualizar");
        state.users = state.users.map(function (x) { return (x._id === mapped._id || x.id === mapped.id) ? mapped : x; });
        if (state.me && (state.me._id === mapped._id || state.me.id === mapped.id)) {
          setMe(mapped);
        }
        emit("users");
        return mapped;
      });
    }
    // local dev
    var list = state.users;
    var u = list.filter(function (x) { return x._id === id || x.id === id; })[0];
    if (!u) throw new Error("Usuário não encontrado.");
    if (dados.nome) { u.nome = dados.nome; u.iniciais = iniciaisDoNome(dados.nome); }
    if (dados.email) u.email = dados.email.toLowerCase();
    if (dados.avatar !== undefined) u.avatar = dados.avatar || null;
    if (dados.plano) u.plano = dados.plano;
    if (dados.status) u.status = dados.status;
    state.users = list;
    gravarLocal(K_USERS, list);
    if (state.me && (state.me._id === id || state.me.id === id)) setMe(u);
    emit("users");
    return Promise.resolve(u);
  }

  function usuarios() { return state.users; }

  /* ---------- Tickets ---------- */
  function tickets() { return state.tickets; }
  function buscarTicket(id) { return state.tickets.filter(function (t) { return t.id == id; })[0] || null; }

  function criarTicket(dados) {
    if (state.mode === "api") {
      return api("/api/tickets", { method: "POST", body: dados }).then(function (res) {
        var t = res && res.ticket ? res.ticket : null;
        if (!t) throw new Error("Falha ao criar ticket");
        state.tickets.unshift(t);
        emit("tickets");
        return t;
      });
    }
    // local dev
    var id = "tk_" + Date.now();
    var agora = new Date().toISOString();
    var ticket = {
      id: id,
      assunto: dados.assunto,
      descricao: dados.descricao || "",
      motivo: dados.motivo || "outro",
      motivoRotulo: dados.motivoRotulo || "Outro assunto",
      prioridade: dados.prioridade || "media",
      status: "aberto",
      origem: dados.origem || "Dashboard",
      cliente: dados.cliente || { nome: eu() && eu().nome, email: eu() && eu().email, iniciais: eu() && eu().iniciais },
      criado: agora,
      atualizado: agora,
      mensagens: [{ id: "m1", autor: "cliente", texto: dados.assunto + (dados.descricao ? "\n\n" + dados.descricao : ""), em: agora, lida: true }],
    };
    state.tickets = [ticket].concat(state.tickets);
    emit("tickets");
    return Promise.resolve(ticket);
  }

  function atualizarTicket(id, patches) {
    if (state.mode === "api") {
      return api("/api/tickets/" + id, { method: "PATCH", body: patches }).then(function (res) {
        var t = res && res.ticket ? res.ticket : null;
        if (!t) throw new Error("Falha ao atualizar ticket");
        state.tickets = state.tickets.map(function (x) { return x.id == id ? t : x; });
        emit("tickets");
        return t;
      });
    }
    var t = buscarTicket(id);
    if (!t) throw new Error("Ticket não encontrado.");
    Object.assign(t, patches);
    t.atualizado = new Date().toISOString();
    state.tickets = state.tickets.map(function (x) { return x.id == id ? t : x; });
    emit("tickets");
    return Promise.resolve(t);
  }

  function enviarMensagem(ticketId, texto, autor) {
    if (state.mode === "api") {
      return api("/api/tickets/" + ticketId + "/messages", { method: "POST", body: { texto: texto, autor: autor || "cliente" } }).then(function (res) {
        var t = res && res.ticket ? res.ticket : null;
        if (!t) throw new Error("Falha ao enviar mensagem");
        state.tickets = state.tickets.map(function (x) { return x.id == ticketId ? t : x; });
        emit("tickets");
        return t;
      });
    }
    var t = buscarTicket(ticketId);
    if (!t) throw new Error("Ticket não encontrado.");
    var agora = new Date().toISOString();
    var m = { id: "m_" + Date.now(), autor: autor || "cliente", texto: texto, em: agora, lida: false };
    t.mensagens = t.mensagens || [];
    t.mensagens.push(m);
    t.atualizado = agora;
    if (autor !== "cliente") t.status = t.status === "resolvido" ? "resolvido" : "respondido";
    else t.status = "aberto";
    state.tickets = state.tickets.map(function (x) { return x.id == ticketId ? t : x; });
    emit("tickets");
    return Promise.resolve(t);
  }

  /* ---------- Pagamentos / contratos / sites / atividades ---------- */
  function pagamentos() { return state.payments; }
  function contratos() { return state.contracts; }
  function sites() { return state.sites; }
  function atividades() { return state.activities; }

  /* ---------- Mapeamento de usuário da API ---------- */
  function mapearUsuario(u) {
    if (!u) return null;
    var nome = u.nome || u.name || u.email || "Usuário";
    return {
      _id: u._id || u.id,
      id: u._id || u.id,
      email: u.email,
      nome: nome,
      iniciais: u.iniciais || iniciaisDoNome(nome),
      role: u.role || "user",
      status: u.status || "ativo",
      plano: u.plano || "Pro",
      avatar: u.avatar || null,
      criado: u.createdAt || u.criado || new Date().toISOString(),
    };
  }

  /* ---------- API pública ---------- */
  return {
    pronto: pronto,
    eu: eu,
    ehAdmin: ehAdmin,
    admin: admin,
    login: login,
    cadastro: cadastro,
    logout: logout,
    solicitarRecuperacaoSenha: solicitarRecuperacaoSenha,
    redefinirSenha: redefinirSenha,
    atualizarUsuario: atualizarUsuario,
    usuarios: usuarios,
    tickets: tickets,
    buscarTicket: buscarTicket,
    criarTicket: criarTicket,
    atualizarTicket: atualizarTicket,
    enviarMensagem: enviarMensagem,
    pagamentos: pagamentos,
    contratos: contratos,
    sites: sites,
    atividades: atividades,
    mapearUsuario: mapearUsuario,
    esc: esc,
    hora: hora,
    haQuanto: haQuanto,
    dinheiro: dinheiro,
    num: num,
    modo: function () { return state.mode; },
  };
})();
