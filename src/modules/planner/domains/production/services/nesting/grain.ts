/**
 * Utilitários de veio (grain) — compatibilidade peça × chapa.
 */
import type { NestingBoardSpec, NestingPart } from "./types";

export function grainCompatible(
  part: NestingPart,
  spec: NestingBoardSpec,
  rotated: boolean,
): boolean {
  if (part.grain === "none" || spec.grain === "none") return true;
  const partDir = rotated
    ? part.grain === "vertical" ? "horizontal" : "vertical"
    : part.grain;
  return partDir === spec.grain;
}

export function normalizeGrain(g: string): "horizontal" | "vertical" | "none" {
  const v = g.toLowerCase();
  if (v === "horizontal") return "horizontal";
  if (v === "vertical") return "vertical";
  return "none";
}
