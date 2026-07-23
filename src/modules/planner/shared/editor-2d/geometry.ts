/**
 * Utilitários geométricos puros do Editor 2D.
 * Sem I/O e sem dependências do Core — mesma entrada → mesma saída.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function snapToGrid(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

export function snapPoint(p: Point, grid: number): Point {
  return { x: snapToGrid(p.x, grid), y: snapToGrid(p.y, grid) };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function angleDeg(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Alinha um ângulo em múltiplos de `step` graus (ex.: 15°). */
export function snapAngleDeg(deg: number, step: number): number {
  if (step <= 0) return deg;
  return Math.round(deg / step) * step;
}

export function polarPoint(origin: Point, deg: number, len: number): Point {
  const rad = (deg * Math.PI) / 180;
  return { x: origin.x + Math.cos(rad) * len, y: origin.y + Math.sin(rad) * len };
}

export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** Reflete um valor em torno de um eixo (mirror). */
export function mirror(v: number, axis: number): number {
  return axis * 2 - v;
}

/** Rotaciona um ponto em torno de um centro. */
export function rotatePoint(p: Point, center: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { x: center.x + dx * c - dy * s, y: center.y + dx * s + dy * c };
}
