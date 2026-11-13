import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const products = await db.infoproduct.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const product = await db.infoproduct.create({
      data: {
        userId: user.id,
        title: String(body.title ?? "").trim() || "Meu infoproduto",
        niche: String(body.niche ?? ""),
        nicheData: body.nicheData ?? {},
        price: body.price ? Number(body.price) : null,
        format: body.format ?? null,
        description: String(body.description ?? ""),
        currentStep: Number(body.currentStep ?? 1),
        data: body.data ?? {},
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }
}
