const fs = require("fs");
const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const u = new URL(m[1]);
console.log("local db:", u.pathname, "| schema:", u.searchParams.get("schema"), "| host:", u.host);

// list tables in this database
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`
  .then((rows) => {
    console.log("tables:", rows.map((r) => r.tablename).join(", "));
    return db.$disconnect();
  })
  .catch((e) => {
    console.error("query failed:", e.message);
    return db.$disconnect();
  });
