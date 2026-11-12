import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const sales = await db.sale.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim() || "Venda";
    const amount = Number(body.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    const sale = await db.sale.create({
      data: { userId: user.id, title, amount },
    });
    return NextResponse.json({ sale });
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
}
