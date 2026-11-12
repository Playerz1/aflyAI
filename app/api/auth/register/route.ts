import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const user = await db.user.create({
      data: { name, email, password: hashPassword(password) },
    });

    await db.activityLog.create({
      data: { userId: user.id, action: "account.created", detail: `Conta criada para ${email}` },
    });

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Erro interno ao criar conta." }, { status: 500 });
  }
}
