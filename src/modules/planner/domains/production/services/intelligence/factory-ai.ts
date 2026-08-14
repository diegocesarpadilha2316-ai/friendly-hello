import type { ProductionReport } from "../../types";
import type {
  CapacitySnapshot,
  DeliveryEstimate,
  FactoryIntent,
  MachineBalance,
  OperatorAssignment,
  PrioritizedOrder,
  QualityChecklist,
  RoutingPlan,
} from "./types";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export function buildFactoryIntents(
  report: ProductionReport,
  capacity: CapacitySnapshot,
  balance: MachineBalance,
  delivery: DeliveryEstimate,
  quality: QualityChecklist,
  assignments: readonly OperatorAssignment[],
  routings: readonly RoutingPlan[],
  prioritized: readonly PrioritizedOrder[],
): readonly FactoryIntent[] {
  const remaining = report.totals.parts;
  const nextOp = assignments.find((a) => a.stage === "montagem") ?? assignments[0];
  const slowestRouting = [...routings].sort((a, b) => b.totalMinutes - a.totalMinutes)[0];
  const topPriority = prioritized[0];
  const avgAvail =
    capacity.machines.reduce((a, m) => a + m.availability, 0) /
    Math.max(1, capacity.machines.length);

  return [
    {
      id: "fab.quanto-falta",
      question: "Quanto falta produzir?",
      patterns: ["quanto falta", "restam", "falta produzir"],
      answer: `Faltam ${remaining} peças em ${report.totals.modules} módulos — ${delivery.totalHours}h de fábrica.`,
    },
    {
      id: "fab.quando-termina",
      question: "Quando termina?",
      patterns: ["quando termina", "quando fica pronto", "previsao entrega", "previsão entrega"],
      answer: `Previsão: ${fmtDate(delivery.finishDate)} (${delivery.effectiveDays}d úteis · confiança ${delivery.confidence}${delivery.bufferDays ? ` · +${delivery.bufferDays}d buffer` : ""}).`,
    },
    {
      id: "fab.operador",
      question: "Qual operador usar?",
      patterns: ["qual operador", "quem monta", "operador ideal"],
      answer: nextOp
        ? `Ideal: ${nextOp.operatorName} para ${nextOp.stage} — ${nextOp.reason}.`
        : "Nenhum operador disponível.",
    },
    {
      id: "fab.maquina",
      question: "Qual máquina usar?",
      patterns: ["qual maquina", "qual máquina", "melhor maquina", "melhor máquina"],
      answer: `Concentre carga na ${balance.bottleneckLabel} (gargalo em ${balance.bottleneckStage}); ${balance.idleIds.length} máquinas ociosas absorvem picos.`,
    },
    {
      id: "fab.economizar",
      question: "Quanto economizar?",
      patterns: ["economizar", "reduzir custo", "economia"],
      answer: `Reduzindo retrabalho em 2% e ocupando ociosas, economia projetada ~R$ ${Math.max(1, Math.round(report.budget.summary.subtotal * 0.03))} por lote.`,
    },
    {
      id: "fab.acelerar",
      question: "Como acelerar?",
      patterns: ["acelerar", "reduzir prazo", "adiantar"],
      answer: `Aumente turno em ${balance.bottleneckLabel} e paralelize ${slowestRouting?.moduleLabel ?? "os módulos maiores"} — reduz ~${Math.max(1, Math.round(delivery.effectiveDays * 0.2))}d.`,
    },
    {
      id: "fab.gargalo",
      question: "Qual gargalo?",
      patterns: ["gargalo", "onde travo", "travando"],
      answer: `Gargalo: ${balance.bottleneckLabel} (${balance.loads.find((l) => l.machineId === balance.bottleneckId)?.utilizationPct ?? 0}% de utilização).`,
    },
    {
      id: "fab.setor-lento",
      question: "Qual setor está lento?",
      patterns: ["setor lento", "mais lento", "atrasa mais"],
      answer: slowestRouting
        ? `Setor mais pesado: ${slowestRouting.moduleLabel} — ${Math.round(slowestRouting.totalMinutes / 60)}h${topPriority ? `. Priorize após o pedido ${topPriority.code} (${topPriority.priority}).` : "."}`
        : "Sem carga significativa detectada.",
    },
    {
      id: "fab.oee",
      question: "Como está o OEE?",
      patterns: ["oee", "eficiencia", "eficiência"],
      answer: `Utilização ${capacity.utilizationPct}% · disponibilidade média ${(avgAvail * 100).toFixed(0)}%.`,
    },
    {
      id: "fab.qualidade",
      question: "Como está a qualidade?",
      patterns: ["qualidade", "retrabalho", "defeitos"],
      answer: `Retrabalho ${quality.reworkRatePct}% · defeitos ${quality.defectRatePct}% · ${quality.criticalChecks} checks críticos ativos.`,
    },
  ];
}

export function matchFactoryIntent(
  prompt: string,
  intents: readonly FactoryIntent[],
): FactoryIntent | null {
  const p = prompt.toLowerCase().trim();
  if (!p) return null;
  for (const intent of intents) {
    if (intent.patterns.some((pat) => p.includes(pat))) return intent;
  }
  return null;
}
