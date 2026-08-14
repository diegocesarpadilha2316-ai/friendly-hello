/**
 * Fase 3.23 — Reflexos (SSR, sondas, planares).
 */
import type { RealtimeQualityTier, RealtimeReflectionProfile } from "./types";

export function reflectionForQuality(tier: RealtimeQualityTier): RealtimeReflectionProfile {
  switch (tier) {
    case "eco":
      return { ssrEnabled: false, probesEnabled: false, planarEnabled: false, maxRoughness: 0.2 };
    case "baixa":
      return { ssrEnabled: false, probesEnabled: true, planarEnabled: false, maxRoughness: 0.3 };
    case "media":
      return { ssrEnabled: false, probesEnabled: true, planarEnabled: true, maxRoughness: 0.45 };
    case "alta":
      return { ssrEnabled: true, probesEnabled: true, planarEnabled: true, maxRoughness: 0.6 };
    case "ultra":
      return { ssrEnabled: true, probesEnabled: true, planarEnabled: true, maxRoughness: 0.75 };
    case "cinema":
      return { ssrEnabled: true, probesEnabled: true, planarEnabled: true, maxRoughness: 0.9 };
  }
}
