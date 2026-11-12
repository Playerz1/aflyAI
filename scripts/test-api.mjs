const token = process.argv[2];
const base = "http://localhost:3000";
const headers = { "Content-Type": "application/json", Cookie: `afly_session=${token}` };

async function check(path, opts = {}) {
  const res = await fetch(base + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  let body;
  try {
    body = await res.json();
  } catch {
    body = "<no json>";
  }
  console.log(path, "->", res.status, JSON.stringify(body).slice(0, 120));
}

const me = await check("/api/auth/me");
await check("/api/logs", { method: "POST", body: JSON.stringify({ action: "teste.sistema", detail: "verificacao automatica" }) });
await check("/api/metrics", { method: "POST", body: JSON.stringify({ label: "Vendas teste", value: 150, unit: "R$" }) });
await check("/api/logs");
await check("/api/metrics");
