import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const product = await db.infoproduct.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const product = await db.infoproduct.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: String(body.title) }),
        ...(body.niche !== undefined && { niche: String(body.niche) }),
        ...(body.nicheData !== undefined && { nicheData: body.nicheData }),
        ...(body.price !== undefined && { price: body.price ? Number(body.price) : null }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.description !== undefined && { description: String(body.description) }),
        ...(body.currentStep !== undefined && { currentStep: Number(body.currentStep) }),
        ...(body.data !== undefined && { data: body.data }),
      },
    });

    return NextResponse.json({ product });
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
    await db.infoproduct.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel excluir." }, { status: 400 });
  }
}
