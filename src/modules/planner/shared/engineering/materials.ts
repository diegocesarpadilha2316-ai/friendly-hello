/**
 * Catálogo semente de marcas de chapa (Fase 3.5).
 * Estrutura estática, tree-shakeable, sem consultas remotas. A camada
 * de sincronização futura apenas expande estes registros.
 */
import type { MaterialBrand } from "./types";

function finish(id: string, label: string, swatch: string, grain: "vertical" | "horizontal" | "livre" = "livre") {
  return { id, label, swatch, grain };
}

const COMMON_FINISHES = [
  finish("branco-tx", "Branco TX", "#F4F4F4"),
  finish("preto-tx", "Preto TX", "#141414"),
  finish("grafite", "Grafite", "#3A3D42"),
  finish("cinza-cristal", "Cinza Cristal", "#B2B4B8"),
  finish("carvalho-natural", "Carvalho Naturale", "#C9A87A", "vertical"),
  finish("nogueira", "Nogueira", "#6B4A2B", "vertical"),
  finish("freijo", "Freijó", "#8B5E3C", "vertical"),
  finish("itapua", "Itapuã", "#9E7B4F", "vertical"),
];

const STD_THICK = [
  { mm: 3 }, { mm: 6 }, { mm: 9 }, { mm: 15 }, { mm: 18 }, { mm: 25 },
];

export const MATERIAL_BRANDS: readonly MaterialBrand[] = [
  {
    id: "duratex",
    label: "Duratex (Dexco)",
    country: "BR",
    website: "https://dex.co",
    category: "MDF",
    thicknesses: STD_THICK,
    finishes: [
      ...COMMON_FINISHES,
      finish("essencial-wood", "Essencial Wood", "#8A6A47", "vertical"),
      finish("terracota", "Terracota", "#B24E3A"),
    ],
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "guararapes",
    label: "Guararapes",
    country: "BR",
    website: "https://guararapes.com.br",
    category: "MDF",
    thicknesses: STD_THICK,
    finishes: [
      ...COMMON_FINISHES,
      finish("bali", "Bali", "#A3835B", "vertical"),
      finish("marmore-carrara", "Mármore Carrara", "#E9E7E2"),
    ],
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "arauco",
    label: "Arauco",
    country: "CL",
    website: "https://arauco.cl",
    category: "MDP",
    thicknesses: STD_THICK,
    finishes: [
      ...COMMON_FINISHES,
      finish("teka", "Teka", "#8E6440", "vertical"),
      finish("azul-petroleo", "Azul Petróleo", "#274B5F"),
    ],
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "berneck",
    label: "Berneck",
    country: "BR",
    website: "https://berneck.com.br",
    category: "MDF",
    thicknesses: STD_THICK,
    finishes: [
      ...COMMON_FINISHES,
      finish("noce-milano", "Noce Milano", "#5C3E24", "vertical"),
      finish("verde-oliva", "Verde Oliva", "#4C5A34"),
    ],
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "sudati",
    label: "Sudati",
    country: "BR",
    website: "https://sudati.com.br",
    category: "MDF",
    thicknesses: STD_THICK,
    finishes: [
      ...COMMON_FINISHES,
      finish("carvalho-lyon", "Carvalho Lyon", "#B58E5A", "vertical"),
      finish("terra-mate", "Terra Mate", "#7C4B32"),
    ],
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export function findBrand(id: string) {
  return MATERIAL_BRANDS.find((b) => b.id === id) ?? null;
}

export function findFinish(brandId: string, finishId: string) {
  const b = findBrand(brandId);
  if (!b) return null;
  return b.finishes.find((f) => f.id === finishId) ?? null;
}

export function listThicknesses(brandId: string): readonly number[] {
  const b = findBrand(brandId);
  return (b?.thicknesses ?? []).map((t) => t.mm);
}