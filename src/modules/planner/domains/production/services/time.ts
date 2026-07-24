import type { CuttingPlan, ProductionPart, TimeBreakdown } from "../types";

export function estimateTime(parts: readonly ProductionPart[], plan: CuttingPlan): TimeBreakdown {
  const totalParts = parts.reduce((acc, p) => acc + p.qty, 0);
  const modules = new Set(parts.map((p) => p.furnitureId)).size;
  const edgeMeters = parts
    .filter((p) => p.kind === "fita-borda")
    .reduce((acc, p) => acc + (p.edgeMeters ?? 0), 0);
  const cuttingH = Math.round((totalParts * 45 + plan.totals.boardsCount * 60) / 3600 * 10) / 10;
  const machiningH = Math.round(((modules * 6 + edgeMeters * 0.35) * 60) / 3600 * 10) / 10;
  const assemblyH = Math.round((modules * 0.9) * 10) / 10;
  const finishingH = Math.round((modules * 0.55) * 10) / 10;
  const totalH = Math.round((cuttingH + machiningH + assemblyH + finishingH) * 10) / 10;
  return { cuttingH, machiningH, assemblyH, finishingH, totalH };
}