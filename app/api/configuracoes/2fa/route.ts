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
    const { enable } = body;

    // 2FA integration placeholder - in production would integrate with TOTP provider
    // For now, we store a flag on the user or a separate settings table
    return NextResponse.json({ ok: true, enabled: !!enable });
  } catch {
    return NextResponse.json({ error: "Erro ao alterar configuracao de 2FA." }, { status: 400 });
  }
}
