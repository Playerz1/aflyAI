import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
