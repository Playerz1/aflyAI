import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PDFDocument from "pdfkit";
import { join } from "path";
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "uploads", "pdfs");

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const product = await db.infoproduct.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }

    const data = product.data as any;
    const productInfo = data?.product ?? {};
    const modules = data?.modules ?? [];
    const format = product.format;
    const price = product.price;
    const niche = product.niche;

    ensureUploadDir();

    const fileName = `infoproduto_${params.id}.pdf`;
    const filePath = join(UPLOAD_DIR, fileName);

    const doc = new PDFDocument({ size: "A4", margin: 60 });
    doc.pipe(require("fs").createWriteStream(filePath));

    const redColor = "#B8202E";

    // Capa
    doc.fillColor(redColor).rect(0, 0, doc.page.width, 120).fill();
    doc.fillColor("#FFFFFF").fontSize(40).text(productInfo.name || "Meu Infoproduto", 60, 40, { align: "left" });
    doc.fillColor("#A1A1AA").fontSize(18).text("Infoproduto gerado pelo AflyAI", 60, 100);
    doc.fillColor(redColor).rect(0, doc.page.height - 120, doc.page.width, 120).fill();
    doc.fillColor("#FFFFFF").fontSize(14).text(`Nicho: ${niche || "-"}`, 60, doc.page.height - 90);
    doc.text(`Preco: ${price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : "-"}`, 60, doc.page.height - 70);
    doc.text(`Formato: ${format === "MODULES" ? "Modulos e aulas" : "PDF completo"}`, 60, doc.page.height - 50);
    doc.addPage();

    // Sumario / introducao
    doc.fillColor("#F5F5F5").fontSize(24).text("Conteudo", { align: "left" });
    doc.fillColor("#A1A1AA").fontSize(12).moveDown().text("Este material foi organizado para oferecer um guia completo sobre o tema escolhido.");
    doc.moveDown();

    if (format === "MODULES" && modules.length > 0) {
      modules.forEach((m: any, mi: number) => {
        doc.fillColor(redColor).fontSize(16).text(`Modulo ${mi + 1} — ${m.title}`);
        doc.fillColor("#F5F5F5").fontSize(12).moveDown().text(`Este modulo contem ${m.lessons?.length || 0} aulas.`);
        doc.moveDown();

        (m.lessons || []).forEach((lesson: string, li: number) => {
          doc.fillColor("#A1A1AA").fontSize(13).text(`Aula ${li + 1} — ${lesson}`);
          doc.fillColor("#F5F5F5").fontSize(11).text("Conteudo da aula desenvolvido com explicacao detalhada, exemplos praticos e exercicios para fixacao do aprendizado.");
          doc.moveDown();
        });
        doc.addPage();
      });
    } else {
      doc.fillColor("#A1A1AA").fontSize(12).moveDown().text(productInfo.description || "Conteudo completo organizado em guia digital.");
      doc.moveDown();
      doc.fillColor("#A1A1AA").fontSize(12).text("Este guia apresenta os principais conceitos, estrategias e praticas do nicho selecionado.");
      doc.addPage();
    }

    // Conclusao
    doc.fillColor(redColor).fontSize(20).text("Conclusao");
    doc.fillColor("#F5F5F5").fontSize(12).moveDown().text("Parabens por completar este material. Voce agora possui o conhecimento necessario para aplicar os conceitos aprendidos.");
    doc.moveDown();
    doc.fillColor("#A1A1AA").fontSize(10).text("Gerado pelo AflyAI - Sistema de Criacao de Infoprodutos");

    doc.end();

    // Wait for write to complete
    await new Promise<void>((resolve, reject) => {
      const stream = require("fs").createWriteStream(filePath);
      // doc already piped, just wait for finish
      doc.on("end", () => resolve());
      doc.on("error", reject);
    });

    // Save pdfUrl to product
    await db.infoproduct.update({
      where: { id: params.id },
      data: { pdfUrl: `/api/infoproducts/${params.id}/pdf/download` },
    });

    return NextResponse.json({ ok: true, pdfUrl: `/api/infoproducts/${params.id}/pdf/download` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro ao gerar PDF." }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // Redirect to download endpoint
  return NextResponse.redirect(new URL(`/api/infoproducts/${params.id}/pdf/download`, _req.url));
}
