/**
 * Fase 3.30 — Consumo real dos slots PBR.
 *
 * Normaliza o material PBR em um dicionário `slot → URL|null|params`
 * pronto para consumo pelo Three.js/R3F já existente.
 */
import type { PbrMapSlot, PbrMaterial } from "../types";

export interface ResolvedPBRMaps {
  readonly albedo: string | null;
  readonly normal: string | null;
  readonly roughness: string | null;
  readonly metallic: string | null;
  readonly ao: string | null;
  readonly displacement: string | null;
  readonly opacity: string | null;
  readonly emission: string | null;
  readonly tiling: readonly [number, number];
  readonly baseColorHex: string;
  readonly roughnessValue: number;
  readonly metallicValue: number;
  readonly ior: number;
  readonly transmission: number;
  readonly emissiveValue: number;
}

const SLOTS: readonly PbrMapSlot[] = [
  "albedo",
  "normal",
  "roughness",
  "metallic",
  "displacement",
  "ao",
  "opacity",
  "emission",
];

export function resolvePBR(material: PbrMaterial): ResolvedPBRMaps {
  const bySlot = new Map(material.maps.map((m) => [m.slot, m]));
  const get = (s: PbrMapSlot): string | null => bySlot.get(s)?.url ?? null;
  const anyMap = material.maps[0];
  const tiling = (anyMap?.tiling ?? [1, 1]) as readonly [number, number];
  return {
    albedo: get("albedo"),
    normal: get("normal"),
    roughness: get("roughness"),
    metallic: get("metallic"),
    ao: get("ao"),
    displacement: get("displacement"),
    opacity: get("opacity"),
    emission: get("emission"),
    tiling,
    baseColorHex: material.baseColorHex,
    roughnessValue: material.roughness,
    metallicValue: material.metallic,
    ior: material.ior,
    transmission: material.transmission,
    emissiveValue: material.emissive,
  };
}

export function pbrCoverage(material: PbrMaterial): number {
  const filled = SLOTS.filter((s) => material.maps.find((m) => m.slot === s && m.url)).length;
  return Math.round((filled / SLOTS.length) * 100);
}
