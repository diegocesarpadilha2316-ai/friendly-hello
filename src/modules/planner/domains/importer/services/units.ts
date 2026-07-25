import type { ImporterUnit } from "../types";

export const UNIT_TO_MM: Readonly<Record<ImporterUnit, number>> = {
  mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8,
};

export function unitToMm(unit: ImporterUnit): number { return UNIT_TO_MM[unit]; }

/** Heurística de detecção de unidade a partir de um bbox aparente (mm hipotético). */
export function guessUnit(maxDimension: number): ImporterUnit {
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return "mm";
  if (maxDimension < 20) return "m";       // < 20 → provavelmente metros
  if (maxDimension < 200) return "cm";     // < 200 → centímetros
  if (maxDimension < 20000) return "mm";   // < 20 m em mm
  return "mm";
}

export function listUnits(): readonly ImporterUnit[] { return ["mm","cm","m","in","ft"]; }