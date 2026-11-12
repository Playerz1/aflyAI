import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const metrics = await db.metric.findMany({
    where: { userId: user.id },
    orderBy: { day: "asc" },
    take: 30,
  });
  return NextResponse.json({ metrics });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await req.json();
    const label = String(body.label ?? "").trim();
    const value = Number(body.value);
    if (!label) return NextResponse.json({ error: "Rótulo obrigatório." }, { status: 400 });
    if (Number.isNaN(value)) return NextResponse.json({ error: "Valor numérico inválido." }, { status: 400 });

    const metric = await db.metric.create({
      data: {
        userId: user.id,
        label,
        value,
        unit: body.unit ? String(body.unit) : null,
        day: new Date(),
      },
    });
    return NextResponse.json({ metric });
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
}
