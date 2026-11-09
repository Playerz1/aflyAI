/* QA de todas as páginas: console errors + overflow horizontal em desktop, tablet e mobile. */
const { chromium } = require("C:\\Users\\Administrator\\.cursor\\extensions\\danielsanmedium.dscodegpt-3.24.81-universal\\standalone\\node_modules\\patchright");

const pages = [
  "dashboard", "prospectar", "contratos", "sites", "editor", "equipes", "extensao", "configuracoes",
  "admin-login", "admin", "tickets", "usuarios"
];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1100 },
  { name: "mobile", width: 390, height: 844 }
];

(async () => {
  const browser = await chromium.launch({ channel: "chromium" });
  const problems = [];
  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.name === "mobile",
      hasTouch: vp.name === "mobile"
    });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    // sessão admin ligada (senão admin/tickets/usuarios redirecionam)
    await page.goto("http://localhost:5174/dashboard.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("prospecta:admin", JSON.stringify("sim")));

    for (const name of pages) {
      errors.length = 0;
      if (name === "admin-login") await page.evaluate(() => localStorage.removeItem("prospecta:admin"));
      await page.goto("http://localhost:5174/" + name + ".html", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const info = await page.evaluate(() => {
        const de = document.documentElement;
        const offenders = [];
        if (de.scrollWidth > de.clientWidth + 1) {
          document.querySelectorAll("body *").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > de.clientWidth + 2 && r.width > 0) {
              offenders.push(el.tagName.toLowerCase() + "." + (String(el.className).split(" ")[0] || "") + " right=" + Math.round(r.right));
            }
          });
        }
        return { title: document.title, url: location.pathname, overflow: de.scrollWidth - de.clientWidth, offenders: offenders.slice(0, 3) };
      });
      if (info.overflow > 1 || errors.length) {
        problems.push({ page: name, vp: vp.name, ...info, errors: [...errors] });
      }
      await page.screenshot({ path: ".qa/" + name + "-" + vp.name + ".png", timeout: 90000 });
      if (name === "admin-login") await page.evaluate(() => localStorage.setItem("prospecta:admin", JSON.stringify("sim")));
    }
    await page.close();
  }
  console.log(JSON.stringify({ checked: pages.length * viewports.length, problems }, null, 2));
  await browser.close();
})();
