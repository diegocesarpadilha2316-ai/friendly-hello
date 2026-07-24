/**
 * Fase 3.21 — Sombras (soft, contact, AO, ray).
 */
import type { LocalQualityPreset, LocalShadowConfig, LocalShadowKind } from "./types";

export function shadowsForQuality(q: LocalQualityPreset): LocalShadowConfig {
  const kinds: LocalShadowKind[] = ["soft", "contact", "ao"];
  if (q.id === "alta" || q.id === "ultra" || q.id === "cinema") kinds.push("ray");
  return {
    kinds,
    softness: q.id === "cinema" ? 0.9 : q.id === "ultra" ? 0.75 : 0.5,
    samples: q.shadowSamples,
  };
}