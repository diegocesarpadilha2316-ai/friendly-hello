/**
 * Utilitários geométricos puros da biblioteca construtiva (mm).
 */
import type { ConstructionBox, ConstructionPiece, ConstructionWarning } from "./types";
import type { GrainDirection } from "../engineering/types";

export function box(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
): ConstructionBox {
  return {
    x: round(x),
    y: round(y),
    z: round(z),
    width: Math.max(1, round(width)),
    height: Math.max(1, round(height)),
    depth: Math.max(1, round(depth)),
  };
}

export function round(v: number): number {
  return Math.round(v * 10) / 10;
}

export function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function positive(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
}

export function intIn(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.round(clamp(v, min, max));
}

/** Envelope que contém todas as caixas informadas. */
export function unionBox(boxes: readonly ConstructionBox[]): ConstructionBox {
  if (boxes.length === 0) return box(0, 0, 0, 1, 1, 1);
  let x0 = Infinity,
    y0 = Infinity,
    z0 = Infinity;
  let x1 = -Infinity,
    y1 = -Infinity,
    z1 = -Infinity;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    z0 = Math.min(z0, b.z);
    x1 = Math.max(x1, b.x + b.width);
    y1 = Math.max(y1, b.y + b.height);
    z1 = Math.max(z1, b.z + b.depth);
  }
  return box(x0, y0, z0, x1 - x0, y1 - y0, z1 - z0);
}

/** Move uma caixa (usado ao compor componentes dentro de um móvel). */
export function translateBox(
  b: ConstructionBox,
  [dx, dy, dz]: readonly [number, number, number],
): ConstructionBox {
  return box(b.x + dx, b.y + dy, b.z + dz, b.width, b.height, b.depth);
}

export function translatePiece(
  p: ConstructionPiece,
  offset: readonly [number, number, number],
): ConstructionPiece {
  return { ...p, box: translateBox(p.box, offset) };
}

/**
 * Move um rig de animação junto com a peça.
 * O componente descreve o mecanismo no SEU espaço local; ao ser posicionado
 * dentro de um móvel, o pivô precisa acompanhar o mesmo deslocamento — sem
 * isso a porta gira em torno de um eixo que não existe no móvel.
 */
export function translateMotion(
  m: ConstructionMotion,
  offset: readonly [number, number, number],
): ConstructionMotion {
  if (!m.pivot) return m;
  return {
    ...m,
    pivot: [
      round(m.pivot[0] + offset[0]),
      round(m.pivot[1] + offset[1]),
      round(m.pivot[2] + offset[2]),
    ],
  };
}

export function warn(code: string, message: string): ConstructionWarning {
  return { code, message };
}

/** Divide um vão em N partes iguais descontando as folgas entre e nas bordas. */
export function divideSpan(total: number, count: number, gap: number): number[] {
  const n = Math.max(1, Math.round(count));
  const usable = total - gap * (n + 1);
  const each = usable / n;
  return Array.from({ length: n }, () => round(each));
}

/** Nº de dobradiças recomendado por altura de porta (prática de marcenaria). */
export function recommendedHinges(heightMm: number, thicknessMm: number): number {
  const base = heightMm <= 900 ? 2 : heightMm <= 1600 ? 3 : heightMm <= 2000 ? 4 : 5;
  return thicknessMm >= 22 ? base + 1 : base;
}

/** Nº de suportes de prateleira por largura + carga. */
export function recommendedShelfSupports(widthMm: number, loadKg: number): number {
  const byWidth = widthMm <= 600 ? 4 : widthMm <= 900 ? 6 : widthMm <= 1200 ? 8 : 10;
  return loadKg > 30 ? byWidth + 2 : byWidth;
}

/** Flecha aproximada de prateleira (mm) — alerta de vão longo. */
export function shelfDeflection(widthMm: number, thicknessMm: number, loadKg: number): number {
  const l = widthMm / 1000;
  const t = Math.max(6, thicknessMm) / 1000;
  return round((0.0009 * loadKg * l ** 3) / t ** 3);
}

export function grainOf(v: unknown, fallback: GrainDirection): GrainDirection {
  return v === "vertical" || v === "horizontal" || v === "livre" ? v : fallback;
}
