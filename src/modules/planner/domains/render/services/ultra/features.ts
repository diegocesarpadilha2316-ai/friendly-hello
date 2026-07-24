/**
 * Fase 3.12 — Flags de features físicas (RT/PT/GI/SSR/SSGI/Denoiser/…).
 * Descreve o *envelope* de recursos que cada preset e provider pode ativar.
 */
import type { RenderPresetId } from "../../types";
import type { UltraFeatureFlags } from "../../types/ultra";

const OFF: UltraFeatureFlags = {
  rayTracing: false,
  pathTracing: false,
  globalIllumination: false,
  screenSpaceReflection: false,
  screenSpaceGI: false,
  denoiser: "off",
  softShadows: false,
  contactShadows: false,
  rayShadows: false,
  ambientOcclusion: false,
  fresnel: true,
  refraction: false,
  realMirrors: false,
  realGlass: false,
};

export const ULTRA_FEATURES: Readonly<Record<RenderPresetId, UltraFeatureFlags>> = {
  rascunho:    { ...OFF, ambientOcclusion: true },
  baixa:       { ...OFF, ambientOcclusion: true, softShadows: true, denoiser: "temporal" },
  media:       { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, screenSpaceReflection: true, denoiser: "oidn", realGlass: true },
  alta:        { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, rayShadows: true, screenSpaceReflection: true, screenSpaceGI: true, rayTracing: true, globalIllumination: true, denoiser: "oidn", realGlass: true, realMirrors: true, refraction: true },
  ultra:       { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, rayShadows: true, screenSpaceReflection: true, screenSpaceGI: true, rayTracing: true, pathTracing: true, globalIllumination: true, denoiser: "optix", realGlass: true, realMirrors: true, refraction: true },
  fotografica: { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, rayShadows: true, screenSpaceReflection: true, screenSpaceGI: true, rayTracing: true, pathTracing: true, globalIllumination: true, denoiser: "ai", realGlass: true, realMirrors: true, refraction: true },
  marketing:   { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, rayShadows: true, screenSpaceReflection: true, screenSpaceGI: true, rayTracing: true, globalIllumination: true, denoiser: "ai", realGlass: true, realMirrors: true, refraction: true },
  cinema:      { ...OFF, ambientOcclusion: true, softShadows: true, contactShadows: true, rayShadows: true, screenSpaceReflection: true, screenSpaceGI: true, rayTracing: true, pathTracing: true, globalIllumination: true, denoiser: "ai", realGlass: true, realMirrors: true, refraction: true },
};

export function featuresForPreset(id: RenderPresetId): UltraFeatureFlags {
  return ULTRA_FEATURES[id];
}