/* Testa a Central de Ajuda: abrir, criar ticket, chat e resposta automática. */
export default async function run(page) {
  const report = {};
  await page.goto("http://localhost:5174/dashboard.html", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  // abre o painel pelo botão Ajuda
  await page.click("[data-support-toggle]");
  await page.waitForTimeout(400);
  report.painelAberto = await page.isVisible(".support.is-open");

  // formulário
  await page.click("[data-support-new]");
  await page.waitForTimeout(200);
  report.formulario = await page.isVisible("#sp-assunto");
  await page.fill("#sp-assunto", "Como troco o domínio do meu site?");
  await page.fill("#sp-desc", "Quero usar meudominio.com.br no lugar do subdomínio.");
  await page.click('.motivo:has(input[value="site"])');
  await page.screenshot({ path: ".qa/support-form.png" });
  await page.click("[data-support-create]");
  await page.waitForTimeout(400);
  report.chatAberto = await page.isVisible("[data-chat]");
  await page.waitForTimeout(2600); // espera a resposta automática
  report.mensagensIniciais = await page.$$eval(".msg", (els) => els.map((e) => e.className.split(" ")[1] + ":" + e.innerText.slice(0, 40)));
  await page.screenshot({ path: ".qa/support-chat.png" });

  // envia mensagem do cliente
  await page.fill("[data-chat-input]", "Perfeito, vou testar e te aviso.");
  await page.click("[data-chat-send]");
  await page.waitForTimeout(300);
  report.aposEnvio = await page.$$eval(".msg", (els) => els.length);

  // volta para a lista e confere o ticket
  await page.click("[data-support-back]");
  await page.waitForTimeout(250);
  report.listaTickets = await page.$$eval(".ticket-row", (els) => els.map((e) => e.innerText.split("\n")[0]));

  // dados persistidos (o admin.html lê daqui)
  report.storage = await page.evaluate(() => {
    const t = JSON.parse(localStorage.getItem("prospecta:tickets") || "[]");
    return { total: t.length, primeiro: t[0] && { id: t[0].id, status: t[0].status, msgs: t[0].mensagens.length, motivo: t[0].motivoRotulo } };
  });
  return report;
}
