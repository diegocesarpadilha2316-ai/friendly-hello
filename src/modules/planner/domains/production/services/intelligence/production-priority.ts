import type { ProductionOrder, ProductionReport } from "../../types";
import type { PrioritizedOrder, PriorityLevel } from "./types";

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}

function levelFromScore(score: number): PriorityLevel {
  if (score >= 80) return "urgente";
  if (score >= 55) return "alta";
  if (score >= 30) return "normal";
  return "baixa";
}

export function prioritizeOrders(
  orders: readonly ProductionOrder[],
  report: ProductionReport,
): readonly PrioritizedOrder[] {
  const today = new Date().toISOString();
  return [...orders]
    .map((o) => {
      const delayedDays = Math.max(0, daysBetween(o.eta, today));
      const remainingPct = Math.max(0, 100 - o.progress);
      const partsWeight = Math.min(30, Math.round((o.parts / Math.max(1, report.totals.parts)) * 30));
      const stageWeight = o.stage === "entrega" ? 40 : o.stage === "expedicao" ? 30 : o.stage === "conferencia" ? 20 : 10;
      const score = Math.min(100, delayedDays * 15 + remainingPct * 0.3 + partsWeight + stageWeight);
      const priority = levelFromScore(score);
      const reason =
        delayedDays > 0
          ? `${delayedDays}d de atraso · ${remainingPct}% restante`
          : `${remainingPct}% restante · etapa ${o.stage}`;
      return {
        orderId: o.id,
        code: o.code,
        clientName: o.clientName,
        priority,
        score: Math.round(score),
        reason,
        parts: o.parts,
        progress: o.progress,
        eta: o.eta,
        delayedDays,
      };
    })
    .sort((a, b) => b.score - a.score);
}