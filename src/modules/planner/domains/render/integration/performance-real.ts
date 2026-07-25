/**
 * Fase 3.30 — Performance real: LOD, Instancing, MipMaps, Streaming, Culling.
 */
import { performanceForTier, recommendTier } from "../local-engine/performance";
import { texturesForTier } from "../local-engine/textures";
import { buildLocalScene } from "../local-engine/scene-builder";
import type { LocalPerformanceConfig, LocalTextureConfig } from "../local-engine/types";
import type { PlannerProject } from "@/modules/planner/shared/types/project";

export interface RealPerformanceProfile {
  readonly performance: LocalPerformanceConfig;
  readonly textures: LocalTextureConfig;
  readonly frustumCulling: boolean;
  readonly occlusionCulling: boolean;
  readonly instancing: boolean;
  readonly lod: boolean;
  readonly mipmaps: boolean;
  readonly streaming: boolean;
  readonly textureCache: boolean;
}

export function buildPerformanceProfile(project: PlannerProject, roomId: string | null = null): RealPerformanceProfile {
  const scene = buildLocalScene(project, roomId);
  const tier = recommendTier(scene);
  const performance = performanceForTier(tier);
  const textures = texturesForTier(tier);
  return {
    performance,
    textures,
    frustumCulling: performance.frustumCulling,
    occlusionCulling: performance.occlusionCulling,
    instancing: performance.instancing,
    lod: performance.lod,
    mipmaps: performance.mipmaps,
    streaming: performance.streaming,
    textureCache: performance.cache,
  };
}