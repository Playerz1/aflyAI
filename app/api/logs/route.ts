import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const logs = await db.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await req.json();
    const action = String(body.action ?? "").trim();
    if (!action) return NextResponse.json({ error: "Ação obrigatória." }, { status: 400 });

    const log = await db.activityLog.create({
      data: { userId: user.id, action, detail: body.detail ? String(body.detail) : null },
    });
    return NextResponse.json({ log });
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
}
