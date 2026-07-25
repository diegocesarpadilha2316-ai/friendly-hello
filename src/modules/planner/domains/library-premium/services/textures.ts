import type { LibraryPBRMaps } from "../types";

export const PBR_MAP_CHANNELS = [
  "albedo",
  "normal",
  "roughness",
  "ao",
  "height",
  "displacement",
  "metallic",
  "opacity",
  "emission",
] as const;

export function emptyPBR(): LibraryPBRMaps {
  return {
    albedo: null,
    normal: null,
    roughness: null,
    ao: null,
    metallic: null,
    displacement: null,
    opacity: null,
    emission: null,
  };
}

export function pbrCompleteness(maps: LibraryPBRMaps | null): number {
  if (!maps) return 0;
  const values = Object.values(maps);
  const filled = values.filter((v) => typeof v === "string" && v.length > 0).length;
  return values.length === 0 ? 0 : Math.round((filled / values.length) * 100);
}