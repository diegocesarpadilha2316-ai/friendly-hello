/**
 * Fase 3.23 — Medição em tempo real.
 */
import type { RealtimeMeasureMode, RealtimeMeasurePoint, RealtimeVec3 } from "./types";

export function distanceMm(a: RealtimeVec3, b: RealtimeVec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function createMeasure(mode: RealtimeMeasureMode, a: RealtimeVec3, b: RealtimeVec3): RealtimeMeasurePoint {
  let value: number;
  switch (mode) {
    case "height": value = Math.abs(a.y - b.y); break;
    case "width": value = Math.abs(a.x - b.x); break;
    case "depth": value = Math.abs(a.z - b.z); break;
    case "area": value = Math.abs((a.x - b.x) * (a.z - b.z)); break;
    default: value = distanceMm(a, b);
  }
  return {
    id: `mm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    mode, aMm: a, bMm: b, valueMm: value,
  };
}

export function formatMeasure(m: RealtimeMeasurePoint): string {
  if (m.mode === "area") return `${(m.valueMm / 1_000_000).toFixed(2)} m²`;
  return `${(m.valueMm / 1000).toFixed(3)} m`;
}