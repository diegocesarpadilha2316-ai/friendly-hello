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
  // ─── CHAPAS MADEIRADAS PREMIUM (Duratex / Arauco / Guararapes) ────────────
  { id: "pbr:freijo-natural", name: "Freijó Natural", manufacturer: "Duratex", line: "Essencial Wood", category: "chapa", pattern: "Freijó Natural", colorHex: "#a67549", slug: "wood_cabinet_worn_long", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:louro-freijo", name: "Louro Freijó", manufacturer: "Duratex", line: "Essencial Wood", category: "chapa", pattern: "Louro Freijó", colorHex: "#b8895a", slug: "wood_table_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:freijo-avelado", name: "Freijó Avelado", manufacturer: "Duratex", line: "Essencial Wood", category: "chapa", pattern: "Freijó Avelado", colorHex: "#8f5e34", slug: "wood_cabinet_worn_long", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-natural", name: "Carvalho Naturale", manufacturer: "Arauco", line: "Trend", category: "chapa", pattern: "Carvalho Naturale", colorHex: "#c9a074", slug: "oak_veneer_01", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-claro", name: "Carvalho Claro", manufacturer: "Arauco", line: "Trend", category: "chapa", pattern: "Carvalho Claro", colorHex: "#d6b48a", slug: "wood_table_001", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-cinza", name: "Carvalho Cinza", manufacturer: "Arauco", line: "Trend", category: "chapa", pattern: "Carvalho Cinza", colorHex: "#8a8578", slug: "wood_planks_grey", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:carvalho-nordico", name: "Carvalho Nórdico", manufacturer: "Arauco", line: "Trend", category: "chapa", pattern: "Carvalho Nórdico", colorHex: "#c7b294", slug: "wood_table_001", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:nogueira", name: "Nogueira Escura", manufacturer: "Guararapes", line: "Elegance", category: "chapa", pattern: "Nogueira", colorHex: "#5d3a1f", slug: "wood_floor_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:cumaru", name: "Cumaru", manufacturer: "Guararapes", line: "Elegance", category: "chapa", pattern: "Cumaru", colorHex: "#7a4a24", slug: "wood_table_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:imbuia", name: "Imbuia", manufacturer: "Guararapes", line: "Elegance", category: "chapa", pattern: "Imbuia", colorHex: "#4a2c18", slug: "wood_floor_worn", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:ipe", name: "Ipê", manufacturer: "Guararapes", line: "Elegance", category: "chapa", pattern: "Ipê", colorHex: "#8a5a2b", slug: "wood_cabinet_worn_long", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:amendoa", name: "Amêndoa", manufacturer: "Duratex", line: "Neutros", category: "chapa", pattern: "Amêndoa", colorHex: "#c6a684", slug: "wood_table_001", grain: "vertical", tileMm: [1250, 2500] },
  { id: "pbr:fendi", name: "Fendi", manufacturer: "Duratex", line: "Neutros", category: "chapa", pattern: "Fendi", colorHex: "#8f8579", slug: "wood_planks_grey", grain: "vertical", tileMm: [1250, 2500] },

  // ─── CHAPAS LISAS (TX / Absolutos) ────────────────────────────────────────
  { id: "pbr:branco-tx", name: "Branco TX", manufacturer: "Duratex", line: "Absolutos", category: "chapa", pattern: "Branco TX", colorHex: "#f4f2ee", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.15 },
  { id: "pbr:off-white", name: "Off White", manufacturer: "Duratex", line: "Absolutos", category: "chapa", pattern: "Off White", colorHex: "#ece7dc", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.1 },
  { id: "pbr:grafite", name: "Grafite", manufacturer: "Duratex", line: "Absolutos", category: "chapa", pattern: "Grafite", colorHex: "#3a3d42", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.05 },
  { id: "pbr:preto-absoluto", name: "Preto Absoluto", manufacturer: "Duratex", line: "Absolutos", category: "chapa", pattern: "Preto Absoluto", colorHex: "#181818", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0 },
  { id: "pbr:cinza-cristal", name: "Cinza Cristal", manufacturer: "Duratex", line: "Absolutos", category: "chapa", pattern: "Cinza Cristal", colorHex: "#a8adb2", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.05 },
  { id: "pbr:areia", name: "Areia", manufacturer: "Arauco", line: "Neutros", category: "chapa", pattern: "Areia", colorHex: "#d9c7a7", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.1 },
  { id: "pbr:verde-oliva", name: "Verde Oliva", manufacturer: "Arauco", line: "Cores", category: "chapa", pattern: "Verde Oliva", colorHex: "#5a6142", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.05 },
  { id: "pbr:azul-noite", name: "Azul Noite", manufacturer: "Arauco", line: "Cores", category: "chapa", pattern: "Azul Noite", colorHex: "#1f2c3f", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.05 },
  { id: "pbr:terracota", name: "Terracota", manufacturer: "Arauco", line: "Cores", category: "chapa", pattern: "Terracota", colorHex: "#a55a3d", slug: "painted_plaster_wall", grain: "livre", tileMm: [1250, 2500], roughnessBias: 0.05 },

  // ─── PEDRAS / MÁRMORES / QUARTZO ──────────────────────────────────────────
  { id: "pbr:calacatta", name: "Mármore Calacatta Bianco", manufacturer: "Dioris Stone", line: "Premium Marble", category: "tampo", pattern: "Calacatta Bianco", colorHex: "#efece5", slug: "marble_01", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.25 },
  { id: "pbr:nero-marquina", name: "Nero Marquina", manufacturer: "Dioris Stone", line: "Premium Marble", category: "tampo", pattern: "Nero Marquina", colorHex: "#1a1a1a", slug: "marble_01", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.3 },
  { id: "pbr:branco-absoluto-quartzo", name: "Quartzo Branco Absoluto", manufacturer: "Silestone", line: "Quartz", category: "tampo", pattern: "Branco Absoluto", colorHex: "#f6f4ef", slug: "marble_01", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.15 },
  { id: "pbr:cinza-concreto-tampo", name: "Quartzo Cinza Concreto", manufacturer: "Silestone", line: "Quartz", category: "tampo", pattern: "Cinza Concreto", colorHex: "#8b8b86", slug: "concrete_wall_007", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.1 },
  { id: "pbr:granito-preto-sao-gabriel", name: "Granito Preto São Gabriel", manufacturer: "Dioris Stone", line: "Granite", category: "tampo", pattern: "Preto São Gabriel", colorHex: "#242424", slug: "marble_01", grain: "livre", tileMm: [3000, 1500], roughnessBias: -0.05 },
  { id: "pbr:travertino", name: "Travertino Bege", manufacturer: "Dioris Stone", line: "Premium Marble", category: "revestimento", pattern: "Travertino", colorHex: "#c9b899", slug: "stone_tile_wall", grain: "livre", tileMm: [1500, 1500], roughnessBias: 0.15 },

  // ─── REVESTIMENTOS DE PAREDE ──────────────────────────────────────────────
  { id: "pbr:concreto", name: "Concreto Aparente", manufacturer: "Dioris Wall", line: "Industrial", category: "revestimento", pattern: "Concreto Cinza", colorHex: "#8f8b84", slug: "concrete_wall_007", grain: "livre", tileMm: [3000, 3000], roughnessBias: 0.1 },
  { id: "pbr:pedra-parede", name: "Revestimento Pedra Natural", manufacturer: "Dioris Wall", line: "Stone Wall", category: "revestimento", pattern: "Pedra Natural", colorHex: "#a89e8c", slug: "stone_tile_wall", grain: "livre", tileMm: [1500, 1500] },
  { id: "pbr:tijolo-branco", name: "Tijolo Branco Aparente", manufacturer: "Dioris Wall", line: "Rustic", category: "revestimento", pattern: "Tijolo Branco", colorHex: "#e6dfd4", slug: "red_brick_03", grain: "horizontal", tileMm: [1500, 1500], roughnessBias: 0.15 },
  { id: "pbr:tijolo-vermelho", name: "Tijolo Vermelho Rústico", manufacturer: "Dioris Wall", line: "Rustic", category: "revestimento", pattern: "Tijolo Vermelho", colorHex: "#8b4a3a", slug: "red_brick_03", grain: "horizontal", tileMm: [1500, 1500], roughnessBias: 0.15 },
  { id: "pbr:gesso-3d", name: "Painel 3D Gesso", manufacturer: "Dioris Wall", line: "3D Panels", category: "revestimento", pattern: "3D Ondas", colorHex: "#eae5df", slug: "painted_plaster_wall", grain: "livre", tileMm: [1000, 1000], roughnessBias: 0.2 },

  // ─── PISOS ────────────────────────────────────────────────────────────────
  { id: "pbr:piso-carvalho", name: "Piso Carvalho Escovado", manufacturer: "Durafloor", line: "Wood Flooring", category: "piso", pattern: "Piso Carvalho", colorHex: "#b6875a", slug: "wood_floor", grain: "vertical", tileMm: [2000, 4000] },
  { id: "pbr:piso-laminado", name: "Piso Laminado Freijó", manufacturer: "Durafloor", line: "Laminate", category: "piso", pattern: "Laminado Freijó", colorHex: "#a67f52", slug: "laminate_floor_02", grain: "vertical", tileMm: [2000, 4000] },
  { id: "pbr:piso-porcelanato-cimento", name: "Porcelanato Cimento Queimado", manufacturer: "Portobello", line: "Ceramica", category: "piso", pattern: "Cimento Queimado", colorHex: "#8f8b84", slug: "concrete_wall_007", grain: "livre", tileMm: [1200, 1200], roughnessBias: 0.05 },
  { id: "pbr:piso-porcelanato-marmore", name: "Porcelanato Calacatta", manufacturer: "Portobello", line: "Ceramica", category: "piso", pattern: "Porcelanato Calacatta", colorHex: "#eeeae2", slug: "marble_01", grain: "livre", tileMm: [1200, 1200], roughnessBias: -0.2 },
  { id: "pbr:piso-terracota", name: "Piso Terracota Rústico", manufacturer: "Portobello", line: "Rustic", category: "piso", pattern: "Terracota", colorHex: "#a56241", slug: "stone_tile_wall", grain: "livre", tileMm: [1000, 1000], roughnessBias: 0.2 },

  // ─── TECIDOS (Estofados / Cortinas) ───────────────────────────────────────
  { id: "pbr:linho-cru", name: "Linho Cru", manufacturer: "Dioris Textil", line: "Estofados", category: "revestimento", pattern: "Linho Cru", colorHex: "#d8ccb6", slug: "fabric_pattern_07", grain: "livre", tileMm: [800, 800], roughnessBias: 0.35 },
  { id: "pbr:boucle-off", name: "Bouclê Off White", manufacturer: "Dioris Textil", line: "Estofados", category: "revestimento", pattern: "Bouclê Off White", colorHex: "#ede4d4", slug: "fabric_pattern_07", grain: "livre", tileMm: [800, 800], roughnessBias: 0.4 },
  { id: "pbr:veludo-verde", name: "Veludo Verde Musgo", manufacturer: "Dioris Textil", line: "Estofados", category: "revestimento", pattern: "Veludo Musgo", colorHex: "#3d5040", slug: "fabric_pattern_07", grain: "livre", tileMm: [800, 800], roughnessBias: 0.25 },
  { id: "pbr:veludo-terracota", name: "Veludo Terracota", manufacturer: "Dioris Textil", line: "Estofados", category: "revestimento", pattern: "Veludo Terracota", colorHex: "#9c4e35", slug: "fabric_pattern_07", grain: "livre", tileMm: [800, 800], roughnessBias: 0.25 },

  // ─── METAIS ───────────────────────────────────────────────────────────────
  { id: "pbr:aco-escovado", name: "Aço Inox Escovado", manufacturer: "Dioris Metal", line: "Metal", category: "metal", pattern: "Aço Escovado", colorHex: "#c8ccd0", slug: "metal_plate", grain: "horizontal", tileMm: [600, 1200], roughnessBias: -0.3 },
  { id: "pbr:latao-escovado", name: "Latão Escovado", manufacturer: "Dioris Metal", line: "Metal", category: "metal", pattern: "Latão Escovado", colorHex: "#b89968", slug: "metal_plate", grain: "horizontal", tileMm: [600, 1200], roughnessBias: -0.2 },
  { id: "pbr:preto-fosco-metal", name: "Metal Preto Fosco", manufacturer: "Dioris Metal", line: "Metal", category: "metal", pattern: "Preto Fosco", colorHex: "#2a2a2a", slug: "metal_plate", grain: "horizontal", tileMm: [600, 1200], roughnessBias: 0.15 },
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

/**
 * Resolve um material PBR a partir de um rótulo humano (cor/nome/padrão).
 * Usado pela IA e por presets de acabamento para pintar automaticamente
 * um item com um material real. Retorna `null` quando não há match confiável.
 */
export function findPbrMaterialByLabel(label: string | null | undefined): PbrMaterial | null {
  if (!label) return null;
  const t = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!t) return null;
  const list = Array.from(CATALOG.values());
  const normp = (s: string | null | undefined) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  // 1) match exato por pattern normalizado
  const exact = list.find((m) => normp(m.pattern) === t);
  if (exact) return exact;
  // 2) match parcial (contains) em pattern ou nome
  const partial = list.find((m) => {
    const p = normp((m.pattern ?? "") + " " + m.name);
    return p.includes(t) || t.includes(p);
  });
  return partial ?? null;
}