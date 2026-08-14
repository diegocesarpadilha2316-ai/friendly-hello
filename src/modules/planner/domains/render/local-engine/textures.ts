/**
 * Fase 3.21 — Config de texturas (mipmaps, aniso, compressão, streaming).
 */
import type { LocalPerformanceTier, LocalTextureConfig } from "./types";

export function texturesForTier(tier: LocalPerformanceTier): LocalTextureConfig {
  switch (tier) {
    case "eco":
      return {
        mipmaps: true,
        anisotropy: 2,
        maxSize: 1024,
        compression: "basisu",
        streaming: true,
      };
    case "balanced":
      return {
        mipmaps: true,
        anisotropy: 4,
        maxSize: 2048,
        compression: "basisu",
        streaming: true,
      };
    case "alto":
      return { mipmaps: true, anisotropy: 8, maxSize: 4096, compression: "ktx2", streaming: true };
    case "extremo":
      return {
        mipmaps: true,
        anisotropy: 16,
        maxSize: 8192,
        compression: "none",
        streaming: false,
      };
  }
}
