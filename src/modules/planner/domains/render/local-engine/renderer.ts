/**
 * Fase 3.21 — Renderizador local (algoritmo próprio; monta o playbook).
 */
import { reflectionForQuality } from "./reflection";
import { shadowsForQuality } from "./shadows";
import { giForQuality } from "./gi";
import { performanceForTier, recommendTier } from "./performance";
import { texturesForTier } from "./textures";
import { getLocalQuality } from "./quality";
import type {
  LocalGIConfig,
  LocalPerformanceConfig,
  LocalQualityId,
  LocalQualityPreset,
  LocalReflectionConfig,
  LocalRenderScene,
  LocalShadowConfig,
  LocalTextureConfig,
} from "./types";

export interface LocalRenderPlaybook {
  readonly qualityId: LocalQualityId;
  readonly quality: LocalQualityPreset;
  readonly reflection: LocalReflectionConfig;
  readonly shadows: LocalShadowConfig;
  readonly gi: LocalGIConfig;
  readonly performance: LocalPerformanceConfig;
  readonly textures: LocalTextureConfig;
}

export function buildPlaybook(
  qualityId: LocalQualityId,
  scene: LocalRenderScene,
): LocalRenderPlaybook {
  const q = getLocalQuality(qualityId);
  const tier = recommendTier(scene);
  return {
    qualityId,
    quality: q,
    reflection: reflectionForQuality(q),
    shadows: shadowsForQuality(q),
    gi: giForQuality(q),
    performance: performanceForTier(tier),
    textures: texturesForTier(tier),
  };
}