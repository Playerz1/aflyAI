"use client";

import { useCallback, useMemo, useState } from "react";

export type PriceSuggestion = {
  label: string;
  value: number;
  position: string;
};

export type ModuleData = {
  title: string;
  lessons: string[];
};

type Props = {
  niche: any;
  product: any;
  price: number | null;
  priceSuggestions: PriceSuggestion[];
  format: "PDF" | "MODULES" | null;
  modules: ModuleData[];
  onProductChange: (product: any) => void;
  onPriceChange: (price: number | null) => void;
  onFormatChange: (format: "PDF" | "MODULES") => void;
  onModulesChange: (modules: ModuleData[]) => void;
  onGenerateSuggestions: () => void;
  onReset: () => void;
};

const DEFAULT_MODULES: ModuleData[] = [
  { title: "Introducao", lessons: ["Primeiros passos", "Conceitos fundamentais"] },
  { title: "Desenvolvimento", lessons: ["Aplicacao pratica", "Estrategias avancadas"] },
  { title: "Conclusao", lessons: ["Proximos passos", "Checklist final"] },
];

export default function Step2Product({
  niche,
  product,
  price,
  priceSuggestions,
  format,
  modules,
  onProductChange,
  onPriceChange,
  onFormatChange,
  onModulesChange,
  onGenerateSuggestions,
  onReset,
}: Props) {
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [descSuggestions, setDescSuggestions] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const nicheName = niche?.name ?? "este nicho";

  const nameSugg = useMemo(() => {
    if (nameSuggestions.length) return nameSuggestions;
    const base = product.name || `Guia Completo de ${nicheName}`;
    return [
      base,
      `${nicheName}: Do Zero ao Avancado`,
      `MasterClass ${nicheName}`,
      `${nicheName} para Iniciantes`,
      `O Metodo Definitivo de ${nicheName}`,
    ];
  }, [nameSuggestions, product.name, nicheName]);

  const descSugg = useMemo(() => {
    if (descSuggestions.length) return descSuggestions;
    return [
      `Descubra tudo o que voce precisa saber sobre ${nicheName}. Este material foi criado para ${product.targetAudience || "quem deseja aprender"} de forma pratica e direta.`,
      `Um guia completo e passo a passo sobre ${nicheName}, com conteudos organizados para voce aplicar imediatamente.`,
      `Tudo sobre ${nicheName} reunido em um unico infoproduto, pensado para quem quer resultados reais.`,
    ];
  }, [descSuggestions, product.targetAudience, nicheName]);

  const fmtLabel = format === "MODULES" ? "Modulos e aulas" : "PDF completo";

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onProductChange({ ...product, name: e.target.value });
    setEditingName(false);
  }, [product, onProductChange]);

  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onProductChange({ ...product, description: e.target.value });
    setEditingDesc(false);
  }, [product, onProductChange]);

  const useName = useCallback((name: string) => {
    onProductChange({ ...product, name });
    setEditingName(false);
  }, [product, onProductChange]);

  const useDesc = useCallback((desc: string) => {
    onProductChange({ ...product, description: desc });
    setEditingDesc(false);
  }, [product, onProductChange]);

  const generateNames = useCallback(() => {
    const base = nicheName;
    setNameSuggestions([
      `Guia Completo de ${base}`,
      `${base}: Do Zero ao Avancado`,
      `MasterClass ${base}`,
      `${base} para Iniciantes`,
      `O Metodo Definitivo de ${base}`,
      `${base} Passo a Passo`,
      `Segredos de ${base}`,
      `${base} na Pratica`,
    ]);
  }, [nicheName]);

  const generateDescs = useCallback(() => {
    setDescSuggestions([
      `Descubra tudo o que voce precisa saber sobre ${nicheName}. Este material foi criado para quem deseja aprender de forma pratica e direta.`,
      `Um guia completo e passo a passo sobre ${nicheName}, com conteudos organizados para aplicacao imediata.`,
      `Tudo sobre ${nicheName} reunido em um unico infoproduto, pensado para quem busca resultados reais.`,
      `O caminho mais curto para dominar ${nicheName}, com exemplos e exercicios.`,
    ]);
  }, [nicheName]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value.replace(",", "."));
    onPriceChange(Number.isNaN(v) || v < 0 ? null : v);
  }, [onPriceChange]);

  const selectPrice = useCallback((v: number) => {
    onPriceChange(v);
  }, [onPriceChange]);

  const addModule = useCallback(() => {
    onModulesChange([...modules, { title: "Novo modulo", lessons: ["Nova aula"] }]);
  }, [modules, onModulesChange]);

  const updateModuleTitle = useCallback((idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const next = [...modules];
    next[idx].title = e.target.value;
    onModulesChange(next);
  }, [modules, onModulesChange]);

  const addLesson = useCallback((midx: number) => {
    const next = modules.map((m, i) => (i === midx ? { ...m, lessons: [...m.lessons, "Nova aula"] } : m));
    onModulesChange(next);
  }, [modules, onModulesChange]);

  const removeLesson = useCallback((midx: number, lidx: number) => {
    const next = modules.map((m, i) =>
      i === midx ? { ...m, lessons: m.lessons.filter((_, l) => l !== lidx) } : m
    );
    onModulesChange(next);
  }, [onModulesChange]);

  const removeModule = useCallback((idx: number) => {
    onModulesChange(modules.filter((_, i) => i !== idx));
  }, [modules, onModulesChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Nome do produto */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>Nome do produto</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Usa o nicho selecionado: <span style={{ color: "var(--text)", fontWeight: 700 }}>{nicheName}</span></div>
          </div>
          <button className="gen-btn primary small" onClick={generateNames}>
            Gerar outros nomes
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="input"
            value={product.name}
            onChange={handleNameChange}
            placeholder="Nome do seu infoproduto"
          />
          {editingName ? (
            <button className="gen-btn primary" onClick={() => setEditingName(false)}>Cancelar</button>
          ) : (
            <button className="gen-btn primary" onClick={() => setEditingName(true)}>Editar</button>
          )}
        </div>
        <div className="name-suggestions">
          {nameSugg.map((s, i) => (
            <div key={i} className="suggestion-chip">
              <span>{s}</span>
              <button className="use-suggestion" onClick={() => useName(s)}>Usar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Descricao */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>Descricao do produto</div>
          <button className="gen-btn primary small" onClick={generateDescs}>Gerar outras versoes</button>
        </div>
        <textarea
          className="textarea"
          value={product.description}
          onChange={handleDescChange}
          placeholder="Descricao comercial do infoproduto..."
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
          {editingDesc ? (
            <button className="gen-btn primary" onClick={() => setEditingDesc(false)}>Cancelar</button>
          ) : (
            <button className="gen-btn primary" onClick={() => setEditingDesc(true)}>Editar</button>
          )}
        </div>
        <div className="name-suggestions" style={{ marginTop: 10 }}>
          {descSugg.map((s, i) => (
            <div key={i} className="suggestion-chip">
              <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
              <button className="use-suggestion" onClick={() => useDesc(s)}>Usar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Outras informacoes */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 14 }}>Outras informacoes</div>
        <div className="field-row">
          <div className="field">
            <label>Nome para exibicao no gateway</label>
            <input className="input" value={product.gatewayName} onChange={(e) => onProductChange({ ...product, gatewayName: e.target.value })} placeholder="Nome que aparece no checkout" />
          </div>
          <div className="field">
            <label>Descricao curta</label>
            <input className="input" value={product.shortDescription} onChange={(e) => onProductChange({ ...product, shortDescription: e.target.value })} placeholder="Resumo para o gateway" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Descricao completa</label>
          <textarea className="textarea" value={product.fullDescription} onChange={(e) => onProductChange({ ...product, fullDescription: e.target.value })} placeholder="Descricao completa de vendas..." />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>O que esta incluso</label>
          <textarea className="textarea" value={product.includes} onChange={(e) => onProductChange({ ...product, includes: e.target.value })}           placeholder="Ex: E-book + planilhas + videos..." />
        </div>
        <div className="field-row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Publico-alvo</label>
            <input className="input" value={product.targetAudience} onChange={(e) => onProductChange({ ...product, targetAudience: e.target.value })} placeholder="Quem deve comprar" />
          </div>
          <div className="field">
            <label>Beneficios</label>
            <input className="input" value={product.benefits} onChange={(e) => onProductChange({ ...product, benefits: e.target.value })} placeholder="Principais beneficios" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Conteudo entregue</label>
          <textarea className="textarea" value={product.contentDelivered} onChange={(e) => onProductChange({ ...product, contentDelivered: e.target.value })} placeholder="O que o comprador recebe..." />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Garantia (opcional)</label>
          <input className="input" value={product.guarantee} onChange={(e) => onProductChange({ ...product, guarantee: e.target.value })} placeholder="Ex: 7 dias" />
        </div>
      </div>

      {/* Preco */}
      <div className="price-area">
        <div className="price-head">
          <h3>Preco do produto</h3>
          <button className="gen-btn primary small" onClick={onGenerateSuggestions}>Gerar sugestoes de precos</button>
        </div>
        <div className="price-controls">
          <div className="price-input-wrap">
            <span>Valor (R$)</span>
            <input className="input" type="text" value={price != null ? price.toFixed(2) : ""} onChange={handlePriceChange} placeholder="0,00" style={{ width: 140 }} />
          </div>
          {priceSuggestions.length > 0 && (
            <div className="suggested-prices">
              {priceSuggestions.map((s) => (
                <div key={s.label} className={`price-option ${price != null && Math.abs(price - s.value) < 0.01 ? "selected" : ""}`}>
                  <div>
                    <span className="pos-label">{s.label}</span>
                    <div className="pos-value">R$ {s.value.toFixed(2).replace(".", ",")}</div>
                    <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>{s.position}</div>
                  </div>
                  <button className="select-price" onClick={() => selectPrice(s.value)}>
                    {price != null && Math.abs(price - s.value) < 0.01 ? "Selecionado" : "Escolher"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formato */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", marginBottom: 12 }}>Formato de entrega</div>
        <div className="format-options">
          <div className={`format-card ${format === "PDF" ? "selected" : ""}`} onClick={() => onFormatChange("PDF")}>
            <div className="format-icon">[PDF]</div>
            <h4>PDF Completo</h4>
            <p>Material unico, organizado como apostila ou guia digital.</p>
          </div>
          <div className={`format-card ${format === "MODULES" ? "selected" : ""}`} onClick={() => onFormatChange("MODULES")}>
            <div className="format-icon">[MOD]</div>
            <h4>Modulos e aulas</h4>
            <p>Conteudo dividido em modulos, capitulos e aulas.</p>
          </div>
        </div>
      </div>

      {format === "MODULES" && (
        <div className="card modules-preview" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)" }}>Estrutura de modulos</div>
            <button className="gen-btn primary small" onClick={addModule}>+ Modulo</button>
          </div>
          {modules.length ? (
            modules.map((m, mi) => (
              <div key={mi} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 10, background: "var(--card-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: "var(--red)", fontSize: 12 }}>Modulo {mi + 1}</span>
                  <input className="input" style={{ width: 220, padding: 6, fontSize: 12 }} value={m.title} onChange={(e) => updateModuleTitle(mi, e)} />
                  <button className="gen-btn primary small" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => removeModule(mi)}>Remover</button>
                </div>
                {m.lessons.map((l, li) => (
                  <div key={li} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-dim)", paddingLeft: 24 }}>
                    <span style={{ color: "var(--text-mute)", fontSize: 11 }}>Aula {li + 1}</span>
                    <span>{l}</span>
                    <button className="gen-btn primary small" style={{ padding: "2px 6px", fontSize: 10, marginLeft: "auto" }} onClick={() => removeLesson(mi, li)}>x</button>
                  </div>
                ))}
                <button className="gen-btn primary small" style={{ marginTop: 6 }} onClick={() => addLesson(mi)}>+ Aula</button>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: 20 }}>Nenhum modulo adicionado.</div>
          )}
        </div>
      )}

      {/* Reset */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button className="gen-btn" onClick={onReset} style={{ color: "#ff6b71", borderColor: "rgba(255, 107, 113, 0.4)" }}>
          Resetar e gerar novamente
        </button>
      </div>
    </div>
  );
}
