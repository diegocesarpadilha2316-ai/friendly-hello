import type { ProductionReport } from "../../types";
import type { FabricationIntent, FabricationIntentId, FabricationPlan } from "./types";

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Intenções pt-BR mapeadas para respostas locais e determinísticas
 * calculadas sobre o relatório atual — sem chamar IA real.
 */
export function buildFabricationIntents(
  report: ProductionReport,
  plan: FabricationPlan,
): readonly FabricationIntent[] {
  return [
    {
      id: "fab.custo",
      question: "Quanto custa este projeto?",
      patterns: ["quanto custa", "preço", "valor", "orçamento"],
      answer: `Custo final estimado: ${fmtBRL(report.budget.summary.final)} (${fmtBRL(report.budget.summary.perM2)}/m²).`,
    },
    {
      id: "fab.chapas",
      question: "Quantas chapas serão necessárias?",
      patterns: ["quantas chapas", "número de chapas", "chapas"],
      answer: `Serão ${plan.totals.boardsCount} chapas (${plan.totals.usedAreaM2.toFixed(2)} m² úteis).`,
    },
    {
      id: "fab.desperdicio",
      question: "Qual o desperdício?",
      patterns: ["desperdício", "perda", "sobra"],
      answer: `Desperdício: ${plan.totals.wasteAreaM2.toFixed(2)} m². Sobra útil reaproveitável: ${plan.totals.offcutAreaM2.toFixed(2)} m².`,
    },
    {
      id: "fab.aproveitamento",
      question: "Qual o aproveitamento das chapas?",
      patterns: ["aproveitamento", "eficiência"],
      answer: `Aproveitamento médio: ${Math.round(plan.totals.avgUsageRatio * 100)}% (efetivo com reuso: ${Math.round(plan.totals.effectiveRatio * 100)}%).`,
    },
    {
      id: "fab.tempo",
      question: "Quanto tempo de produção?",
      patterns: ["quanto tempo", "prazo", "produção"],
      answer: `Tempo total: ${report.time.totalH}h — corte ${report.time.cuttingH}h, usinagem ${report.time.machiningH}h, montagem ${report.time.assemblyH}h, acabamento ${report.time.finishingH}h.`,
    },
    {
      id: "fab.material",
      question: "Quais materiais são usados?",
      patterns: ["material", "materiais", "mdf"],
      answer: `Peças agregam ${new Set(report.parts.map((p) => p.material)).size} materiais diferentes ao longo de ${report.totals.parts} peças.`,
    },
    {
      id: "fab.melhorar-corte",
      question: "Como melhorar o corte?",
      patterns: ["melhorar", "otimizar corte", "reduzir desperdício"],
      answer:
        plan.totals.avgUsageRatio > 0.85
          ? "Aproveitamento já está excelente. Considere padronizar espessuras para reduzir setups de máquina."
          : "Habilite rotação (veio livre) e ative reuso de sobra — o otimizador já suporta ambos por padrão.",
    },
  ];
}

export function findIntentByQuery(
  intents: readonly FabricationIntent[],
  query: string,
): FabricationIntent | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    intents.find((i) => i.patterns.some((p) => q.includes(p))) ??
    intents.find((i) => q.includes(i.id.split(".")[1] ?? "")) ??
    null
  );
}

export const FABRICATION_INTENT_IDS: readonly FabricationIntentId[] = [
  "fab.custo",
  "fab.chapas",
  "fab.desperdicio",
  "fab.aproveitamento",
  "fab.tempo",
  "fab.material",
  "fab.melhorar-corte",
];
