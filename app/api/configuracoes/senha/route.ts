import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!userWithPassword || !verifyPassword(currentPassword, userWithPassword.password)) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao alterar senha." }, { status: 400 });
  }
}
