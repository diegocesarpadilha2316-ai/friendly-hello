import type { ProductionReport } from "../../types";
import type { FabricationPlan } from "../fabrication";
import type { IndustrialCostSummary, IndustrialIntent, OffcutInventoryItem } from "./types";

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildIndustrialIntents(
  report: ProductionReport,
  plan: FabricationPlan | null,
  cost: IndustrialCostSummary,
  offcuts: readonly OffcutInventoryItem[],
): readonly IndustrialIntent[] {
  const worst = [...report.parts].sort((a, b) => b.areaM2 * b.qty - a.areaM2 * a.qty)[0];
  const wasteM2 = plan?.totals.wasteAreaM2 ?? report.cuttingPlan.totals.wasteAreaM2;
  const usagePct = plan
    ? Math.round(plan.totals.avgUsageRatio * 100)
    : Math.round(report.cuttingPlan.totals.avgUsageRatio * 100);
  const offcutM2 = offcuts.reduce((a, o) => a + o.areaM2, 0);
  const economy = Math.round(offcutM2 * 80 * 100) / 100;
  const bottleneck = report.time.assemblyH > report.time.cuttingH ? "montagem" : "corte";
  return [
    { id: "ind.pior-peca", question: "Qual peça gera maior desperdício?", patterns: ["pior peça", "desperdicio", "desperdício", "maior perda"], answer: worst ? `A peça com maior consumo é "${worst.label}" (${worst.furnitureLabel}) — ${(worst.areaM2 * worst.qty).toFixed(2)} m². Revise dimensões, veio e agrupamento para reduzir perda.` : "Nenhuma peça relevante identificada." },
    { id: "ind.economizar-chapa", question: "Como economizar chapa?", patterns: ["economizar chapa", "menos chapa", "economia chapa"], answer: `Aproveitamento atual: ${usagePct}%. Ative rotação livre em peças sem veio, reduza a margem para ${Math.max(5, (plan?.constraints.marginMm ?? 10) - 3)} mm e reaproveite as ${offcuts.length} sobras já cadastradas.` },
    { id: "ind.reduzir-custo", question: "Como reduzir custo?", patterns: ["reduzir custo", "baixar custo", "custo menor"], answer: `Custo atual ${fmtBRL(cost.cost)}. Reduza desperdício (${wasteM2.toFixed(2)} m²), renegocie ferragens (${report.hardware.length} itens) e otimize tempo de ${bottleneck} (${bottleneck === "montagem" ? report.time.assemblyH : report.time.cuttingH}h).` },
    { id: "ind.reaproveitar", question: "Quais chapas podem ser reaproveitadas?", patterns: ["reaproveitar", "sobras", "aproveitar sobra"], answer: offcuts.length ? `${offcuts.length} sobras disponíveis somando ${offcutM2.toFixed(2)} m². Maior sobra: ${Math.max(...offcuts.map((o) => o.areaM2)).toFixed(2)} m².` : "Nenhuma sobra cadastrada. Rode o plano de corte para registrar automaticamente." },
    { id: "ind.economia-total", question: "Quanto economizei?", patterns: ["quanto economizei", "economia total", "economia"], answer: `Sobras aproveitáveis representam ${fmtBRL(economy)} em chapa não descartada (${offcutM2.toFixed(2)} m² a R$80/m²).` },
    { id: "ind.tempo-fabrica", question: "Quanto tempo levo para produzir?", patterns: ["tempo", "quanto tempo", "producao tempo"], answer: `Estimativa total: ${report.time.totalH}h (corte ${report.time.cuttingH}h · usinagem ${report.time.machiningH}h · montagem ${report.time.assemblyH}h · acabamento ${report.time.finishingH}h).` },
    { id: "ind.gargalo", question: "Onde está meu gargalo?", patterns: ["gargalo", "onde travo", "atraso"], answer: `Gargalo atual: ${bottleneck}. Priorize máquinas e equipe para essa etapa antes de expandir capacidade nas demais.` },
  ];
}

export function matchIndustrialIntent(
  prompt: string,
  intents: readonly IndustrialIntent[],
): IndustrialIntent | null {
  const p = prompt.toLowerCase().trim();
  if (!p) return null;
  for (const intent of intents) {
    if (intent.patterns.some((pat) => p.includes(pat))) return intent;
  }
  return null;
}
