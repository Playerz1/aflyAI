const base = "http://localhost:3000";

async function j(path, opts = {}, headers = {}) {
  const res = await fetch(base + path, { ...opts, headers: { "Content-Type": "application/json", ...headers } });
  let body;
  try { body = await res.json(); } catch { body = "<html>"; }
  return { status: res.status, body, res };
}

// login to get session
const login = await j("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "riq@teste.com", password: "senha12345" }),
});
console.log("login:", login.status, JSON.stringify(login.body).slice(0, 90));
const cookie = (login.res.headers.get("set-cookie") || "").match(/afly_session=([^;]+)/)?.[1];
const H = cookie ? { Cookie: `afly_session=${cookie}` } : {};

// register sales
for (const amount of [250, 480, 1200.5]) {
  const r = await j("/api/sales", { method: "POST", body: JSON.stringify({ title: "Venda teste", amount }) }, H);
  console.log("add sale", amount, "->", r.status);
}

// list sales
const list = await j("/api/sales", {}, H);
console.log("sales list:", list.status, "count:", (list.body.sales || []).length);

// pages
for (const p of ["/", "/cadastro"]) {
  const r = await fetch(base + p);
  console.log("page", p, "->", r.status);
}

// dashboard redirect without session
const dash = await fetch(base + "/dashboard", { redirect: "manual" });
console.log("dashboard sem sessao:", dash.status, dash.headers.get("location"));

// dashboard with session
const dashAuth = await fetch(base + "/dashboard", { headers: H, redirect: "manual" });
console.log("dashboard com sessao:", dashAuth.status);

// removed routes should 404
for (const p of ["/api/logs", "/api/metrics", "/dashboard/atividade", "/dashboard/metricas", "/dashboard/conta"]) {
  const r = await fetch(base + p, { headers: H, redirect: "manual" });
  console.log("removida", p, "->", r.status);
}
