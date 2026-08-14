/**
 * Fase 3.22 — Performance tiers (cache, streaming, render incremental,
 * frame skip, compressão, paralelismo).
 */
import type {
  LocalVideoPerformanceConfig,
  LocalVideoPerformanceTier,
  LocalVideoScene,
} from "./types";

export function videoPerformanceForTier(
  tier: LocalVideoPerformanceTier,
): LocalVideoPerformanceConfig {
  return {
    tier,
    cache: tier !== "extremo",
    streaming: tier !== "extremo",
    incremental: true,
    frameSkip: tier === "eco" ? 1 : 0,
    compression: tier === "eco" || tier === "balanced",
    parallelFrames: tier === "eco" ? 1 : tier === "balanced" ? 2 : tier === "alto" ? 4 : 8,
  };
}

export function recommendVideoTier(scene: LocalVideoScene): LocalVideoPerformanceTier {
  const frames = scene.frameCount;
  const tris = scene.triangleEstimate;
  if (frames > 1800 || tris > 400_000) return "eco";
  if (frames > 900 || tris > 150_000) return "balanced";
  if (frames > 300 || tris > 50_000) return "alto";
  return "extremo";
}
