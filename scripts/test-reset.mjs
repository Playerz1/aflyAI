const BASE = "http://localhost:3000";
const email = `teste-reset-${Date.now()}@aflyai-test.com`;
const j = (r) => r.json();

async function main() {
  // 1. Registrar usuário de teste
  let r = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Teste Reset", email, password: "senha1234" }),
  });
  console.log("register:", r.status, await j(r));

  // 2. Solicitar recuperação (Resend falhará sem API key, mas o token é criado antes)
  r = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const forgot = await j(r);
  console.log("forgot:", r.status, forgot);

  // Pegar o hash do token direto do Neon para simular o link
  const { execSync } = await import("node:child_process");
  // Buscar token via query direta no banco
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const rec = await db.passwordResetToken.findFirst({
    where: { user: { email } },
    orderBy: { createdAt: "desc" },
  });
  console.log("token record:", rec ? { id: rec.id, usedAt: rec.usedAt, expiresAt: rec.expiresAt } : null);
  // Não temos o token em texto puro (só o hash) — para o teste geramos um token conhecido:
  const crypto = await import("node:crypto");
  const knownToken = "testtoken123";
  const hash = crypto.createHash("sha256").update(knownToken).digest("hex");
  await db.passwordResetToken.update({ where: { id: rec.id }, data: { tokenHash: hash, usedAt: null, expiresAt: new Date(Date.now() + 15 * 60000) } });
  await db.$disconnect();

  // 3. Redefinir senha
  r = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: knownToken, password: "novaSenha99", confirm: "novaSenha99" }),
  });
  console.log("reset:", r.status, await j(r));

  // 4. Token antigo não funciona mais
  r = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: knownToken, password: "outraSenha11", confirm: "outraSenha11" }),
  });
  console.log("reset reuse (deve falhar 400):", r.status, await j(r));

  // 5. Login com a nova senha
  r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "novaSenha99" }),
  });
  console.log("login nova senha (deve 200):", r.status, await j(r));

  // 6. Login com a senha antiga deve falhar
  r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "senha1234" }),
  });
  console.log("login senha antiga (deve 401):", r.status, await j(r));
}
main().catch((e) => { console.error(e); process.exit(1); });
