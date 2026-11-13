"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NICHES, CATEGORIES, NICHE_METHODOLOGY, type Niche } from "@/lib/niches";
import Step1Niche from "./InfoprodutoWizard/Step1Niche";
import Step2Product from "./InfoprodutoWizard/Step2Product";
import Step3Prompts from "./InfoprodutoWizard/Step3Prompts";
import Step4Facebook from "./InfoprodutoWizard/Step4Facebook";

type Step = 1 | 2 | 3 | 4;

type NicheData = {
  id: string;
  name: string;
  category: string;
  demand: number;
  offer: number;
  competition: number;
  oppIndex: number;
  oppLevel: string;
};

type ProductData = {
  name: string;
  description: string;
  gatewayName: string;
  shortDescription: string;
  fullDescription: string;
  includes: string;
  targetAudience: string;
  benefits: string;
  contentDelivered: string;
  guarantee: string;
};

type PriceSuggestion = {
  label: string;
  value: number;
  position: string;
};

type ModuleData = {
  title: string;
  lessons: string[];
};

type ApproachData = {
  title: string;
  type: string;
  text: string;
};

type Draft = {
  step: Step;
  niche: NicheData | null;
  product: ProductData;
  price: number | null;
  priceSuggestions: PriceSuggestion[];
  format: "PDF" | "MODULES" | null;
  modules: ModuleData[];
  prompt: string;
  facebookSearches: string[];
  approaches: ApproachData[];
};

const INITIAL_DRAFT: Draft = {
  step: 1,
  niche: null,
  product: {
    name: "",
    description: "",
    gatewayName: "",
    shortDescription: "",
    fullDescription: "",
    includes: "",
    targetAudience: "",
    benefits: "",
    contentDelivered: "",
    guarantee: "",
  },
  price: null,
  priceSuggestions: [],
  format: null,
  modules: [],
  prompt: "",
  facebookSearches: [],
  approaches: [],
};

const DEFAULT_MODULES: ModuleData[] = [
  { title: "Introducao", lessons: ["Primeiros passos", "Conceitos fundamentais"] },
  { title: "Desenvolvimento", lessons: ["Aplicacao pratica", "Estrategias avancadas"] },
  { title: "Conclusao", lessons: ["Proximos passos", "Checklist final"] },
];

const STEP_LABELS: Record<Step, string> = {
  1: "Escolher nicho",
  2: "Configurar produto",
  3: "Prompts da pagina",
  4: "Divulgacao Facebook",
};

const STEP_TITLES: Record<Step, string> = {
  1: "Escolha o seu nicho",
  2: "Configure o infoproduto",
  3: "Gerador de prompts",
  4: "Grupos e abordagens",
};

function getStorageKey(userId: string) {
  return `afly_infoproduto_draft_${userId}`;
}

function loadDraftFromLocal(userId: string): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    return { ...INITIAL_DRAFT, ...parsed };
  } catch {
    return null;
  }
}

function saveDraftToLocal(userId: string, draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export default function InfoprodutoWizard({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    loadDraftFromLocal(userId) ?? INITIAL_DRAFT
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbId, setDbId] = useState<string | null>(null);
  const localRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDraft = useCallback((updater: (d: Draft) => Draft) => {
    setDraft((prev) => {
      const next = updater(prev);
      if (localRef.current) clearTimeout(localRef.current);
      localRef.current = setTimeout(() => saveDraftToLocal(userId, next), 300);
      return next;
    });
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    if (!dbId && draft.niche) {
      saveDraftToLocal(userId, draft);
    }
  }, [open, userId, draft, dbId]);

  async function saveToDb() {
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        title: draft.product.name || "Meu infoproduto",
        niche: draft.niche?.name ?? "",
        nicheData: draft.niche
          ? {
              demand: draft.niche.demand,
              offer: draft.niche.offer,
              competition: draft.niche.competition,
            }
          : {},
        price: draft.price,
        format: draft.format,
        description: draft.product.description,
        currentStep: draft.step,
        data: {
          product: draft.product,
          priceSuggestions: draft.priceSuggestions,
          modules: draft.modules,
          prompt: draft.prompt,
          facebookSearches: draft.facebookSearches,
          approaches: draft.approaches,
        },
      };

      let res: Response;
      if (dbId) {
        res = await fetch(`/api/infoproducts/${dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/infoproducts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Erro ao salvar no banco.");
      const data = await res.json();
      if (data.product && data.product.id && !dbId) {
        setDbId(data.product.id);
      }
    } catch (e: any) {
      setError(e.message || "Erro ao salvar progresso.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDraft() {
    if (!dbId) return;
    setSaving(true);
    try {
      await fetch(`/api/infoproducts/${dbId}`, { method: "DELETE" });
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setDbId(null);
    }
  }

  function canAdvance(): boolean {
    if (draft.step === 1) return !!draft.niche;
    if (draft.step === 2) {
      return !!draft.product.name && draft.price !== null && !!draft.format;
    }
    if (draft.step === 3) return !!draft.prompt;
    return true;
  }

  function advance() {
    if (!canAdvance()) return;
    saveToDb();
    if (draft.step < 4) {
      setDraft((prev) => ({ ...prev, step: (prev.step + 1) as Step }));
    }
  }

  function goBack() {
    if (draft.step > 1) {
      saveToDb();
      setDraft((prev) => ({ ...prev, step: (prev.step - 1) as Step }));
    }
  }

  function handleClose() {
    onClose();
  }

  if (!open) return null;

  const step = draft.step;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card fade-up"
        style={{
          maxWidth: 980,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wizard-header">
          <div className="wizard-steps">
            <div className={`wizard-step ${step >= 1 ? "done" : ""} ${step === 1 ? "active" : ""}`}>
              <span className="step-num">1</span>
              <span>{STEP_LABELS[1]}</span>
            </div>
            <div className="wizard-connector" />
            <div className={`wizard-step ${step >= 2 ? "done" : ""} ${step === 2 ? "active" : ""}`}>
              <span className="step-num">2</span>
              <span>{STEP_LABELS[2]}</span>
            </div>
            <div className="wizard-connector" />
            <div className={`wizard-step ${step >= 3 ? "done" : ""} ${step === 3 ? "active" : ""}`}>
              <span className="step-num">3</span>
              <span>{STEP_LABELS[3]}</span>
            </div>
            <div className="wizard-connector" />
            <div className={`wizard-step ${step >= 4 ? "done" : ""} ${step === 4 ? "active" : ""}`}>
              <span className="step-num">4</span>
              <span>{STEP_LABELS[4]}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={handleClose} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="wizard-body">
          <section>
            <div className="section-head">
              <span className="section-kicker">Etapa {step} de 4</span>
              <h2>{STEP_TITLES[step]}</h2>
              <p>
                {step === 1
                  ? "Selecione o nicho do seu infoproduto. Os percentuais sao estimativas iniciais direcionais."
                  : step === 2
                  ? "Defina nome, descricao, preco e formato de entrega do seu produto."
                  : step === 3
                  ? "Gere prompts completos para construir sua pagina de vendas."
                  : "Encontre grupos do seu nicho e prepare abordagens de divulgacao."}
              </p>
            </div>

            {step === 1 && (
              <Step1Niche
                niche={draft.niche}
                onSelect={(niche) =>
                  updateDraft((d) => ({ ...d, niche, step: 2 }))
                }
              />
            )}
            {step === 2 && (
              <Step2Product
                dbId={dbId}
                niche={draft.niche}
                product={draft.product}
                price={draft.price}
                priceSuggestions={draft.priceSuggestions}
                format={draft.format}
                modules={draft.modules}
                onProductChange={(product) =>
                  updateDraft((d) => ({ ...d, product }))
                }
                onPriceChange={(price) =>
                  updateDraft((d) => ({ ...d, price }))
                }
                onFormatChange={(format) => {
                  updateDraft((d) => {
                    const next = { ...d, format };
                    if (format === "MODULES" && d.modules.length === 0) {
                      next.modules = DEFAULT_MODULES;
                    }
                    return next;
                  });
                }}
                onModulesChange={(modules) =>
                  updateDraft((d) => ({ ...d, modules }))
                }
                onGenerateSuggestions={() => {
                  updateDraft((d) => ({
                    ...d,
                    priceSuggestions: generatePriceSuggestions(d.niche?.name, d.product.name, d.price),
                  }));
                }}
                onReset={() => {
                  updateDraft((d) => ({
                    ...d,
                    product: INITIAL_DRAFT.product,
                    priceSuggestions: [],
                  }));
                }}
              />
            )}
            {step === 3 && (
              <Step3Prompts
                niche={draft.niche}
                product={draft.product}
                price={draft.price}
                format={draft.format}
                modules={draft.modules}
                prompt={draft.prompt}
                onPromptChange={(prompt) =>
                  updateDraft((d) => ({ ...d, prompt, step: 4 }))
                }
                onRegenerate={() => {
                  updateDraft((d) => ({
                    ...d,
                    prompt: buildPrompt(d.niche, d.product, d.price, d.format, d.modules),
                  }));
                }}
              />
            )}
            {step === 4 && (
              <Step4Facebook
                niche={draft.niche}
                product={draft.product}
                price={draft.price}
                searches={draft.facebookSearches}
                approaches={draft.approaches}
                onSearchesChange={(searches) =>
                  updateDraft((d) => ({ ...d, facebookSearches: searches }))
                }
                onApproachesChange={(approaches) =>
                  updateDraft((d) => ({ ...d, approaches }))
                }
                onGenerateApproaches={() => {
                  updateDraft((d) => ({
                    ...d,
                    approaches: buildApproaches(d.niche, d.product, d.price),
                  }));
                }}
              />
            )}
          </section>
        </div>

        <div className="wizard-footer">
          <div className="footer-note">
            {error ? (
              <span style={{ color: "#ff6b71" }}>{error}</span>
            ) : draft.niche ? (
              <span>Progresso salvo automaticamente. Dados sao seus e ficam no seu perfil.</span>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {step > 1 && (
              <button className="btn" onClick={goBack} disabled={saving}>
                Voltar
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={advance}
              disabled={!canAdvance() || saving}
            >
              {step === 4 ? "Concluir" : "Avancar etapa ->"}
            </button>
            <button className="btn" onClick={saveToDb} disabled={saving}>
              Salvar progresso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generatePriceSuggestions(
  niche: string | null | undefined,
  productName: string | null,
  currentPrice: number | null
): PriceSuggestion[] {
  const base = currentPrice && currentPrice > 0 ? currentPrice : 97;
  const low = Math.round(base * 0.6);
  const mid = Math.round(base);
  const high = Math.round(base * 1.6);
  return [
    {
      label: "Acesso popular",
      value: low,
      position: "Preco de entrada para volume de vendas.",
    },
    {
      label: "Padrao de mercado",
      value: mid,
      position: "Preco equilibrado entre valor percebido e conversao.",
    },
    {
      label: "Posicionamento premium",
      value: high,
      position: "Preco acima da media para publico segmentado.",
    },
  ];
}

function buildPrompt(
  niche: NicheData | null,
  product: ProductData,
  price: number | null,
  format: "PDF" | "MODULES" | null,
  modules: ModuleData[]
): string {
  const priceStr = price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : "<cole aqui o preco>";
  const fmtLabel = format === "MODULES" ? "Modulos e aulas" : "PDF completo";
  const modList = modules.length
    ? modules.map((m, i) => `Modulo ${i + 1} - ${m.title}\n` + m.lessons.map((l, j) => `  Aula ${j + 1} - ${l}`).join("\n")).join("\n\n")
    : "Conteudo organizado em guia digital completo.";

  return `Crie uma pagina de vendas profissional e completa para o seguinte infoproduto:

INFOPRODUTO
- Nicho: ${niche?.name ?? "Nao definido"}
- Nome do produto: ${product.name || "<cole aqui o nome do produto>"}
- Descricao: ${product.description || "<cole aqui a descricao>"}
- Publico-alvo: ${product.targetAudience || "<cole aqui o publico-alvo>"}
- Beneficios: ${product.benefits || "<cole aqui os beneficios>"}
- O que esta incluso: ${product.includes || "<cole aqui o que esta incluso>"}
- Conteudo entregue: ${product.contentDelivered || "<cole aqui o conteudo entregue>"}
- Garantia: ${product.guarantee || "<cole aqui a garantia>"}
- Preco: ${priceStr}
- Formato de entrega: ${fmtLabel}
- Conteudo detalhado:
${modList}

ESTRUTURA OBRIGATORIA DA PAGINA DE VENDAS
A pagina deve conter, nesta ordem:

1. Identidade visual profissional (cores, tipografia, espacamento, elementos visuais alinhados ao nicho ${niche?.name ?? ""}).
2. Headline persuasiva, direta e focada no beneficio principal.
3. Subheadline complementar que reforca a promessa da headline.
4. Apresentacao do problema (dor do publico do nicho ${niche?.name ?? ""}).
5. Apresentacao da solucao (o infoproduto como resposta ao problema).
6. Beneficios do produto (lista com ganhos reais para o comprador).
7. O que o comprador vai receber (entrega imediata, formato, acesso).
8. Demonstrativa dos modulos ou conteudo do PDF:
${modList}
9. Demonstrativa do valor da oferta (comparacao custo x beneficio).
10. Preco e condicoes (${priceStr}, formas de pagamento).
11. Garantia, se aplicavel (${product.guarantee || "nao informada"}).
12. Perguntas frequentes (FAQ com pelo menos 7 perguntas e respostas).
13. Botoes de compra (CTA visiveis, diretos e destacados).
14. Secao final de conversao (ultimo chamado a acao antes do rodape).
15. Versao totalmente responsiva para celular (mobile-first, menus, botoes e formularios adaptados).

REGRAS IMPORTANTES:
- Todo o texto deve ser personalizado para o nicho ${niche?.name ?? ""} e para o produto "${product.name || ""}". Nao use textos genericos.
- O link do checkout deve ser inserido exatamente neste marcador:
<cole aqui o link do checkout do gateway>
- Instrua o construtor de sites a colocar esse link em TODOS os botoes de compra da pagina.
- Nao invente depoimentos nem promessas de resultados garantidos.
- Mantenha tom profissional, persuasivo e honesto.
- A pagina deve ser otimizada para conversao e leitura rapida.

Entregue o prompt completo pronto para ser copiado e usado em um construtor de paginas ou Agent de IA.`;
}

function buildApproaches(
  niche: NicheData | null,
  product: ProductData,
  price: number | null
): ApproachData[] {
  const name = product.name || "meu infoproduto";
  const nicheName = niche?.name ?? "seu nicho";
  const priceStr = price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : "";
  const link = "<cole aqui o link da pagina>";

  return [
    {
      title: "Abordagem Direta",
      type: "direta",
      text: `Oi, tudo bem?

Estou divulgando um produto que pode ajudar quem atua no nicho de ${nicheName}. Chama-se "${name}" e foi desenvolvido para ${product.targetAudience || "quem quer aprender mais sobre o assunto"}.

Nele voce encontra: ${product.contentDelivered || "conteudo completo e organizado"}.

Preco: ${priceStr}.

A pagina completa esta aqui: ${link}

Qualquer duvida, e so chamar.`,
    },
    {
      title: "Abordagem de Curiosidade",
      type: "curiosidade",
      text: `Voce sabe qual eh o erro mais comum de quem comeca no ${nicheName}?

Muitas pessoas tentam fazer sozinhas, sem um metodo, e acabam desistindo no meio do caminho.

Foi pensando nisso que criei o "${name}", um material que ${product.description || "ensina o caminho mais curto"}.

Quer saber mais? Acesse: ${link}

Nao eh promessa de resultado, eh um guia pratico para quem quer aprender.`,
    },
    {
      title: "Abordagem Conversacional",
      type: "conversacional",
      text: `Oi pessoal! Vi algumas conversas aqui sobre ${nicheName} e queria compartilhar algo que ando usando.

Montei um infoproduto chamado "${name}" que reune ${product.includes || "o essencial"} sobre o tema. Nao sou especialista, so organizei o que me ajudou e pode ajudar quem esta comecando.

Se quiser conferir: ${link}

Preco: ${priceStr}.

Abs!`,
    },
    {
      title: "Abordagem Educativa",
      type: "educativa",
      text: `Dica rapida para quem atua com ${nicheName}: ${product.benefits || "comece organizando o conteudo antes de criar o produto"}.

Isso faz diferenca na hora de entregar valor para o cliente.

Se voce quiser aprofundar, criei o "${name}", que cobre ${product.contentDelivered || "os principais topicos do nicho"}.

Pagina com mais detalhes: ${link}

Preco: ${priceStr}.

Espero que ajude!`,
    },
    {
      title: "Abordagem Problema e Solucao",
      type: "problema-solucao",
      text: `Muitas pessoas enfrentam dificuldade com ${product.targetAudience || "aprender"} no nicho de ${nicheName}. O problema mais comum eh nao ter um passo a passo claro.

Uma forma de lidar com isso eh seguir um metodo estruturado, com conteudos organizados e objetivos claros.

Foi exatamente por isso que desenvolvi o "${name}": ${product.description || "um guia pratico para quem quer superar essa dificuldade"}.

Conheca a pagina: ${link}

Preco: ${priceStr}.

Nao eh garantia de resultado, eh um recurso complementar para seus estudos.`,
    },
  ];
}
