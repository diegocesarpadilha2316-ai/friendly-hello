/**
 * Fase 3.23 — Ciclo diurno.
 */
import type { RealtimeTimeOfDay } from "./types";

export interface RealtimeSunPosition {
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
}

const SUN: Record<RealtimeTimeOfDay, RealtimeSunPosition> = {
  "06h": { azimuthDeg: 85, elevationDeg: 5 },
  "08h": { azimuthDeg: 100, elevationDeg: 25 },
  "10h": { azimuthDeg: 130, elevationDeg: 50 },
  "12h": { azimuthDeg: 180, elevationDeg: 75 },
  "15h": { azimuthDeg: 220, elevationDeg: 55 },
  "17h": { azimuthDeg: 250, elevationDeg: 30 },
  "18h": { azimuthDeg: 265, elevationDeg: 12 },
  "20h": { azimuthDeg: 285, elevationDeg: -5 },
  "22h": { azimuthDeg: 300, elevationDeg: -25 },
};

export function sunPosition(t: RealtimeTimeOfDay): RealtimeSunPosition {
  return SUN[t];
}
export function isDay(t: RealtimeTimeOfDay): boolean {
  return SUN[t].elevationDeg > 0;
}
