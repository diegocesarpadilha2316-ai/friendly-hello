/**
 * Hooks de IA — respostas determinísticas locais, sem chamar APIs.
 * A camada superior (planner/ia) pode consumir estas funções.
 */
import type { NestingComparison, NestingPlan } from "./types";

export function worstBoard(plan: NestingPlan): { index: number; wasteM2: number } | null {
  if (plan.boards.length === 0) return null;
  const worst = [...plan.boards].sort((a, b) => b.wasteM2 - a.wasteM2)[0];
  return { index: worst.index, wasteM2: worst.wasteM2 };
}

export function largestReusableOffcut(plan: NestingPlan): { boardIndex: number; areaM2: number } | null {
  let best: { boardIndex: number; areaM2: number } | null = null;
  for (const b of plan.boards) {
    for (const o of b.offcuts) {
      if (!best || o.areaM2 > best.areaM2) best = { boardIndex: b.index, areaM2: o.areaM2 };
    }
  }
  return best;
}

export function bestAlgorithm(comparisons: readonly NestingComparison[]): NestingComparison | null {
  if (comparisons.length === 0) return null;
  return [...comparisons].sort(
    (a, b) => b.plan.statistics.avgUsageRatio - a.plan.statistics.avgUsageRatio,
  )[0];
}

export function savingsSummary(baseline: NestingPlan, current: NestingPlan): string {
  const delta = baseline.statistics.wasteAreaM2 - current.statistics.wasteAreaM2;
  const pct = baseline.statistics.wasteAreaM2 > 0
    ? (delta / baseline.statistics.wasteAreaM2) * 100
    : 0;
  return `Economia de ${delta.toFixed(2)} m² (${pct.toFixed(1)}%) e ${baseline.statistics.boardsCount - current.statistics.boardsCount} chapa(s).`;
}
