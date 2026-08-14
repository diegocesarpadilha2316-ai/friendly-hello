/**
 * Otimizador principal — orquestra `packing` × chapas × peças.
 * Determinístico, sem IA. Suporta 6 algoritmos e comparação entre eles.
 */
import type {
  NestingAlgorithm,
  NestingBoard,
  NestingBoardSpec,
  NestingComparison,
  NestingOptions,
  NestingPart,
  NestingPlacement,
  NestingPlan,
  NestingStatistics,
} from "./types";
import { pickBoardFor, boardAreaM2 } from "./boards";
import { expandQuantities, sortForPacking, groupByMaterial } from "./parts";
import { candidates } from "./rotation";
import { grainCompatible } from "./grain";
import { computeOffcuts } from "./offcuts";
import { createContext, tryPack, type Orientation } from "./packing";

export const DEFAULT_OPTIONS: NestingOptions = {
  algorithm: "max-rects",
  kerfMm: 4,
  rotation: "auto",
  grainMode: "respect",
  marginMm: 10,
  minOffcutMm: 100,
};

export function runNesting(
  parts: readonly NestingPart[],
  options: NestingOptions = DEFAULT_OPTIONS,
  boardCatalog?: readonly NestingBoardSpec[],
): NestingPlan {
  const expanded = sortForPacking(expandQuantities(parts));
  const groups = groupByMaterial(expanded);
  const boards: NestingBoard[] = [];
  const unplaced: NestingPart[] = [];
  let boardIndex = 0;

  for (const [key, list] of groups) {
    const [material, thicknessStr] = key.split("|");
    const spec = pickCatalog(boardCatalog, material, Number(thicknessStr));
    const remaining = [...list];
    while (remaining.length > 0) {
      const ctx = createContext(spec.lengthMm, spec.widthMm, options.kerfMm, options.marginMm);
      const placements: NestingPlacement[] = [];
      for (let i = 0; i < remaining.length; i++) {
        const part = remaining[i];
        const orients: Orientation[] = candidates(part, options.rotation, options.grainMode)
          .filter((c) => grainCompatible(part, spec, c.rotated))
          .map((c) => ({ w: c.w, h: c.h, rotated: c.rotated }));
        if (orients.length === 0) {
          unplaced.push(part);
          remaining.splice(i, 1);
          i--;
          continue;
        }
        const packed = tryPack(ctx, orients, options.algorithm);
        if (!packed) continue;
        placements.push({
          partId: part.id,
          code: part.code,
          x: packed.x,
          y: packed.y,
          w: packed.w,
          h: packed.h,
          rotated: packed.rotated,
          grainRespected: grainCompatible(part, spec, packed.rotated),
          locked: Boolean(part.locked),
          pinned: Boolean(part.pinned),
        });
        remaining.splice(i, 1);
        i--;
      }
      if (placements.length === 0) {
        // não coube nenhuma peça — evita loop infinito
        unplaced.push(...remaining);
        remaining.length = 0;
        break;
      }
      boardIndex += 1;
      const area = boardAreaM2(spec);
      const used = placements.reduce((a, p) => a + (p.w * p.h) / 1_000_000, 0);
      const offcuts = computeOffcuts(boardIndex, spec, placements, options.minOffcutMm);
      boards.push({
        index: boardIndex,
        spec,
        placements,
        usedM2: round(used, 3),
        wasteM2: round(area - used, 3),
        usageRatio: round(used / area, 4),
        weightKg: round(spec.weightKg * (used / area), 2),
        offcuts,
      });
    }
  }

  const stats = statistics(boards, unplaced);
  return {
    algorithm: options.algorithm,
    options,
    boards,
    unplaced,
    statistics: stats,
    generatedAt: new Date().toISOString(),
  };
}

function pickCatalog(
  catalog: readonly NestingBoardSpec[] | undefined,
  material: string,
  thicknessMm: number,
): NestingBoardSpec {
  if (!catalog || catalog.length === 0) return pickBoardFor(material, thicknessMm);
  const found = catalog.find(
    (b) =>
      b.material.toLowerCase().includes(material.toLowerCase()) && b.thicknessMm === thicknessMm,
  );
  return found ?? pickBoardFor(material, thicknessMm);
}

function statistics(
  boards: readonly NestingBoard[],
  unplaced: readonly NestingPart[],
): NestingStatistics {
  const usedAreaM2 = boards.reduce((a, b) => a + b.usedM2, 0);
  const wasteAreaM2 = boards.reduce((a, b) => a + b.wasteM2, 0);
  const offcutAreaM2 = boards.reduce((a, b) => a + b.offcuts.reduce((s, o) => s + o.areaM2, 0), 0);
  const totalWeightKg = boards.reduce((a, b) => a + b.weightKg, 0);
  const totalCost = boards.reduce((a, b) => a + b.spec.price, 0);
  const partsCount = boards.reduce((a, b) => a + b.placements.length, 0) + unplaced.length;
  const avg = boards.length ? boards.reduce((a, b) => a + b.usageRatio, 0) / boards.length : 0;
  return {
    boardsCount: boards.length,
    partsCount,
    usedAreaM2: round(usedAreaM2, 3),
    wasteAreaM2: round(wasteAreaM2, 3),
    offcutAreaM2: round(offcutAreaM2, 3),
    totalWeightKg: round(totalWeightKg, 2),
    avgUsageRatio: round(avg, 4),
    totalCost: round(totalCost, 2),
    estimatedTimeMin: Math.round(boards.length * 8 + partsCount * 0.5),
  };
}

export function compareAlgorithms(
  parts: readonly NestingPart[],
  algorithms: readonly NestingAlgorithm[] = [
    "best-fit",
    "first-fit",
    "guillotine",
    "skyline",
    "max-rects",
    "bin-packing",
  ],
  baseOptions: NestingOptions = DEFAULT_OPTIONS,
): readonly NestingComparison[] {
  const runs = algorithms.map((algo) => runNesting(parts, { ...baseOptions, algorithm: algo }));
  const worst = runs.reduce((m, r) => Math.max(m, r.statistics.wasteAreaM2), 0) || 1;
  const baselineBoards = Math.max(...runs.map((r) => r.statistics.boardsCount), 1);
  return runs.map((plan) => ({
    algorithm: plan.algorithm,
    plan,
    savingsAreaM2: round(worst - plan.statistics.wasteAreaM2, 3),
    savingsPercent: round(((worst - plan.statistics.wasteAreaM2) / worst) * 100, 2),
    deltaBoards: baselineBoards - plan.statistics.boardsCount,
  }));
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
