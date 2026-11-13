import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  const where: any = {};
  if (productId) {
    where.productId = productId;
    // verify ownership
    const product = await db.infoproduct.findFirst({
      where: { id: productId, userId: user.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }
  } else {
    where.product = { userId: user.id };
  }

  const sales = await db.productSale.findMany({
    where,
    include: { product: { select: { id: true, title: true, price: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, amount, quantity, note } = body;

    if (!productId || !amount) {
      return NextResponse.json({ error: "Produto e valor sao obrigatorios." }, { status: 400 });
    }

    const product = await db.infoproduct.findFirst({
      where: { id: productId, userId: user.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }

    const sale = await db.productSale.create({
      data: {
        productId,
        amount: Number(amount),
        quantity: Number(quantity) || 1,
        note: String(note ?? ""),
      },
      include: { product: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }
}
