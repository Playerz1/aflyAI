import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const r = await db.user.deleteMany({ where: { email: { contains: "aflyai-test.com" } } });
console.log("usuarios de teste removidos:", r.count);
await db.passwordResetToken.deleteMany({});
await db.$disconnect();
