import type { ImporterBBox, ImporterScale, ImporterUnit } from "../types";
import { guessUnit, unitToMm } from "./units";

export function bboxOf(points: readonly (readonly [number, number])[]): ImporterBBox | null {
  if (points.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function autoScale(bbox: ImporterBBox | null): ImporterScale {
  if (!bbox) return { factorToMm: 1, detectedUnit: "mm" };
  const dim = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
  const unit = guessUnit(dim);
  return { factorToMm: unitToMm(unit), detectedUnit: unit };
}

export function withOverride(scale: ImporterScale, override: ImporterUnit): ImporterScale {
  return { ...scale, overrideUnit: override, factorToMm: unitToMm(override) };
}
