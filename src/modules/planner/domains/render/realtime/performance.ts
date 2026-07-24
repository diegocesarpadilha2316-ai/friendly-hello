/**
 * Fase 3.17 — Perfis de performance + detecção de hardware.
 */
import type {
  RealtimeHardwareHint,
  RealtimePerformanceProfile,
  RealtimeQualityTier,
} from "./types";

export const REALTIME_PROFILES: Record<RealtimeQualityTier, RealtimePerformanceProfile> = {
  baixo: { tier: "baixo", label: "Baixo", targetFps: 60, maxLights: 4, maxShadowMaps: 1, resolutionScale: 0.65, aa: "fxaa", ssrEnabled: false, ssaoEnabled: false, bloomEnabled: false, rayTracingEnabled: false, pathTracingEnabled: false },
  medio: { tier: "medio", label: "Médio", targetFps: 60, maxLights: 8, maxShadowMaps: 2, resolutionScale: 0.85, aa: "taa", ssrEnabled: false, ssaoEnabled: true, bloomEnabled: true, rayTracingEnabled: false, pathTracingEnabled: false },
  alto: { tier: "alto", label: "Alto", targetFps: 60, maxLights: 16, maxShadowMaps: 4, resolutionScale: 1.0, aa: "taa", ssrEnabled: true, ssaoEnabled: true, bloomEnabled: true, rayTracingEnabled: false, pathTracingEnabled: false },
  ultra: { tier: "ultra", label: "Ultra", targetFps: 45, maxLights: 32, maxShadowMaps: 8, resolutionScale: 1.0, aa: "msaa4x", ssrEnabled: true, ssaoEnabled: true, bloomEnabled: true, rayTracingEnabled: true, pathTracingEnabled: false },
  cinema: { tier: "cinema", label: "Cinema", targetFps: 24, maxLights: 64, maxShadowMaps: 16, resolutionScale: 1.25, aa: "msaa4x", ssrEnabled: true, ssaoEnabled: true, bloomEnabled: true, rayTracingEnabled: true, pathTracingEnabled: true },
};

export function detectHardware(): RealtimeHardwareHint {
  const nav: Navigator | undefined = typeof navigator === "undefined" ? undefined : navigator;
  const memGb = (nav as unknown as { deviceMemory?: number } | undefined)?.deviceMemory ?? 4;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(nav?.userAgent ?? "");
  const webgpu = typeof nav !== "undefined" && "gpu" in nav;
  let tier: 0 | 1 | 2 | 3 = 1;
  if (memGb >= 12 && cores >= 12) tier = 3;
  else if (memGb >= 8 && cores >= 8) tier = 2;
  else if (memGb >= 4 && cores >= 4) tier = 1;
  else tier = 0;
  return { gpuTier: tier, deviceMemoryGb: memGb, logicalCores: cores, mobile, webgpu };
}

export function autoSelectQuality(h: RealtimeHardwareHint): RealtimeQualityTier {
  if (h.mobile || h.gpuTier === 0) return "baixo";
  if (h.gpuTier === 1) return "medio";
  if (h.gpuTier === 2) return "alto";
  return h.webgpu ? "ultra" : "alto";
}

export function profileFor(tier: RealtimeQualityTier): RealtimePerformanceProfile {
  return REALTIME_PROFILES[tier];
}