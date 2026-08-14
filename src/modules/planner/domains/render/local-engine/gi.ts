/**
 * Fase 3.21 — Global Illumination local (Screen Space GI + Light Bounce).
 */
import type { LocalGIConfig, LocalQualityPreset } from "./types";

export function giForQuality(q: LocalQualityPreset): LocalGIConfig {
  return {
    enabled: q.id !== "rascunho",
    screenSpace: q.id === "baixa" || q.id === "media",
    bounces: q.giBounces,
    indirectIntensity: q.id === "cinema" ? 1.15 : 1.0,
    lightBounce: q.id === "alta" || q.id === "ultra" || q.id === "cinema",
  };
}
