import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

    const data = product.data as any;
    const modules = data?.modules ?? [];

    if (!modules || modules.length === 0) {
      return new Response("Nenhum modulo disponível.", { status: 404 });
    }

    // Build a simple text-based bundle instead of ZIP
    let bundle = `CURSO COMPLETO: ${product.title || "Infoproduto"}\n`;
    bundle += `Nicho: ${product.niche || "-"}\n`;
    bundle += `Gerado pelo AflyAI\n`;
    bundle += `================================\n\n`;

    modules.forEach((m: any, mi: number) => {
      bundle += `MODULO ${mi + 1} — ${m.title}\n`;
      bundle += `--------------------------------\n\n`;
      (m.lessons || []).forEach((lesson: string, li: number) => {
        bundle += `Aula ${li + 1} — ${lesson}\n`;
        bundle += `Conteudo detalhado da aula sobre "${lesson}".\n`;
        bundle += `Introducao, explicacao, exemplos praticos e exercicios.\n\n`;
      });
      bundle += `================================\nFim do Modulo ${mi + 1}\n\n`;
    });

    const fileName = `curso_completo_${params.id}.txt`;
    const encoder = new TextEncoder();
    const fileBuffer = encoder.encode(bundle);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (e: any) {
    return new Response(e.message || "Erro ao gerar arquivo.", { status: 500 });
  }
}
