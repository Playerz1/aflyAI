import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 15 * 60 * 1000;
// Limite: no máximo 3 solicitações por e-mail a cada 15 minutos.
const RATE_LIMIT = 3;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    // Não revela se o e-mail possui conta: resposta sempre igual.
    if (!user || user.status === "SUSPENDED") {
      return NextResponse.json({ ok: true });
    }

    // Limite de solicitações.
    const recent = await db.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - TOKEN_TTL_MS) } },
    });
    if (recent >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Muitas solicitações. Aguarde alguns minutos antes de tentar novamente." },
        { status: 429 },
      );
    }

    // Invalida tokens anteriores ainda não utilizados.
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl.replace(/\/$/, "")}/redefinir-senha?token=${token}`;

    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot-password error", err);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação. Tente novamente." },
      { status: 500 },
    );
  }
}
