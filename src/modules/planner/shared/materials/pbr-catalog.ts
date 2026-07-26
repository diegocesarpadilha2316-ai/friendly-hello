/**
 * Catálogo PBR 4K curado da Dioris (Parte 1 do enriquecimento visual).
 *
 * Materiais fotorrealistas com mapas Albedo + Normal + ARM (AO/Rough/Metal)
 * hospedados no CDN público do Poly Haven (CC0). Resolvidos sincronamente
 * — não passam pelo Supabase — via IDs com prefixo `pbr:`.
 *
 * Padrão de uso: qualquer parede, piso, teto, tampo ou móvel pode ter
 * `materialId: "pbr:calacatta"` que o Scene3D aplica textura real 2K,
 * normal map e mapa ARM com AO/roughness/metalness reais.
 */

import type { LibraryMaterial } from "../../domains/catalog/services/library-supabase";

export interface PbrMaps {
  readonly diffuse: string;
  readonly normal: string;
  readonly arm: string; // R=AO, G=Roughness, B=Metalness
}

export interface PbrMaterial extends LibraryMaterial {
  readonly maps: PbrMaps;
}

function polyHaven(slug: string, res: "2k" | "4k" = "2k"): PbrMaps {
  const base = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/${res}/${slug}`;
  return {
    diffuse: `${base}/${slug}_diff_${res}.jpg`,
    normal: `${base}/${slug}_nor_gl_${res}.jpg`,
    arm: `${base}/${slug}_arm_${res}.jpg`,
  };
}

interface CatalogSeed {
  id: string;
  name: string;
  manufacturer: string;
  line: string;
  category: LibraryMaterial["category"];
  pattern: string;
  colorHex: string;
  slug: string;
  grain: LibraryMaterial["grain"];
  tileMm: readonly [number, number];
  roughnessBias?: number;
}

const SEEDS: readonly CatalogSeed[] = [
  // ─── MADEIRAS ─────────────────────────────────────────────────────────────
  { id: "pbr:freijo-natural", name: "Freijó Natural PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Freijó Natural", colorHex: "#a67549", slug: "wood_cabinet_worn_long", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:louro-freijo", name: "Louro Freijó PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Louro Freijó", colorHex: "#b8895a", slug: "wood_table_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-natural", name: "Carvalho Natural PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Carvalho Natural", colorHex: "#c9a074", slug: "oak_veneer_01", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-claro", name: "Carvalho Claro PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Carvalho Claro", colorHex: "#d6b48a", slug: "wood_table_001", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:nogueira", name: "Nogueira Escura PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Nogueira", colorHex: "#5d3a1f", slug: "wood_floor_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-cinza", name: "Carvalho Cinza PBR", manufacturer: "Dioris", line: "Premium Woods", category: "chapa", pattern: "Carvalho Cinza", colorHex: "#8a8578", slug: "wood_planks_grey", grain: "vertical", tileMm: [1250, 2500] },

  // ─── PISOS ────────────────────────────────────────────────────────────────
  { id: "pbr:piso-carvalho", name: "Piso Carvalho PBR", manufacturer: "Dioris", line: "Flooring", category: "piso", pattern: "Piso Carvalho", colorHex: "#b6875a", slug: "wood_floor", grain: "vertical", tileMm: [2000, 4000] },
  { id: "pbr:piso-laminado", name: "Piso Laminado Freijó PBR", manufacturer: "Dioris", line: "Flooring", category: "piso", pattern: "Laminado Freijó", colorHex: "#a67f52", slug: "laminate_floor_02", grain: "vertical", tileMm: [2000, 4000] },

  // ─── PEDRAS ───────────────────────────────────────────────────────────────
  { id: "pbr:calacatta", name: "Mármore Calacatta PBR", manufacturer: "Dioris", line: "Stone Premium", category: "tampo", pattern: "Calacatta Bianco", colorHex: "#efece5", slug: "marble_01", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.25 },
  { id: "pbr:concreto", name: "Concreto Aparente PBR", manufacturer: "Dioris", line: "Concrete", category: "revestimento", pattern: "Concreto Cinza", colorHex: "#8f8b84", slug: "concrete_wall_007", grain: "livre", tileMm: [3000, 3000], roughnessBias: 0.1 },
  { id: "pbr:pedra-parede", name: "Revestimento Pedra Natural PBR", manufacturer: "Dioris", line: "Stone Wall", category: "revestimento", pattern: "Pedra Natural", colorHex: "#a89e8c", slug: "stone_tile_wall", grain: "livre", tileMm: [1500, 1500] },

  // ─── METAL ────────────────────────────────────────────────────────────────
  { id: "pbr:aco-escovado", name: "Aço Inox Escovado PBR", manufacturer: "Dioris", line: "Metal", category: "metal", pattern: "Aço Escovado", colorHex: "#c8ccd0", slug: "metal_plate", grain: "horizontal", tileMm: [600, 1200], roughnessBias: -0.3 },
];

function toMaterial(seed: CatalogSeed): PbrMaterial {
  return {
    id: seed.id,
    name: seed.name,
    manufacturer: seed.manufacturer,
    line: seed.line,
    category: seed.category,
    pattern: seed.pattern,
    colorName: seed.pattern,
    colorHex: seed.colorHex,
    textureUrl: polyHaven(seed.slug).diffuse,
    thicknessMm: 18,
    widthMm: seed.tileMm[0],
    lengthMm: seed.tileMm[1],
    grain: seed.grain,
    pricePerM2: null,
    maps: polyHaven(seed.slug),
  };
}

const CATALOG = new Map<string, PbrMaterial>(SEEDS.map((s) => [s.id, toMaterial(s)]));

/** Roughness/AO override por material (usado como bias sobre defaults do Scene3D). */
const ROUGHNESS_BIAS = new Map<string, number>(
  SEEDS.filter((s) => s.roughnessBias != null).map((s) => [s.id, s.roughnessBias!]),
);

export function getPbrMaterial(id: string): PbrMaterial | null {
  return CATALOG.get(id) ?? null;
}

export function listPbrMaterials(): readonly PbrMaterial[] {
  return Array.from(CATALOG.values());
}

export function isPbrId(id: string | undefined | null): boolean {
  return typeof id === "string" && id.startsWith("pbr:");
}

export function getPbrRoughnessBias(id: string | undefined | null): number {
  if (!id) return 0;
  return ROUGHNESS_BIAS.get(id) ?? 0;
}