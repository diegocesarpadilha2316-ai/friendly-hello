import type { LibraryMaterial, LibraryPBRMaps } from "../types";

export function derivePBRMaps(material: LibraryMaterial): LibraryPBRMaps {
  const base = material.textureUrl;
  if (!base) {
    return { albedo: null, normal: null, roughness: null, ao: null, metallic: null, displacement: null, opacity: null, emission: null };
  }
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : ".jpg";
  const map = (s: string) => stem + "_" + s + ext;
  return { albedo: base, normal: map("normal"), roughness: map("roughness"), ao: map("ao"), metallic: map("metallic"), displacement: map("displacement"), opacity: null, emission: null };
}

export function tileForMaterial(material: LibraryMaterial): { readonly x: number; readonly y: number } {
  const w = (material.widthMm ?? 2750) / 1000;
  const l = (material.lengthMm ?? 1850) / 1000;
  return material.grain === "horizontal" ? { x: l, y: w } : { x: w, y: l };
}