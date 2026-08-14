import type {
  CutListRow,
  CuttingBoard,
  CuttingBoardSpec,
  CuttingPlacement,
  CuttingPlan,
} from "../types";

const STANDARD_BOARD: CuttingBoardSpec = {
  brand: "Duratex",
  material: "MDF 18mm",
  thicknessMm: 18,
  lengthMm: 2750,
  widthMm: 1850,
};

interface Slot {
  code: string;
  w: number;
  h: number;
  grain: string;
}

function toSlots(rows: readonly CutListRow[]): Slot[] {
  const slots: Slot[] = [];
  for (const row of rows) {
    for (let i = 0; i < row.qty; i++) {
      slots.push({ code: row.code, w: row.lengthMm, h: row.widthMm, grain: row.grain });
    }
  }
  return slots.sort((a, b) => b.h - a.h || b.w - a.w);
}

export function buildCuttingPlan(rows: readonly CutListRow[]): CuttingPlan {
  const slots = toSlots(rows);
  const boards: CuttingBoard[] = [];
  const kerf = 4;
  const groupWidth = STANDARD_BOARD.lengthMm;
  const groupHeight = STANDARD_BOARD.widthMm;
  const boardAreaM2 = (groupWidth * groupHeight) / 1_000_000;

  interface Shelf {
    y: number;
    height: number;
    x: number;
  }
  let currentPlacements: CuttingPlacement[] = [];
  let shelves: Shelf[] = [{ y: 0, height: 0, x: 0 }];

  const flush = () => {
    if (currentPlacements.length === 0) return;
    const usedArea = currentPlacements.reduce((acc, pl) => acc + (pl.w * pl.h) / 1_000_000, 0);
    boards.push({
      index: boards.length + 1,
      spec: STANDARD_BOARD,
      placements: currentPlacements,
      usedM2: Math.round(usedArea * 1000) / 1000,
      wasteM2: Math.round((boardAreaM2 - usedArea) * 1000) / 1000,
      usageRatio: Math.round((usedArea / boardAreaM2) * 100) / 100,
    });
    currentPlacements = [];
    shelves = [{ y: 0, height: 0, x: 0 }];
  };

  for (const slot of slots) {
    if (slot.w > groupWidth && slot.h > groupWidth) continue;
    let placed = false;
    for (const shelf of shelves) {
      const fits =
        slot.w + shelf.x <= groupWidth &&
        shelf.y + Math.max(shelf.height, slot.h) <= groupHeight &&
        (shelf.height === 0 || slot.h <= shelf.height);
      if (!fits) continue;
      currentPlacements.push({
        code: slot.code,
        x: shelf.x,
        y: shelf.y,
        w: slot.w,
        h: slot.h,
        rotated: false,
        grainRespected: slot.grain !== "vertical" ? true : slot.h >= slot.w,
      });
      shelf.x += slot.w + kerf;
      shelf.height = Math.max(shelf.height, slot.h);
      placed = true;
      break;
    }
    if (placed) continue;
    const lastShelf = shelves[shelves.length - 1];
    const newY = lastShelf.y + lastShelf.height + kerf;
    if (newY + slot.h <= groupHeight && slot.w <= groupWidth) {
      currentPlacements.push({
        code: slot.code,
        x: 0,
        y: newY,
        w: slot.w,
        h: slot.h,
        rotated: false,
        grainRespected: true,
      });
      shelves.push({ y: newY, height: slot.h, x: slot.w + kerf });
    } else {
      flush();
      currentPlacements.push({
        code: slot.code,
        x: 0,
        y: 0,
        w: slot.w,
        h: slot.h,
        rotated: false,
        grainRespected: true,
      });
      shelves = [{ y: 0, height: slot.h, x: slot.w + kerf }];
    }
  }
  flush();

  const usedTotal = boards.reduce((acc, b) => acc + b.usedM2, 0);
  const wasteTotal = boards.reduce((acc, b) => acc + b.wasteM2, 0);
  const avgUsage = boards.length
    ? boards.reduce((acc, b) => acc + b.usageRatio, 0) / boards.length
    : 0;
  return {
    boards,
    totals: {
      boardsCount: boards.length,
      usedAreaM2: Math.round(usedTotal * 1000) / 1000,
      wasteAreaM2: Math.round(wasteTotal * 1000) / 1000,
      avgUsageRatio: Math.round(avgUsage * 100) / 100,
    },
  };
}

export { STANDARD_BOARD };
