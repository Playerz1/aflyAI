import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { hashToken } from "../forgot-password/route";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");
    const confirm = String(body.confirm ?? "");

    if (!token) {
      return NextResponse.json({ error: "Token ausente ou inválido." }, { status: 400 });
    }
    if (password !== confirm) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 },
      );
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "A senha deve conter letras e números." },
        { status: 400 },
      );
    }

    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.usedAt) {
      return NextResponse.json(
        { error: "Token inválido ou já utilizado. Solicite um novo link." },
        { status: 400 },
      );
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expirado. Solicite um novo link de recuperação." },
        { status: 400 },
      );
    }

    // Atualiza a senha usando o mecanismo existente (hash sha256+salt do lib/auth).
    await db.user.update({
      where: { id: record.userId },
      data: { password: hashPassword(password) },
    });

    // Marca o token como utilizado.
    await db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Invalida todas as sessões anteriores do usuário.
    await db.session.deleteMany({ where: { userId: record.userId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-password error", err);
    return NextResponse.json({ error: "Erro ao redefinir a senha." }, { status: 500 });
  }
}
