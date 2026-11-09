/* Roteiro de interação: sidebar mobile, busca/filtros, abas, modal, editor ao vivo. */
export default async function run(page, ui) {
  const report = {};

  // ---------- Dashboard mobile: abre o menu ----------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5174/dashboard.html", { waitUntil: "networkidle" });
  await page.click("[data-menu-toggle]");
  await page.waitForTimeout(350);
  report.drawerOpen = await page.evaluate(() => {
    const sb = document.querySelector(".sidebar").getBoundingClientRect();
    return { bodyHasClass: document.body.classList.contains("nav-open"), left: Math.round(sb.left), width: Math.round(sb.width) };
  });
  await page.screenshot({ path: ".qa/mobile-drawer.png" });
  await page.click(".overlay", { position: { x: 370, y: 400 } });
  await page.waitForTimeout(300);
  report.drawerClosed = await page.evaluate(() => !document.body.classList.contains("nav-open"));

  // ---------- Prospectar: busca + chips ----------
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:5174/prospectar.html", { waitUntil: "networkidle" });
  const rows = () => page.$$eval("#tabela-leads tbody tr", (trs) => trs.filter((t) => !t.classList.contains("hide")).length);
  report.leadsInitial = await rows();
  await page.fill('input[data-search="#tabela-leads"]', "clínica");
  report.leadsSearch = await rows();
  await page.fill('input[data-search="#tabela-leads"]', "");
  await page.click('.chip[data-filter="novo"]');
  report.leadsFilterNovo = await rows();
  await page.click('.chip[data-filter="all"]');

  // ---------- Modal ----------
  await page.click('[data-modal-open="modal-prospectar"]');
  await page.waitForTimeout(350);
  report.modalOpen = await page.isVisible("#modal-prospectar.is-open");
  await page.click('#modal-prospectar button[type="submit"]');
  await page.waitForTimeout(300);
  report.modalClosedAfterSubmit = !(await page.isVisible("#modal-prospectar.is-open"));
  report.toastVisible = await page.isVisible(".toast.is-open");

  // ---------- Configuração: abas ----------
  await page.goto("http://localhost:5174/configuracoes.html#plano", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.querySelector('.tab[data-target="plano"]').click();
    document.querySelector('[data-panel="plano"]').scrollIntoView();
  });
  await page.waitForTimeout(300);
  report.configPlanoVisible = await page.isVisible('[data-panel="plano"]');
  report.configPerfilHidden = !(await page.isVisible('[data-panel="perfil"]'));
  await page.screenshot({ path: ".qa/config-plano.png", fullPage: true });

  // ---------- Editor: prévia ao vivo ----------
  await page.goto("http://localhost:5174/editor.html", { waitUntil: "networkidle" });
  await page.fill("#e-titulo", "Pão quentinho saindo do forno");
  await page.click('.tab[data-target="design"]');
  await page.waitForTimeout(200);
  await page.locator('.swatch[title="Verde"]').scrollIntoViewIfNeeded();
  await page.locator('.swatch[title="Verde"]').click();
  await page.evaluate(() => document.querySelector('[data-view="mobile"]').click());
  await page.waitForTimeout(300);
  report.editor = await page.evaluate(() => {
    const site = document.getElementById("site");
    return {
      titulo: site.querySelector('[data-slot="title"]').textContent,
      accent: getComputedStyle(site).getPropertyValue("--site-accent").trim(),
      shellWidth: Math.round(document.getElementById("preview-shell").getBoundingClientRect().width)
    };
  });
  await page.screenshot({ path: ".qa/editor-mobile-view.png" });

  return report;
}
