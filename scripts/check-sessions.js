const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const sessions = await db.session.findMany();
  console.log(
    JSON.stringify(
      sessions.map((s) => ({ token: s.token.slice(0, 10), userId: s.userId, exp: s.expiresAt })),
      null,
      1
    )
  );
  await db.$disconnect();
})();
