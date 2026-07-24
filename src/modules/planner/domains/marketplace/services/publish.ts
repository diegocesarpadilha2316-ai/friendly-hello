/** Fase 3.25 — Catálogo de itens publicados no Marketplace (fonte determinística). */
import type {
  MarketplaceItem,
  MarketplaceCategoryId,
  MarketplaceManufacturerId,
  MarketplaceLicense,
  MarketplacePricing,
  MarketplaceRating,
} from "../types";
import { PLANNER_VERSION } from "../types";
import type { CatalogItem, CatalogCategoryId, CatalogManufacturerId } from "../../catalog/types";

function rating(avg: number, count: number): MarketplaceRating {
  const base = Math.max(0, count);
  const round = Math.round(avg * 10) / 10;
  return {
    average: round,
    count: base,
    distribution: {
      1: Math.floor(base * 0.02),
      2: Math.floor(base * 0.04),
      3: Math.floor(base * 0.1),
      4: Math.floor(base * 0.34),
      5: Math.max(0, base - Math.floor(base * 0.5)),
    },
  };
}

function pricing(kind: "free" | "paid", amount = 0): MarketplacePricing {
  return { kind, amount, currency: "BRL" };
}

function checksum(id: string, version: string): string {
  let hash = 5381;
  const src = `${id}@${version}`;
  for (let i = 0; i < src.length; i++) hash = ((hash << 5) + hash + src.charCodeAt(i)) | 0;
  return `sha256:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function blueprint(
  id: string,
  name: string,
  category: CatalogCategoryId,
  manufacturer: CatalogManufacturerId,
  defaults: CatalogItem["defaults"],
  basePrice: number,
): CatalogItem {
  return {
    id,
    sku: `MK-${id.toUpperCase()}`,
    name,
    description: name,
    category,
    subcategory: category,
    manufacturer,
    tags: [category, manufacturer],
    parametric: {
      widthMm: { min: 300, max: 2400, step: 10 },
      heightMm: { min: 200, max: 2700, step: 10 },
      depthMm: { min: 200, max: 900, step: 10 },
      thicknessMm: [15, 18, 25],
      shelves: { min: 0, max: 6 },
      doors: [0, 1, 2, 3, 4],
      drawers: [0, 1, 2, 3, 4, 5, 6],
      withLed: true,
      withGlass: true,
      withMirror: true,
    },
    defaults,
    basePrice,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

interface Seed {
  id: string;
  name: string;
  description: string;
  brand: MarketplaceManufacturerId;
  category: MarketplaceCategoryId;
  catalog: CatalogCategoryId;
  catalogBrand: CatalogManufacturerId;
  collectionId?: string;
  authorId: string;
  company: string;
  version: string;
  license: MarketplaceLicense;
  pricing: MarketplacePricing;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  favorites: number;
  tags: readonly string[];
  featured?: boolean;
  defaults: CatalogItem["defaults"];
  basePrice: number;
}

const SEEDS: readonly Seed[] = [
  {
    id: "mk-duratex-arya-cozinha",
    name: "Cozinha Arya (Duratex)",
    description: "Coleção Arya — móveis modulares para cozinha em MDF Duratex 18mm.",
    brand: "duratex", category: "cozinhas", catalog: "armario", catalogBrand: "duratex",
    collectionId: "col-duratex-arya",
    authorId: "aut-duratex", company: "Duratex", version: "1.4.0", license: "free",
    pricing: pricing("free"), downloads: 18420, ratingAvg: 4.8, ratingCount: 512, favorites: 2140,
    tags: ["cozinha", "modular", "mdf"], featured: true,
    defaults: { widthMm: 800, heightMm: 720, depthMm: 350, thicknessMm: 18, materialId: "mat-mdf-18-carvalho", handleId: "handle-alca-160", hingeId: "hinge-blum-clip-110" },
    basePrice: 1290,
  },
  {
    id: "mk-arauco-innova-closet",
    name: "Closet Innova (Arauco)",
    description: "Sistema de closet Arauco Innova com iluminação integrada.",
    brand: "arauco", category: "closets", catalog: "closet", catalogBrand: "arauco",
    collectionId: "col-arauco-innova",
    authorId: "aut-arauco", company: "Arauco", version: "2.0.1", license: "premium",
    pricing: pricing("paid", 249), downloads: 6820, ratingAvg: 4.7, ratingCount: 231, favorites: 980,
    tags: ["closet", "premium"], featured: true,
    defaults: { widthMm: 1000, heightMm: 2400, depthMm: 550, thicknessMm: 18 },
    basePrice: 4380,
  },
  {
    id: "mk-guararapes-slim-aereo",
    name: "Aéreo Slim (Guararapes)",
    description: "Aéreos slim Guararapes com portas basculantes.",
    brand: "guararapes", category: "cozinhas", catalog: "aereo", catalogBrand: "guararapes",
    authorId: "aut-guararapes", company: "Guararapes", version: "1.1.0", license: "free",
    pricing: pricing("free"), downloads: 4210, ratingAvg: 4.5, ratingCount: 118, favorites: 420,
    tags: ["aereo", "slim"],
    defaults: { widthMm: 800, heightMm: 700, depthMm: 320, thicknessMm: 18 },
    basePrice: 980,
  },
  {
    id: "mk-berneck-dorm-teen",
    name: "Dormitório Teen (Berneck)",
    description: "Coleção Teen Berneck — dormitórios modulares.",
    brand: "berneck", category: "dormitorios", catalog: "closet", catalogBrand: "berneck",
    authorId: "aut-berneck", company: "Berneck", version: "1.0.2", license: "free",
    pricing: pricing("free"), downloads: 2820, ratingAvg: 4.4, ratingCount: 84, favorites: 210,
    tags: ["dormitorio", "teen"],
    defaults: { widthMm: 1200, heightMm: 2200, depthMm: 550, thicknessMm: 18 },
    basePrice: 3280,
  },
  {
    id: "mk-sudati-perfil-gola",
    name: "Perfil Gola Sudati",
    description: "Perfis gola Sudati anodizados 3m.",
    brand: "sudati", category: "perfis", catalog: "perfil", catalogBrand: "sudati",
    authorId: "aut-sudati", company: "Sudati", version: "1.0.0", license: "free",
    pricing: pricing("free"), downloads: 6120, ratingAvg: 4.6, ratingCount: 142, favorites: 320,
    tags: ["perfil", "gola"],
    defaults: { widthMm: 3000, heightMm: 40, depthMm: 40, thicknessMm: 0 },
    basePrice: 180,
  },
  {
    id: "mk-blum-tandembox",
    name: "Blum Tandembox Antaro",
    description: "Corrediças Blum Tandembox Antaro com Blumotion.",
    brand: "blum", category: "gavetas", catalog: "gaveta", catalogBrand: "blum",
    collectionId: "col-blum-tandembox",
    authorId: "aut-blum", company: "Blum", version: "3.2.0", license: "premium",
    pricing: pricing("paid", 189), downloads: 9820, ratingAvg: 4.9, ratingCount: 612, favorites: 1420,
    tags: ["gaveta", "blum", "premium"], featured: true,
    defaults: { widthMm: 800, heightMm: 200, depthMm: 500, thicknessMm: 15, slideId: "slide-blum-tandembox-500" },
    basePrice: 720,
  },
  {
    id: "mk-hettich-actro",
    name: "Hettich Actro 5D",
    description: "Corrediças Hettich Actro 5D com ajuste em 5 eixos.",
    brand: "hettich", category: "ferragens", catalog: "ferragem", catalogBrand: "hettich",
    authorId: "aut-hettich", company: "Hettich", version: "1.5.0", license: "premium",
    pricing: pricing("paid", 149), downloads: 4210, ratingAvg: 4.7, ratingCount: 218, favorites: 512,
    tags: ["ferragem", "hettich"],
    defaults: { widthMm: 500, heightMm: 40, depthMm: 40, thicknessMm: 0 },
    basePrice: 540,
  },
  {
    id: "mk-fgv-slim-hinge",
    name: "Dobradiças FGV Slim",
    description: "Dobradiças FGV Slim 155° soft-close.",
    brand: "fgv", category: "ferragens", catalog: "ferragem", catalogBrand: "fgv",
    authorId: "aut-fgv", company: "FGV", version: "1.0.0", license: "free",
    pricing: pricing("free"), downloads: 3120, ratingAvg: 4.5, ratingCount: 96, favorites: 210,
    tags: ["dobradica", "fgv"],
    defaults: { widthMm: 50, heightMm: 30, depthMm: 15, thicknessMm: 0 },
    basePrice: 22,
  },
  {
    id: "mk-hafele-loox",
    name: "Häfele Loox LED",
    description: "Sistema de iluminação Häfele Loox 24V.",
    brand: "hafele", category: "iluminacao", catalog: "led", catalogBrand: "hafele",
    authorId: "aut-hafele", company: "Häfele", version: "2.1.0", license: "premium",
    pricing: pricing("paid", 129), downloads: 5210, ratingAvg: 4.8, ratingCount: 320, favorites: 680,
    tags: ["led", "iluminacao"], featured: true,
    defaults: { widthMm: 2000, heightMm: 20, depthMm: 20, thicknessMm: 0 },
    basePrice: 320,
  },
  {
    id: "mk-zen-suportes",
    name: "Suportes Zen Invisível",
    description: "Suportes de prateleira Zen — instalação invisível.",
    brand: "zen", category: "ferragens", catalog: "ferragem", catalogBrand: "dioris",
    authorId: "aut-zen", company: "Zen", version: "1.0.0", license: "free",
    pricing: pricing("free"), downloads: 2140, ratingAvg: 4.3, ratingCount: 62, favorites: 128,
    tags: ["suporte", "zen"],
    defaults: { widthMm: 200, heightMm: 30, depthMm: 30, thicknessMm: 0 },
    basePrice: 42,
  },
  {
    id: "mk-metalnox-puxadores",
    name: "Puxadores Metalnox Slim",
    description: "Puxadores Metalnox Slim em inox escovado.",
    brand: "metalnox", category: "ferragens", catalog: "ferragem", catalogBrand: "dioris",
    authorId: "aut-metalnox", company: "Metalnox", version: "1.2.0", license: "free",
    pricing: pricing("free"), downloads: 1820, ratingAvg: 4.4, ratingCount: 54, favorites: 92,
    tags: ["puxador", "metalnox"],
    defaults: { widthMm: 160, heightMm: 20, depthMm: 30, thicknessMm: 0 },
    basePrice: 38,
  },
  {
    id: "mk-dioris-ambiente-loft",
    name: "Ambiente Loft Completo (Dioris)",
    description: "Sala + cozinha integradas em estilo Loft Industrial.",
    brand: "dioris", category: "ambientes", catalog: "ilha", catalogBrand: "dioris",
    collectionId: "col-dioris-loft",
    authorId: "aut-dioris", company: "Dioris", version: "1.0.0", license: "marketplace",
    pricing: pricing("paid", 349), downloads: 3820, ratingAvg: 4.9, ratingCount: 210, favorites: 890,
    tags: ["ambiente", "loft", "premium"], featured: true,
    defaults: { widthMm: 2400, heightMm: 900, depthMm: 900, thicknessMm: 18 },
    basePrice: 12800,
  },
];

export const MARKETPLACE_ITEMS: readonly MarketplaceItem[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  brand: s.brand,
  category: s.category,
  catalogCategory: s.catalog,
  collectionId: s.collectionId,
  authorId: s.authorId,
  company: s.company,
  version: s.version,
  compatibility: {
    plannerMin: "3.20.0",
    plannerRecommended: PLANNER_VERSION,
    dependencies: [],
  },
  pricing: s.pricing,
  license: s.license,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  downloads: s.downloads,
  rating: rating(s.ratingAvg, s.ratingCount),
  favorites: s.favorites,
  tags: s.tags,
  images: [],
  preview3d: undefined,
  checksum: checksum(s.id, s.version),
  blueprint: blueprint(s.id, s.name, s.catalog, s.catalogBrand, s.defaults, s.basePrice),
  featured: Boolean(s.featured),
}));

export function listItems(): readonly MarketplaceItem[] {
  return MARKETPLACE_ITEMS;
}

export function getItem(id: string): MarketplaceItem | undefined {
  return MARKETPLACE_ITEMS.find((i) => i.id === id);
}

export function itemsByBrand(brand: MarketplaceManufacturerId): readonly MarketplaceItem[] {
  return MARKETPLACE_ITEMS.filter((i) => i.brand === brand);
}

export function itemsByCategory(category: MarketplaceCategoryId): readonly MarketplaceItem[] {
  return MARKETPLACE_ITEMS.filter((i) => i.category === category);
}
