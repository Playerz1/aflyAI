"use client";

import { useCallback, useState } from "react";
import type { ModuleData } from "./Step2Product";

type Props = {
  niche: any;
  product: any;
  price: number | null;
  format: "PDF" | "MODULES" | null;
  modules: ModuleData[];
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onRegenerate: () => void;
};

export default function Step3Prompts({
  niche,
  product,
  price,
  format,
  modules,
  prompt,
  onPromptChange,
  onRegenerate,
}: Props) {
  const [copied, setCopied] = useState(false);

  const priceStr = price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : "<cole aqui o preco>";
  const fmtLabel = format === "MODULES" ? "Modulos e aulas" : "PDF completo";
  const modList = modules.length
    ? modules.map((m, i) => `Modulo ${i + 1} - ${m.title}\n` + m.lessons.map((l, j) => `  Aula ${j + 1} - ${l}`).join("\n")).join("\n\n")
    : "Conteudo organizado em guia digital completo.";

  const fullPrompt = prompt || buildPrompt();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>
        Gerador de prompts da pagina de vendas
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 10, lineHeight: 1.5 }}>
        Prompt personalizado para o seu infoproduto. Copie e cole em um construtor de sites ou Agent de IA.
      </div>

      <div className="prompt-toolbar">
        <button className="copy-btn primary" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar prompt"}
        </button>
        <button className="copy-btn" onClick={onRegenerate}>Gerar novamente</button>
      </div>

      <div className="prompt-area">
        <div className="prompt-head">
          <h3>Prompt da pagina de vendas</h3>
        </div>
        <textarea
          className="prompt-textarea"
          value={fullPrompt}
          readOnly
          spellCheck={false}
        />
      </div>

      <div className="prompt-note">
        O prompt inclui o marcador <code style={{ color: "var(--red)", background: "rgba(229,9,20,0.15)", padding: "2px 6px", borderRadius: 4 }}>&lt;cole aqui o link do checkout do gateway&gt;</code>. Substitua pelo link real do seu gateway de pagamento em todos os botoes de compra.
      </div>
    </div>
  );

  function buildPrompt(): string {
    const nicheName = niche?.name ?? "Nao definido";
    const productName = product.name || "<cole aqui o nome do produto>";
    const productDesc = product.description || "<cole aqui a descricao>";
    const target = product.targetAudience || "<cole aqui o publico-alvo>";
    const benefits = product.benefits || "<cole aqui os beneficios>";
    const includes = product.includes || "<cole aqui o que esta incluso>";
    const contentDelivered = product.contentDelivered || "<cole aqui o conteudo entregue>";
    const guarantee = product.guarantee || "<cole aqui a garantia>";

    return `Crie uma pagina de vendas profissional e completa para o seguinte infoproduto:

INFOPRODUTO
- Nicho: ${nicheName}
- Nome do produto: ${productName}
- Descricao: ${productDesc}
- Publico-alvo: ${target}
- Beneficios: ${benefits}
- O que esta incluso: ${includes}
- Conteudo entregue: ${contentDelivered}
- Garantia: ${guarantee}
- Preco: ${priceStr}
- Formato de entrega: ${fmtLabel}
- Conteudo detalhado:
${modList}

ESTRUTURA OBRIGATORIA DA PAGINA DE VENDAS
A pagina deve conter, nesta ordem:

1. Identidade visual profissional (cores, tipografia, espacamento, elementos visuais alinhados ao nicho ${nicheName}).
2. Headline persuasiva, direta e focada no beneficio principal.
3. Subheadline complementar que reforca a promessa da headline.
4. Apresentacao do problema (dor do publico do nicho ${nicheName}).
5. Apresentacao da solucao (o infoproduto como resposta ao problema).
6. Beneficios do produto (lista com ganhos reais para o comprador).
7. O que o comprador vai receber (entrega imediata, formato, acesso).
8. Demonstrativa dos modulos ou conteudo do PDF:
${modList}
9. Demonstrativa do valor da oferta (comparacao custo x beneficio).
10. Preco e condicoes (${priceStr}, formas de pagamento).
11. Garantia, se aplicavel (${guarantee}).
12. Perguntas frequentes (FAQ com pelo menos 7 perguntas e respostas).
13. Botoes de compra (CTA visiveis, diretos e destacados).
14. Secao final de conversao (ultimo chamado a acao antes do rodape).
15. Versao totalmente responsiva para celular (mobile-first, menus, botoes e formularios adaptados).

REGRAS IMPORTANTES:
- Todo o texto deve ser personalizado para o nicho ${nicheName} e para o produto "${productName}". Nao use textos genericos.
- O link do checkout deve ser inserido exatamente neste marcador:
<cole aqui o link do checkout do gateway>
- Instrua o construtor de sites a colocar esse link em TODOS os botoes de compra da pagina.
- Nao invente depoimentos nem promessas de resultados garantidos.
- Mantenha tom profissional, persuasivo e honesto.
- A pagina deve ser otimizada para conversao e leitura rapida.

Entregue o prompt completo pronto para ser copiado e usado em um construtor de paginas ou Agent de IA.`;
  }
}
