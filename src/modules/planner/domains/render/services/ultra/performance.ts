/**
 * Fase 3.12 — Configuração de performance por preset.
 * LOD / instancing / lazy loading / texture streaming / cache /
 * compression / GPU optimization / mipmaps.
 */
import type { RenderPresetId } from "../../types";
import type { PerformanceConfig } from "../../types/ultra";

const BASE: PerformanceConfig = {
  lod: true,
  instancing: true,
  lazyLoading: true,
  textureStreaming: true,
  cache: true,
  compression: "ktx2",
  gpuOptimization: true,
  mipmaps: true,
  maxTextureSizePx: 2048,
  maxTrianglesPerFrame: 2_000_000,
};

export const PERFORMANCE_BY_PRESET: Readonly<Record<RenderPresetId, PerformanceConfig>> = {
  rascunho: {
    ...BASE,
    maxTextureSizePx: 1024,
    maxTrianglesPerFrame: 500_000,
    compression: "basisu",
  },
  baixa: { ...BASE, maxTextureSizePx: 1024, maxTrianglesPerFrame: 1_000_000 },
  media: { ...BASE, maxTextureSizePx: 2048, maxTrianglesPerFrame: 2_000_000 },
  alta: { ...BASE, maxTextureSizePx: 4096, maxTrianglesPerFrame: 5_000_000 },
  ultra: { ...BASE, maxTextureSizePx: 8192, maxTrianglesPerFrame: 12_000_000 },
  fotografica: { ...BASE, maxTextureSizePx: 8192, maxTrianglesPerFrame: 18_000_000 },
  marketing: { ...BASE, maxTextureSizePx: 8192, maxTrianglesPerFrame: 15_000_000 },
  cinema: {
    ...BASE,
    maxTextureSizePx: 8192,
    maxTrianglesPerFrame: 24_000_000,
    compression: "ktx2",
  },
};

export function performanceForPreset(id: RenderPresetId): PerformanceConfig {
  return PERFORMANCE_BY_PRESET[id];
}
