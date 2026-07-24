/**
 * Fase 3.17 — Presets de qualidade.
 */
import type { RealtimeQualityTier } from "./types";
import { REALTIME_PROFILES } from "./performance";

export const REALTIME_QUALITY_ORDER: readonly RealtimeQualityTier[] = [
  "baixo", "medio", "alto", "ultra", "cinema",
];

export function nextQuality(tier: RealtimeQualityTier): RealtimeQualityTier {
  const i = REALTIME_QUALITY_ORDER.indexOf(tier);
  return REALTIME_QUALITY_ORDER[Math.min(i + 1, REALTIME_QUALITY_ORDER.length - 1)];
}

export function prevQuality(tier: RealtimeQualityTier): RealtimeQualityTier {
  const i = REALTIME_QUALITY_ORDER.indexOf(tier);
  return REALTIME_QUALITY_ORDER[Math.max(i - 1, 0)];
}

export function qualityLabel(tier: RealtimeQualityTier): string {
  return REALTIME_PROFILES[tier].label;
}