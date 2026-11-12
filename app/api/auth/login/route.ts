import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Conta suspensa. Fale com o suporte." }, { status: 403 });
    }

    await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await db.activityLog.create({
      data: { userId: user.id, action: "auth.login", detail: "Login realizado" },
    });

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Erro interno ao entrar." }, { status: 500 });
  }
}
