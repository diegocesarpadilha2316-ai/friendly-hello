/**
 * Fase 3.21 — Presets de qualidade do motor local (refina o global).
 */
import { getRenderPreset } from "../services/presets";
import type { LocalQualityPreset, LocalQualityId } from "./types";

const LOCAL_IDS: readonly LocalQualityId[] = [
  "rascunho",
  "baixa",
  "media",
  "alta",
  "ultra",
  "cinema",
];

function tune(id: LocalQualityId): LocalQualityPreset {
  const base = getRenderPreset(id);
  const tier =
    id === "rascunho"
      ? 0
      : id === "baixa"
        ? 1
        : id === "media"
          ? 2
          : id === "alta"
            ? 3
            : id === "ultra"
              ? 4
              : 5;
  return {
    id,
    label: base.label,
    description: base.description,
    quality: base.quality,
    aa: base.quality.antialiasing,
    denoise: base.quality.denoise,
    reflectionBounces: [0, 1, 2, 4, 6, 8][tier],
    giBounces: [0, 1, 2, 3, 4, 6][tier],
    shadowSamples: [1, 4, 8, 16, 32, 64][tier],
    aoSamples: [2, 4, 8, 16, 24, 32][tier],
  };
}

export const LOCAL_QUALITY_PRESETS: readonly LocalQualityPreset[] = LOCAL_IDS.map(tune);
export const DEFAULT_LOCAL_QUALITY: LocalQualityId = "media";

export function getLocalQuality(id: LocalQualityId): LocalQualityPreset {
  const q = LOCAL_QUALITY_PRESETS.find((p) => p.id === id);
  if (!q) throw new Error(`Local quality desconhecida: ${id}`);
  return q;
}
