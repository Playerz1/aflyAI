import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "uploads", "pdfs");

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Nao autenticado.", { status: 401 });
  }

  try {
    const product = await db.infoproduct.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!product) {
      return new Response("Produto nao encontrado.", { status: 404 });
    }

    const fileName = `infoproduto_${params.id}.pdf`;
    const filePath = join(UPLOAD_DIR, fileName);

    if (!existsSync(filePath)) {
      return new Response("PDF nao gerado ainda. Gere o PDF primeiro.", { status: 404 });
    }

    const fileBuffer = readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return new Response("Erro ao baixar PDF.", { status: 500 });
  }
}
