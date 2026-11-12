const fs = require("fs");
const env = fs.readFileSync(".env.vercel-check", "utf8");
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="(.*)"$/);
  if (m && /DATABASE|DIRECT/.test(m[1])) {
    try {
      const u = new URL(m[2]);
      console.log(m[1], "-> db:", u.pathname, "| schema:", u.searchParams.get("schema"), "| host:", u.host);
    } catch {
      console.log(m[1], "-> (unparsable)");
    }
  }
}
