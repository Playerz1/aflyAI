const { chromium } = require("C:\\Users\\Administrator\\.cursor\\extensions\\danielsanmedium.dscodegpt-3.24.81-universal\\standalone\\node_modules\\patchright");

(async () => {
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:5174/extensao.html", { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    const de = document.documentElement;
    const chain = [];
    let el = document.getElementById("snippet-code");
    while (el && el !== document.body) {
      chain.push([
        el.tagName.toLowerCase() + "." + (el.className || ""),
        Math.round(el.getBoundingClientRect().width),
        getComputedStyle(el).minWidth,
        Math.round(el.scrollWidth)
      ]);
      el = el.parentElement;
    }
    return { clientW: de.clientWidth, scrollW: de.scrollWidth, chain };
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
