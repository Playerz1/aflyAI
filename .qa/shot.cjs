/*
 * Screenshot helper para QA (não faz parte do SaaS).
 * Uso: node .qa/shot.cjs <url> <saida.png> [largura] [height] [full]
 * Ex.: node .qa/shot.cjs http://localhost:5174/dashboard.html .qa/x.png 390 844 full
 */
const { chromium } = require("C:\\Users\\Administrator\\.cursor\\extensions\\danielsanmedium.dscodegpt-3.24.81-universal\\standalone\\node_modules\\patchright");

(async () => {
  const [, , url, out, w = "1440", h = "900", full = "false"] = process.argv;
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({
    viewport: { width: Number(w), height: Number(h) },
    deviceScaleFactor: 1,
    isMobile: Number(w) < 600,
    hasTouch: Number(w) < 600
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(url, { waitUntil: "networkidle" });
  // sessão de admin (as páginas admin/tickets/usuarios redirecionam sem ela)
  if (/\/(admin|tickets|usuarios)\.html/.test(url)) {
    await page.evaluate(() => localStorage.setItem("prospecta:admin", JSON.stringify("sim")));
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.waitForTimeout(400);
  if (full === "full") {
    // força o carregamento de tudo (ex.: contadores animados no fim da página)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: out, fullPage: full === "full", timeout: 90000 });
  const info = await page.evaluate(() => ({
    title: document.title,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  }));
  console.log(JSON.stringify({ ...info, errors }, null, 2));
  await browser.close();
})();
