/**
 * Fase 3.24 — Tipos do Catálogo Paramétrico Inteligente.
 *
 * Modelos leves, imutáveis, agnósticos de UI/persistência. Nenhum provider
 * ou store é criado. Toda mutação persistente continua passando por
 * `updateProject()` do PlannerEditorProvider (Fase 3.1).
 */

export type CatalogCategoryId =
  | "armario"
  | "balcao"
  | "aereo"
  | "torre"
  | "closet"
  | "painel"
  | "nicho"
  | "cristaleira"
  | "tampo"
  | "ilha"
  | "prateleira"
  | "porta"
  | "gaveta"
  | "divisoria"
  | "ferragem"
  | "led"
  | "perfil"
  | "vidro"
  | "espelho"
  | "rodape"
  | "pe"
  | "acessorio";

export type CatalogManufacturerId =
  | "duratex"
  | "arauco"
  | "guararapes"
  | "berneck"
  | "sudati"
  | "blum"
  | "hettich"
  | "fgv"
  | "hafele"
  | "dioris";

export interface CatalogManufacturer {
  readonly id: CatalogManufacturerId;
  readonly name: string;
  readonly country: string;
  readonly categories: readonly CatalogCategoryId[];
  readonly premium: boolean;
}

export interface CatalogCollection {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly line: string;
  readonly year: number;
  readonly tags: readonly string[];
}

export interface CatalogMaterial {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly kind: "mdf" | "mdp" | "hdf" | "compensado" | "macico" | "metal" | "vidro" | "espelho";
  readonly thicknessesMm: readonly number[];
  readonly grain: boolean;
  readonly finish: "fosco" | "acetinado" | "brilhante" | "texturizado";
  readonly pricePerM2: number;
}

export interface CatalogTexture {
  readonly id: string;
  readonly name: string;
  readonly materialId: string;
  readonly albedo: string;
  readonly normal?: string;
  readonly roughness?: string;
  readonly metallic?: string;
  readonly tileMm: readonly [number, number];
}

export interface CatalogColor {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly ral?: string;
  readonly ncs?: string;
}

export interface CatalogHandle {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly kind: "puxador" | "cava" | "gola" | "toque";
  readonly lengthMm: number;
  readonly finish: string;
  readonly price: number;
}

export interface CatalogHinge {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly angleDeg: 90 | 110 | 155 | 165 | 175;
  readonly softClose: boolean;
  readonly price: number;
}

export interface CatalogSlide {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly kind: "telescopica" | "oculta" | "sincronizada";
  readonly lengthMm: number;
  readonly loadKg: number;
  readonly softClose: boolean;
  readonly price: number;
}

export interface CatalogProfile {
  readonly id: string;
  readonly name: string;
  readonly kind: "aluminio" | "acabamento" | "cantoneira" | "rodape";
  readonly lengthMm: number;
  readonly pricePerM: number;
}

export interface CatalogGlass {
  readonly id: string;
  readonly name: string;
  readonly kind: "temperado" | "laminado" | "comum" | "reflectivo";
  readonly thicknessMm: number;
  readonly pricePerM2: number;
}

export interface CatalogMirror {
  readonly id: string;
  readonly name: string;
  readonly kind: "prata" | "bronze" | "fume" | "antique";
  readonly thicknessMm: number;
  readonly pricePerM2: number;
}

export interface CatalogLed {
  readonly id: string;
  readonly name: string;
  readonly kind: "fita" | "perfil" | "spot" | "sensor";
  readonly cct: 2700 | 3000 | 4000 | 5000 | 6500;
  readonly wattsPerM: number;
  readonly ip: 20 | 44 | 65 | 67;
  readonly pricePerM: number;
}

export interface CatalogAccessory {
  readonly id: string;
  readonly name: string;
  readonly kind: "cesto" | "porta-talheres" | "lixeira" | "cabideiro" | "sapateira" | "outros";
  readonly manufacturer: CatalogManufacturerId;
  readonly price: number;
}

export interface CatalogParametric {
  readonly widthMm: { readonly min: number; readonly max: number; readonly step: number };
  readonly heightMm: { readonly min: number; readonly max: number; readonly step: number };
  readonly depthMm: { readonly min: number; readonly max: number; readonly step: number };
  readonly thicknessMm: readonly number[];
  readonly shelves: { readonly min: number; readonly max: number };
  readonly doors: readonly (0 | 1 | 2 | 3 | 4)[];
  readonly drawers: readonly (0 | 1 | 2 | 3 | 4 | 5 | 6)[];
  readonly withLed: boolean;
  readonly withGlass: boolean;
  readonly withMirror: boolean;
}

export interface CatalogItem {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly description: string;
  readonly category: CatalogCategoryId;
  readonly subcategory: string;
  readonly manufacturer: CatalogManufacturerId;
  readonly collectionId?: string;
  readonly tags: readonly string[];
  readonly thumbnail?: string;
  readonly parametric: CatalogParametric;
  readonly defaults: {
    readonly widthMm: number;
    readonly heightMm: number;
    readonly depthMm: number;
    readonly thicknessMm: number;
    readonly materialId?: string;
    readonly handleId?: string;
    readonly hingeId?: string;
    readonly slideId?: string;
  };
  readonly basePrice: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CatalogVariant {
  readonly id: string;
  readonly itemId: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly materialId?: string;
  readonly handleId?: string;
  readonly extras: Readonly<Record<string, string | number | boolean>>;
  readonly pricingHint?: number;
}

export interface CatalogPricingBreakdown {
  readonly base: number;
  readonly material: number;
  readonly hardware: number;
  readonly extras: number;
  readonly total: number;
}

export interface CatalogSearchFilters {
  readonly query?: string;
  readonly categories?: readonly CatalogCategoryId[];
  readonly manufacturers?: readonly CatalogManufacturerId[];
  readonly tags?: readonly string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly withLed?: boolean;
  readonly withGlass?: boolean;
  readonly withMirror?: boolean;
}

export interface CatalogPreviewMode {
  readonly id: "2d" | "3d" | "explodido" | "estrutura" | "producao";
  readonly label: string;
}

export interface CatalogRule {
  readonly id: string;
  readonly when: (item: CatalogItem, variant: CatalogVariant) => boolean;
  readonly message: string;
  readonly severity: "info" | "warn" | "error";
}

export interface CatalogFavoritesState {
  readonly itemIds: readonly string[];
}

export interface CatalogRecentsState {
  readonly itemIds: readonly string[];
}