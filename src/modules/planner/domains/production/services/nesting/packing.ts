/**
 * Núcleo determinístico de packing 2D — 6 algoritmos.
 * Rectângulos livres puros; nada de IA.
 */
import type { NestingAlgorithm } from "./types";

export interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface PackedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
}

export interface PackingContext {
  readonly binW: number;
  readonly binH: number;
  readonly kerf: number;
  readonly margin: number;
  free: FreeRect[];
}

export function createContext(
  binW: number,
  binH: number,
  kerf: number,
  margin: number,
): PackingContext {
  return {
    binW,
    binH,
    kerf,
    margin,
    free: [{ x: margin, y: margin, w: binW - margin * 2, h: binH - margin * 2 }],
  };
}

export interface Orientation {
  w: number;
  h: number;
  rotated: boolean;
}

export function tryPack(
  ctx: PackingContext,
  orientations: readonly Orientation[],
  algo: NestingAlgorithm,
): PackedRect | null {
  let best: { rect: PackedRect; score: number; freeIdx: number } | null = null;
  for (let i = 0; i < ctx.free.length; i++) {
    const f = ctx.free[i];
    for (const o of orientations) {
      if (o.w > f.w || o.h > f.h) continue;
      const score = scoreFit(f, o, algo);
      if (best === null || score < best.score) {
        best = {
          rect: { x: f.x, y: f.y, w: o.w, h: o.h, rotated: o.rotated },
          score,
          freeIdx: i,
        };
      }
      if (algo === "first-fit" && best) break;
    }
    if (algo === "first-fit" && best) break;
  }
  if (!best) return null;
  splitFree(ctx, best.freeIdx, best.rect, algo);
  return best.rect;
}

function scoreFit(f: FreeRect, o: Orientation, algo: NestingAlgorithm): number {
  switch (algo) {
    case "best-fit":
    case "max-rects":
      return (f.w - o.w) * (f.h - o.h);
    case "guillotine":
      return f.y * 10000 + f.x;
    case "skyline":
      return f.y * 100000 + (f.w - o.w);
    case "bin-packing":
      return Math.min(f.w - o.w, f.h - o.h);
    case "first-fit":
      return f.x + f.y;
  }
}

function splitFree(ctx: PackingContext, idx: number, r: PackedRect, algo: NestingAlgorithm): void {
  const f = ctx.free[idx];
  const kerf = ctx.kerf;
  ctx.free.splice(idx, 1);
  const rightW = f.w - r.w - kerf;
  const bottomH = f.h - r.h - kerf;
  if (algo === "guillotine" || algo === "skyline") {
    if (rightW > 0) ctx.free.push({ x: f.x + r.w + kerf, y: f.y, w: rightW, h: r.h });
    if (bottomH > 0) ctx.free.push({ x: f.x, y: f.y + r.h + kerf, w: f.w, h: bottomH });
  } else {
    if (rightW > 0) ctx.free.push({ x: f.x + r.w + kerf, y: f.y, w: rightW, h: f.h });
    if (bottomH > 0) ctx.free.push({ x: f.x, y: f.y + r.h + kerf, w: f.w, h: bottomH });
    pruneFree(ctx);
  }
}

function pruneFree(ctx: PackingContext): void {
  const list = ctx.free;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (contains(list[j], list[i])) {
        list.splice(i, 1);
        i--;
        break;
      }
      if (contains(list[i], list[j])) {
        list.splice(j, 1);
        j--;
      }
    }
  }
}

function contains(a: FreeRect, b: FreeRect): boolean {
  return b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
}
