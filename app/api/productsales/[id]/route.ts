import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const sale = await db.productSale.findFirst({
      where: { id: params.id },
      include: { product: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Venda nao encontrada." }, { status: 404 });
    }

    if (sale.product.userId !== user.id) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.productSale.update({
      where: { id: params.id },
      data: {
        ...(body.productId !== undefined && { productId: String(body.productId) }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
        ...(body.note !== undefined && { note: String(body.note) }),
      },
      include: { product: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ sale: updated });
  } catch {
    return NextResponse.json({ error: "Payload invalido ou nao encontrado." }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const sale = await db.productSale.findFirst({
      where: { id: params.id },
      include: { product: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Venda nao encontrada." }, { status: 404 });
    }

    if (sale.product.userId !== user.id) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }

    await db.productSale.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel excluir." }, { status: 400 });
  }
}
