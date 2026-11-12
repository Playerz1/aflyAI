const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const token = process.argv[2];

(async () => {
  const s = await db.session.findUnique({ where: { token }, include: { user: true } });
  console.log(JSON.stringify(s ? { found: true, user: s.user.name } : { found: false }));
  await db.$disconnect();
})();
