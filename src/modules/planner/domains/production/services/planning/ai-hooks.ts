import type { MachineLoad } from "./machines";
import type { OperatorLoad } from "./operators";
import type { DeliveryEstimate, MrpSummary, PlanningAiAnswer, PlanningOrder } from "./types";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function askOverloadedMachine(loads: readonly MachineLoad[]): PlanningAiAnswer {
  const over = [...loads].filter((l) => l.overloaded).sort((a, b) => b.loadPct - a.loadPct);
  if (over.length === 0) {
    return {
      question: "Qual máquina está sobrecarregada?",
      answer: "Nenhuma máquina em sobrecarga no horizonte atual.",
      confidence: "alta",
      refs: [],
    };
  }
  const m = over[0];
  return {
    question: "Qual máquina está sobrecarregada?",
    answer: `${m.label} (${m.sector}) está em ${m.loadPct}% — excedente de ${(m.loadH - m.capacityH).toFixed(1)}h.`,
    confidence: "alta",
    refs: [m.resourceId],
  };
}

export function askFreeOperator(ops: readonly OperatorLoad[]): PlanningAiAnswer {
  const free = [...ops].filter((o) => o.free).sort((a, b) => a.loadPct - b.loadPct);
  if (free.length === 0) {
    return {
      question: "Qual operador está livre?",
      answer: "Nenhum operador com folga acima de 40%.",
      confidence: "media",
      refs: [],
    };
  }
  const o = free[0];
  return {
    question: "Qual operador está livre?",
    answer: `${o.label} (${o.sector}) — ocupação ${o.loadPct}%. Habilidades: ${o.skills.join(", ") || "gerais"}.`,
    confidence: "alta",
    refs: [o.resourceId],
  };
}

export function askDelayedOrder(deliveries: readonly DeliveryEstimate[]): PlanningAiAnswer {
  const late = [...deliveries]
    .filter((d) => d.delayDays > 0)
    .sort((a, b) => b.delayDays - a.delayDays);
  if (late.length === 0) {
    return {
      question: "Qual pedido atrasará?",
      answer: "Nenhum pedido com previsão de atraso.",
      confidence: "alta",
      refs: [],
    };
  }
  const d = late[0];
  return {
    question: "Qual pedido atrasará?",
    answer: `${d.orderCode} (${d.clientName}) — ${d.delayDays} dia(s) de atraso. Prazo ${d.dueDate}, estimado ${d.estimatedDelivery}.`,
    confidence: "alta",
    refs: [d.orderId],
  };
}

export function askMdfRequirement(mrp: MrpSummary): PlanningAiAnswer {
  const mdf = mrp.byCategory["MDF"];
  if (!mdf)
    return {
      question: "Quanto MDF será necessário?",
      answer: "Sem consumo de MDF neste projeto.",
      confidence: "alta",
      refs: [],
    };
  return {
    question: "Quanto MDF será necessário?",
    answer: `Total ${mdf.qty.toFixed(2)} m² de MDF — custo previsto ${fmtBRL(mdf.cost)}.`,
    confidence: "alta",
    refs: ["mrp.MDF"],
  };
}

export function askTotalCost(mrp: MrpSummary): PlanningAiAnswer {
  return {
    question: "Quanto custará?",
    answer: `Custo total: ${fmtBRL(mrp.totalCost)} (${mrp.totalItems} itens).`,
    confidence: "alta",
    refs: ["mrp.total"],
  };
}

export function askBottleneck(loads: readonly MachineLoad[]): PlanningAiAnswer {
  const worst = [...loads].sort((a, b) => b.loadPct - a.loadPct)[0];
  if (!worst)
    return {
      question: "Qual é o gargalo?",
      answer: "Sem dados de carga.",
      confidence: "baixa",
      refs: [],
    };
  return {
    question: "Qual é o gargalo?",
    answer: `${worst.label} (${worst.sector}) — ${worst.loadPct}% de ocupação.`,
    confidence: "alta",
    refs: [worst.resourceId],
  };
}

export function askBestSequence(orders: readonly PlanningOrder[]): PlanningAiAnswer {
  if (orders.length === 0)
    return {
      question: "Qual é a melhor sequência?",
      answer: "Sem pedidos na fila.",
      confidence: "baixa",
      refs: [],
    };
  const first = orders
    .slice(0, 3)
    .map((o) => o.code)
    .join(" → ");
  return {
    question: "Qual é a melhor sequência?",
    answer: `Recomendo: ${first} — prioriza urgência × prazo × valor.`,
    confidence: "alta",
    refs: orders.slice(0, 3).map((o) => o.id),
  };
}

export function askReduceTime(loads: readonly MachineLoad[]): PlanningAiAnswer {
  const worst = [...loads].sort((a, b) => b.loadPct - a.loadPct)[0];
  if (!worst)
    return {
      question: "Como reduzir tempo?",
      answer: "Otimize sequenciamento por menor-tempo.",
      confidence: "media",
      refs: [],
    };
  return {
    question: "Como reduzir tempo?",
    answer: `Adicione turno extra em ${worst.label} — libera ~${(worst.loadH * 0.15).toFixed(1)}h.`,
    confidence: "media",
    refs: [worst.resourceId],
  };
}

export function askReduceWaste(mrp: MrpSummary): PlanningAiAnswer {
  return {
    question: "Como reduzir desperdício?",
    answer: `Ative Nesting Guillotine + reaproveitamento de sobras — potencial de ~8% (${fmtBRL(mrp.totalCost * 0.08)}).`,
    confidence: "media",
    refs: ["mrp", "nesting"],
  };
}

export function askIncreaseProduction(loads: readonly MachineLoad[]): PlanningAiAnswer {
  const idle = [...loads].filter((l) => l.loadPct < 60).sort((a, b) => a.loadPct - b.loadPct);
  if (idle.length === 0) {
    return {
      question: "Como aumentar produção?",
      answer: "Todas as máquinas acima de 60% — adicione turno noturno.",
      confidence: "media",
      refs: [],
    };
  }
  const m = idle[0];
  return {
    question: "Como aumentar produção?",
    answer: `${m.label} a ${m.loadPct}% — direcione mais pedidos e ganhe até ${(m.capacityH - m.loadH).toFixed(1)}h/mês.`,
    confidence: "alta",
    refs: [m.resourceId],
  };
}
