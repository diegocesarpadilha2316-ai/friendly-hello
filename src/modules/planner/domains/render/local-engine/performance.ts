/**
 * Fase 3.21 — Perfil de performance (LOD, streaming, culling, cache).
 */
import type { LocalPerformanceConfig, LocalPerformanceTier, LocalRenderScene } from "./types";

export function performanceForTier(tier: LocalPerformanceTier): LocalPerformanceConfig {
  return {
    tier,
    lod: true,
    streaming: tier !== "extremo",
    mipmaps: true,
    instancing: tier !== "eco",
    occlusionCulling: tier === "alto" || tier === "extremo",
    frustumCulling: true,
    cache: tier !== "extremo",
    compression: tier === "eco" || tier === "balanced",
  };
}

export function recommendTier(scene: LocalRenderScene): LocalPerformanceTier {
  const t = scene.triangleEstimate;
  if (t < 20_000) return "extremo";
  if (t < 80_000) return "alto";
  if (t < 250_000) return "balanced";
  return "eco";
}
