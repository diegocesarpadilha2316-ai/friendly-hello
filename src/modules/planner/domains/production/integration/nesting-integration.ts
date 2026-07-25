/**
 * Fase 3.32 — Integração de Plano de Corte.
 *
 * Reutiliza o motor de nesting (services/nesting) para comparar os 6
 * algoritmos existentes (Best Fit, First Fit, Guillotine, Skyline,
 * MaxRects, Bin Packing) e selecionar automaticamente o melhor.
 */
import {
  compareAlgorithms,
  DEFAULT_OPTIONS,
  toNestingParts,
  type NestingAlgorithm,
  type NestingOptions,
} from "../services/nesting";
import type { CutListRow } from "../types";
import type { NestingSelection } from "./types";

export const ALGORITHMS: readonly NestingAlgorithm[] = [
  "best-fit",
  "first-fit",
  "guillotine",
  "skyline",
  "max-rects",
  "bin-packing",
];

export function selectBestNesting(
  cutList: readonly CutListRow[],
  options: NestingOptions = DEFAULT_OPTIONS,
): NestingSelection | null {
  if (cutList.length === 0) return null;
  const parts = toNestingParts(cutList);
  if (parts.length === 0) return null;
  const runs = compareAlgorithms(parts, ALGORITHMS, options);
  const winner = [...runs].sort((a, b) => {
    const wA = a.plan.statistics.wasteAreaM2;
    const wB = b.plan.statistics.wasteAreaM2;
    if (wA !== wB) return wA - wB;
    return a.plan.statistics.boardsCount - b.plan.statistics.boardsCount;
  })[0];
  return {
    best: winner.plan,
    runners: runs,
    winnerAlgorithm: winner.algorithm,
    reason: `Menor desperdício (${winner.plan.statistics.wasteAreaM2.toFixed(2)} m²) com ${winner.plan.statistics.boardsCount} chapas · aproveitamento médio ${(winner.plan.statistics.avgUsageRatio * 100).toFixed(1)}%`,
  };
}