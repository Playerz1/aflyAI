/* Fluxo completo: cliente abre ticket → admin responde → cliente vê a resposta */
export default async function run(page) {
  const base = "http://localhost:5174/";
  const report = { erros: [] };
  page.on("pageerror", (e) => report.erros.push("pageerror: " + e.message));

  const urlDoContexto = async (arquivo) => page.evaluate((f) => localStorage.getItem(f), arquivo);

  // ---------- 1. Cliente abre um ticket ----------
  await page.goto(base + "dashboard.html", { waitUntil: "networkidle" });
  await page.click("[data-support-toggle]");
  await page.waitForTimeout(300);
  await page.click("[data-support-new]");
  await page.fill("#sp-assunto", "Como publico meu site no ar?");
  await page.fill("#sp-desc", "Criei o site da doceria e não sei qual botão usar.");
  await page.click('.motivo:has(input[value="site"])');
  await page.click("[data-support-create]");
  await page.waitForTimeout(2800);
  report.clienteChat = await page.$$eval("[data-chat] .msg", (els) => els.map((e) => e.innerText.replace(/\n/g, " | ").slice(0, 70)));
  const ticketId = await page.evaluate(() => {
    const t = JSON.parse(localStorage.getItem("prospecta:tickets") || "[]");
    return t[0].id;
  });
  report.ticketCriado = ticketId;
  await page.screenshot({ path: ".qa/flow-1-cliente-abre.png" });

  // ---------- 2. Admin entra e responde ----------
  await page.goto(base + "tickets.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  report.redirecionouParaLogin = page.url().includes("admin-login");

  await page.click("#adm-demo");
  await page.waitForTimeout(1200);
  report.estaEmTickets = page.url().includes("tickets.html");
  report.ticketsNaLista = await page.$$eval(".ticket-item", (els) => els.length);
  await page.screenshot({ path: ".qa/flow-2-admin-inbox.png" });

  // abre o ticket que o cliente acabou de criar
  await page.click(`.ticket-item[data-id="${ticketId}"]`);
  await page.waitForTimeout(300);
  await page.fill("#t-input", "Oi! É só clicar em Publicar no canto superior direito do editor. Já liberei o seu domínio.");
  await page.click("#t-send");
  await page.waitForTimeout(400);
  report.adminEnviou = await page.$$eval("#t-stream .msg", (els) => els.length);
  report.statusAdmin = await page.$eval("#t-status", (e) => e.value);
  await page.screenshot({ path: ".qa/flow-3-admin-responde.png" });

  // ---------- 3. Cliente vê a resposta no chat ----------
  await page.goto(base + "dashboard.html", { waitUntil: "networkidle" });
  await page.click("[data-support-toggle]");
  await page.waitForTimeout(300);
  report.clienteVeTicket = await page.$$eval(".ticket-row", (els) => els.map((e) => e.innerText.split("\n")[0]));
  await page.click(`[data-support-open="${ticketId}"]`);
  await page.waitForTimeout(300);
  report.clienteChatFinal = await page.$$eval("[data-chat] .msg", (els) => els.map((e) => e.innerText.split("\n")[0].slice(0, 60)));
  await page.screenshot({ path: ".qa/flow-4-cliente-resposta.png" });

  // ---------- 4. Usuários ----------
  await page.goto(base + "usuarios.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  report.usuariosLinhas = await page.$$eval("#tabela-usuarios tbody tr", (els) => els.length);
  await page.screenshot({ path: ".qa/flow-5-usuarios.png" });

  await page.goto(base + "admin.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: ".qa/flow-6-admin.png" });

  return report;
}
