/**
 * Fase 3.23 — Performance + detecção de hardware.
 */
import type { RealtimeHardwareHint, RealtimePerformanceProfile, RealtimeQualityTier } from "./types";

export const REALTIME_PERFORMANCE: Record<RealtimeQualityTier, RealtimePerformanceProfile> = {
  eco: { tier: "eco", label: "Eco", targetFps: 60, resolutionScale: 0.5, lodEnabled: true, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: true, textureCompression: true, autoQuality: true, aa: "off" },
  baixa: { tier: "baixa", label: "Baixa", targetFps: 60, resolutionScale: 0.7, lodEnabled: true, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: true, textureCompression: true, autoQuality: true, aa: "fxaa" },
  media: { tier: "media", label: "Média", targetFps: 60, resolutionScale: 0.85, lodEnabled: true, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: true, textureCompression: true, autoQuality: true, aa: "taa" },
  alta: { tier: "alta", label: "Alta", targetFps: 60, resolutionScale: 1.0, lodEnabled: true, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: true, textureCompression: true, autoQuality: true, aa: "taa" },
  ultra: { tier: "ultra", label: "Ultra", targetFps: 45, resolutionScale: 1.0, lodEnabled: true, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: false, textureCompression: false, autoQuality: false, aa: "msaa4x" },
  cinema: { tier: "cinema", label: "Cinema", targetFps: 24, resolutionScale: 1.25, lodEnabled: false, streamingEnabled: true, occlusionEnabled: true, instancingEnabled: true, mipmapsEnabled: false, textureCompression: false, autoQuality: false, aa: "msaa4x" },
};

export function detectHardware(): RealtimeHardwareHint {
  const nav: Navigator | undefined = typeof navigator === "undefined" ? undefined : navigator;
  const memGb = (nav as unknown as { deviceMemory?: number } | undefined)?.deviceMemory ?? 4;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(nav?.userAgent ?? "");
  const webgpu = typeof nav !== "undefined" && "gpu" in nav;
  const openxr = typeof nav !== "undefined" && "xr" in nav;
  let tier: 0 | 1 | 2 | 3 = 1;
  if (memGb >= 12 && cores >= 12) tier = 3;
  else if (memGb >= 8 && cores >= 8) tier = 2;
  else if (memGb >= 4 && cores >= 4) tier = 1;
  else tier = 0;
  return { gpuTier: tier, deviceMemoryGb: memGb, logicalCores: cores, mobile, webgpu, openxr };
}

export function autoQualityFor(h: RealtimeHardwareHint): RealtimeQualityTier {
  if (h.mobile && h.gpuTier <= 1) return "eco";
  if (h.mobile) return "baixa";
  if (h.gpuTier === 0) return "baixa";
  if (h.gpuTier === 1) return "media";
  if (h.gpuTier === 2) return "alta";
  return h.webgpu ? "ultra" : "alta";
}

export function performanceFor(tier: RealtimeQualityTier): RealtimePerformanceProfile {
  return REALTIME_PERFORMANCE[tier];
}