/**
 * Regras de rotação — respeita veio ou libera 90°.
 */
import type { NestingPart, RotationMode, GrainMode } from "./types";

export interface OrientationCandidate {
  readonly w: number;
  readonly h: number;
  readonly rotated: boolean;
  readonly grainRespected: boolean;
}

export function candidates(
  part: NestingPart,
  rotation: RotationMode,
  grain: GrainMode,
): readonly OrientationCandidate[] {
  const natural: OrientationCandidate = {
    w: part.widthMm,
    h: part.heightMm,
    rotated: false,
    grainRespected: true,
  };
  if (rotation === "locked" || part.locked) return [natural];
  const rotated: OrientationCandidate = {
    w: part.heightMm,
    h: part.widthMm,
    rotated: true,
    grainRespected: part.grain === "none" || grain === "ignore",
  };
  if (grain === "respect" && part.grain !== "none") return [natural];
  return [natural, rotated];
}
