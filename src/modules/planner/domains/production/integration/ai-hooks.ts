/**
 * Fase 3.32 — Respostas determinísticas de IA para a produção final.
 */
import type { FinalAiAnswer, IndustrialBundle } from "./types";

function matches(prompt: string, patterns: readonly string[]): boolean {
  const p = prompt.toLowerCase();
  return patterns.some((k) => p.includes(k));
}

export function answerFromBundle(prompt: string, b: IndustrialBundle): FinalAiAnswer | null {
  const q = prompt.trim();
  if (!q) return null;

  if (matches(q, ["sobrecarreg", "gargalo", "máquina mais", "maquina mais"])) {
    const label = b.balance?.bottleneckLabel ?? "—";
    const util =
      b.balance?.loads.find((l) => l.machineId === b.balance?.bottleneckId)?.utilizationPct ?? 0;
    return {
      question: q,
      answer: `Gargalo em ${label} com ${util}% de utilização.`,
      confidence: "alta",
      source: ["intelligence.balance"],
    };
  }
  if (matches(q, ["operador livre", "operador disponível", "operador disponivel"])) {
    const free =
      b.capacity?.operators.filter((o) => o.status === "disponivel").map((o) => o.name) ?? [];
    const answer = free.length
      ? `Operadores livres: ${free.join(", ")}.`
      : "Nenhum operador livre no turno atual.";
    return { question: q, answer, confidence: "alta", source: ["intelligence.capacity"] };
  }
  if (matches(q, ["desperdício", "desperdicio", "sobra"])) {
    const waste =
      b.nesting?.best.statistics.wasteAreaM2 ?? b.production.cuttingPlan.totals.wasteAreaM2;
    return {
      question: q,
      answer: `Desperdício previsto: ${waste.toFixed(2)} m² (algoritmo ${b.nesting?.winnerAlgorithm ?? "padrão"}).`,
      confidence: "alta",
      source: ["nesting"],
    };
  }
  if (matches(q, ["melhor algoritmo", "algoritmo"])) {
    return {
      question: q,
      answer: b.nesting
        ? `Melhor algoritmo: ${b.nesting.winnerAlgorithm}. ${b.nesting.reason}`
        : "Nenhum plano de corte gerado.",
      confidence: "alta",
      source: ["nesting.compare"],
    };
  }
  if (matches(q, ["custo", "material crítico", "material critico"])) {
    const top = [...b.mrp.items].sort((a, b) => b.total - a.total)[0];
    if (!top)
      return {
        question: q,
        answer: "Sem itens de material no MRP.",
        confidence: "media",
        source: ["mrp"],
      };
    return {
      question: q,
      answer: `Item mais caro: ${top.label} — ${top.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${top.qty} ${top.unit}).`,
      confidence: "alta",
      source: ["mrp"],
    };
  }
  if (matches(q, ["lucro", "margem"])) {
    const cost = b.cost;
    if (!cost)
      return {
        question: q,
        answer: `Margem prevista: ${b.production.budget.parameters.marginPct}%.`,
        confidence: "media",
        source: ["budget"],
      };
    return {
      question: q,
      answer: `Margem ${cost.marginPct.toFixed(1)}% · Lucro ${cost.margin.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
      confidence: "alta",
      source: ["industrial.cost"],
    };
  }
  if (matches(q, ["tempo restante", "quanto falta", "termina"])) {
    const d = b.factoryDelivery;
    if (!d)
      return {
        question: q,
        answer: "Sem estimativa de entrega calculada.",
        confidence: "baixa",
        source: [],
      };
    return {
      question: q,
      answer: `Previsão: ${new Date(d.finishDate).toLocaleDateString("pt-BR")} — ${d.effectiveDays}d úteis, confiança ${d.confidence}.`,
      confidence: "alta",
      source: ["intelligence.delivery"],
    };
  }
  if (matches(q, ["atras", "pedido"])) {
    const delayed = b.prioritized.filter((p) => p.delayedDays > 0);
    if (delayed.length === 0)
      return {
        question: q,
        answer: "Nenhum pedido atrasado.",
        confidence: "alta",
        source: ["intelligence.priority"],
      };
    return {
      question: q,
      answer: `Atrasados: ${delayed.map((d) => `${d.code} (${d.delayedDays}d)`).join(", ")}.`,
      confidence: "alta",
      source: ["intelligence.priority"],
    };
  }
  if (matches(q, ["reduzir desperdício", "reduzir desperdicio", "economizar chapa"])) {
    const runners = b.nesting?.runners ?? [];
    const better = runners.find((r) => r.savingsAreaM2 > 0);
    if (!better)
      return {
        question: q,
        answer: "O algoritmo atual já é o melhor.",
        confidence: "alta",
        source: ["nesting.compare"],
      };
    return {
      question: q,
      answer: `Trocar para ${better.algorithm} economiza ${better.savingsAreaM2.toFixed(2)} m² (${better.savingsPercent.toFixed(1)}%).`,
      confidence: "alta",
      source: ["nesting.compare"],
    };
  }
  if (matches(q, ["reduzir custo"])) {
    return {
      question: q,
      answer: `Consolidar chapas por espessura e reduzir sobras (${b.production.cuttingPlan.totals.wasteAreaM2.toFixed(2)} m² hoje) reduz o custo direto.`,
      confidence: "media",
      source: ["cuttingPlan"],
    };
  }
  return null;
}
