import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import JSZip from "jszip";
import PDFDocument from "pdfkit";

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

    const zip = new JSZip();

    zip.file("README.txt", `Curso Completo: ${product.title || "Infoproduto"}\nNicho: ${product.niche || "-"}\nGerado pelo AflyAI\n`);

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const pdfBuffer = await generateModulePdfBuffer(m, i + 1, product);
      zip.file(`Modulo_${i + 1}_${(m.title || "Modulo").replace(/\s+/g, "_")}.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    const zipFileName = `curso_${(product.title || "infoproduto").replace(/\s+/g, "_")}_${params.id}.zip`;

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (e: any) {
    return new Response(e.message || "Erro ao gerar arquivo.", { status: 500 });
  }
}

function generateModulePdfBuffer(module: any, index: number, product: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 60 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const redColor = "#B8202E";

    doc.fillColor(redColor).rect(0, 0, doc.page.width, 100).fill();
    doc.fillColor("#FFFFFF").fontSize(24).text(`Modulo ${index}`, 60, 40);
    doc.fillColor("#FFFFFF").fontSize(16).text(module.title || `Modulo ${index}`, 60, 80);
    doc.fillColor(redColor).rect(0, doc.page.height - 80, doc.page.width, 80).fill();
    doc.addPage();

    doc.fillColor("#F5F5F5").fontSize(16).text("Conteudo do Modulo", { align: "left" });
    doc.moveDown();

    (module.lessons || []).forEach((lesson: string, li: number) => {
      doc.fillColor(redColor).fontSize(14).text(`Aula ${li + 1} — ${lesson}`);
      doc.fillColor("#F5F5F5").fontSize(11).text("Conteudo da aula desenvolvido com explicacao detalhada, exemplos praticos e exercicios para fixacao do aprendizado.");
      doc.moveDown();
    });

    doc.fillColor("#A1A1AA").fontSize(10).text("Gerado pelo AflyAI - Sistema de Criacao de Infoprodutos");
    doc.end();
  });
}
