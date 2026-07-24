/**
 * Cálculo determinístico de sobras aproveitáveis de cada chapa.
 * Sem localStorage — a persistência é do `industrial/offcut-inventory.ts`.
 */
import type { NestingBoard, NestingBoardSpec, NestingOffcut, NestingPlacement } from "./types";

interface Rect { x: number; y: number; w: number; h: number }

export function computeOffcuts(
  boardIndex: number,
  spec: NestingBoardSpec,
  placements: readonly NestingPlacement[],
  minMm: number,
): readonly NestingOffcut[] {
  const free: Rect[] = [{ x: 0, y: 0, w: spec.lengthMm, h: spec.widthMm }];
  for (const pl of placements) {
    const used: Rect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
    const next: Rect[] = [];
    for (const r of free) {
      if (!intersects(r, used)) { next.push(r); continue; }
      // split into up to 4 rectangles around the used area
      if (used.y > r.y) next.push({ x: r.x, y: r.y, w: r.w, h: used.y - r.y });
      const bottomY = used.y + used.h;
      if (bottomY < r.y + r.h) next.push({ x: r.x, y: bottomY, w: r.w, h: r.y + r.h - bottomY });
      if (used.x > r.x) next.push({ x: r.x, y: Math.max(r.y, used.y), w: used.x - r.x, h: Math.min(r.y + r.h, used.y + used.h) - Math.max(r.y, used.y) });
      const rightX = used.x + used.w;
      if (rightX < r.x + r.w) next.push({ x: rightX, y: Math.max(r.y, used.y), w: r.x + r.w - rightX, h: Math.min(r.y + r.h, used.y + used.h) - Math.max(r.y, used.y) });
    }
    free.splice(0, free.length, ...next.filter((r) => r.w > 0 && r.h > 0));
  }
  return free
    .filter((r) => r.w >= minMm && r.h >= minMm)
    .map((r, i) => ({
      id: `offcut:${spec.id}:${boardIndex}:${i}`,
      x: r.x,
      y: r.y,
      widthMm: Math.round(r.w),
      heightMm: Math.round(r.h),
      areaM2: Math.round(((r.w * r.h) / 1_000_000) * 1000) / 1000,
      material: spec.material,
      thicknessMm: spec.thicknessMm,
      color: spec.color,
      status: "available" as const,
    }));
}

function intersects(a: Rect, b: Rect): boolean {
  return !(b.x >= a.x + a.w || b.x + b.w <= a.x || b.y >= a.y + a.h || b.y + b.h <= a.y);
}

export function totalOffcutArea(boards: readonly NestingBoard[]): number {
  return boards.reduce((acc, b) => acc + b.offcuts.reduce((s, o) => s + o.areaM2, 0), 0);
}
