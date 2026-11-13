import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, profilePicture } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name);
    if (email !== undefined) updateData.email = String(email);
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture ?? null;

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar perfil." }, { status: 400 });
  }
}
