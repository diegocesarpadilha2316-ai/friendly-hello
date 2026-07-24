/**
 * Fase 3.21 — Reflexos (Fresnel, físico, refração).
 */
import type { LocalQualityPreset, LocalReflectionConfig } from "./types";

export function reflectionForQuality(q: LocalQualityPreset): LocalReflectionConfig {
  return {
    fresnel: true,
    physical: q.id !== "rascunho",
    refraction: q.id === "alta" || q.id === "ultra" || q.id === "cinema",
    bounces: q.reflectionBounces,
    rougnessCutoff: q.id === "cinema" ? 0.85 : 0.65,
  };
}

export const REFLECTION_PRESET_LABELS: Readonly<Record<string, string>> = {
  fresnel: "Fresnel",
  physical: "Reflexão física",
  refraction: "Refração",
  glass: "Vidro",
  mirror: "Espelho",
  water: "Água",
};