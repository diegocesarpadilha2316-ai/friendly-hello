import type { CutListRow } from "../../types";
import type { FabricationBoard, FabricationPlan, OffcutRect, OptimizerConstraints } from "./types";
import { DEFAULT_OPTIMIZER_CONSTRAINTS } from "./types";
import { STANDARD_BOARD } from "../cutting-plan";

/**
 * Algoritmo próprio (Guillotine + Shelf Best-Fit com rotação e reuso
 * de sobra) — determinístico, memoizável, sem IA.
 */

interface Slot {
  code: string;
  w: number;
  h: number;
  grainLocked: boolean;
}

function toSlots(rows: readonly CutListRow[]): Slot[] {
  const slots: Slot[] = [];
  for (const row of rows) {
    for (let i = 0; i < row.qty; i++) {
      slots.push({
        code: row.code,
        w: row.lengthMm,
        h: row.widthMm,
        grainLocked: row.grain === "vertical" || row.grain === "horizontal",
      });
    }
  }
  return slots.sort((a, b) => b.h * b.w - a.h * a.w);
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function splitRect(free: FreeRect, w: number, h: number, kerf: number): FreeRect[] {
  const right: FreeRect = {
    x: free.x + w + kerf,
    y: free.y,
    w: Math.max(0, free.w - w - kerf),
    h,
  };
  const bottom: FreeRect = {
    x: free.x,
    y: free.y + h + kerf,
    w: free.w,
    h: Math.max(0, free.h - h - kerf),
  };
  return [right, bottom].filter((r) => r.w > 0 && r.h > 0);
}

export function optimizeCutting(
  rows: readonly CutListRow[],
  constraints: OptimizerConstraints = DEFAULT_OPTIMIZER_CONSTRAINTS,
): FabricationPlan {
  const kerf = constraints.kerfMm;
  const margin = constraints.marginMm;
  const boardW = STANDARD_BOARD.lengthMm - margin * 2;
  const boardH = STANDARD_BOARD.widthMm - margin * 2;
  const boardAreaM2 = (STANDARD_BOARD.lengthMm * STANDARD_BOARD.widthMm) / 1_000_000;

  const slots = toSlots(rows);
  const boards: FabricationBoard[] = [];
  const unplaced: { code: string; reason: string }[] = [];
  let grainOkCount = 0;
  let totalCuts = 0;

  let freeRects: FreeRect[] = [{ x: margin, y: margin, w: boardW, h: boardH }];
  let placements: FabricationBoard["placements"] = [];
  let placementsMutable: Array<FabricationBoard["placements"][number]> = [];

  const flush = () => {
    if (placementsMutable.length === 0) return;
    const usedArea = placementsMutable.reduce((acc, pl) => acc + (pl.w * pl.h) / 1_000_000, 0);
    const offcuts: OffcutRect[] = freeRects
      .map((r) => ({
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        areaM2: Math.round(((r.w * r.h) / 1_000_000) * 1000) / 1000,
      }))
      .filter((r) => r.areaM2 >= constraints.minOffcutM2);
    const offcutArea = offcuts.reduce((a, o) => a + o.areaM2, 0);
    const wasteArea = Math.max(0, boardAreaM2 - usedArea - offcutArea);
    boards.push({
      index: boards.length + 1,
      spec: STANDARD_BOARD,
      placements: placementsMutable.slice(),
      usedM2: Math.round(usedArea * 1000) / 1000,
      wasteM2: Math.round(wasteArea * 1000) / 1000,
      usageRatio: Math.round((usedArea / boardAreaM2) * 100) / 100,
      offcuts,
      cutOrder: placementsMutable.map((_, i) => i + 1),
    });
    totalCuts += placementsMutable.length * 2;
    placements = [];
    placementsMutable = [];
    freeRects = [{ x: margin, y: margin, w: boardW, h: boardH }];
  };

  const tryPlace = (
    w: number,
    h: number,
    rotated: boolean,
    code: string,
    grainOk: boolean,
  ): boolean => {
    let bestIdx = -1;
    let bestScore = Infinity;
    for (let i = 0; i < freeRects.length; i++) {
      const fr = freeRects[i];
      if (w <= fr.w && h <= fr.h) {
        const score = fr.w * fr.h - w * h; // best area fit
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
    }
    if (bestIdx < 0) return false;
    const fr = freeRects[bestIdx];
    placementsMutable.push({
      code,
      x: fr.x,
      y: fr.y,
      w,
      h,
      rotated,
      grainRespected: grainOk,
    });
    if (grainOk) grainOkCount += 1;
    freeRects.splice(bestIdx, 1, ...splitRect(fr, w, h, kerf));
    return true;
  };

  for (const slot of slots) {
    const fitsBoard = slot.w <= boardW && slot.h <= boardH;
    const rotatable = constraints.allowRotation && !slot.grainLocked;
    if (!fitsBoard && !(rotatable && slot.h <= boardW && slot.w <= boardH)) {
      unplaced.push({ code: slot.code, reason: "peça maior que a chapa" });
      continue;
    }

    let placed = tryPlace(slot.w, slot.h, false, slot.code, true);
    if (!placed && rotatable) {
      placed = tryPlace(slot.h, slot.w, true, slot.code, true);
    }
    if (placed) continue;

    flush();
    placed = tryPlace(slot.w, slot.h, false, slot.code, true);
    if (!placed && rotatable) placed = tryPlace(slot.h, slot.w, true, slot.code, true);
    if (!placed) unplaced.push({ code: slot.code, reason: "não coube após flush" });
  }
  flush();
  void placements;

  const usedTotal = boards.reduce((a, b) => a + b.usedM2, 0);
  const wasteTotal = boards.reduce((a, b) => a + b.wasteM2, 0);
  const offcutTotal = boards.reduce((a, b) => a + b.offcuts.reduce((s, o) => s + o.areaM2, 0), 0);
  const avgUsage = boards.length ? boards.reduce((a, b) => a + b.usageRatio, 0) / boards.length : 0;
  const totalPieces =
    placementsMutable.length + boards.reduce((a, b) => a + b.placements.length, 0);
  const grainPct = totalPieces > 0 ? Math.round((grainOkCount / totalPieces) * 100) : 100;

  return {
    boards,
    constraints,
    totals: {
      boardsCount: boards.length,
      usedAreaM2: Math.round(usedTotal * 1000) / 1000,
      wasteAreaM2: Math.round(wasteTotal * 1000) / 1000,
      offcutAreaM2: Math.round(offcutTotal * 1000) / 1000,
      avgUsageRatio: Math.round(avgUsage * 100) / 100,
      effectiveRatio:
        boards.length > 0
          ? Math.round(
              ((usedTotal + offcutTotal) /
                (boards.length *
                  ((STANDARD_BOARD.lengthMm * STANDARD_BOARD.widthMm) / 1_000_000))) *
                100,
            ) / 100
          : 0,
      totalCuts,
      grainRespectedPct: grainPct,
    },
    unplaced,
  };
}
