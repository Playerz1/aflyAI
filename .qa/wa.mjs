/* Valida o link da Central de Ajuda e do botão flutuante do WhatsApp. */
export default async function run(page) {
  await page.goto("http://localhost:5174/contratos.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const out = await page.evaluate(() => {
    const help = document.querySelector("[data-wa-help]");
    const fab = document.querySelector(".wa-float");
    const fuel = (href) => {
      const u = new URL(href);
      return { host: u.host, number: u.pathname.replace(/\D/g, ""), text: u.searchParams.get("text") };
    };
    return {
      help: fuel(help.href),
      fab: fuel(fab.href),
      fabInViewport: !!fab && fab.getBoundingClientRect().bottom < window.innerHeight + 1
    };
  });

  // Mobile: o botão não pode cobrir o toast nem sair da tela
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  out.mobileFab = await page.evaluate(() => {
    const r = document.querySelector(".wa-float").getBoundingClientRect();
    return { right: Math.round(window.innerWidth - r.right), bottom: Math.round(window.innerHeight - r.bottom), size: Math.round(r.width) };
  });

  await page.screenshot({ path: ".qa/wa-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: ".qa/wa-desktop.png" });
  return out;
}
