/**
 * Fase 3.29 — Tipos da Biblioteca Oficial Premium.
 *
 * Camada 100% aditiva. Reutiliza os tipos da Biblioteca Oficial (Fase 3.26)
 * como fonte única de verdade. Nenhum store/provider/manager novo.
 */
import type {
  LibraryMaterial,
  LibraryHardware,
  LibraryPBRMaps,
  LibrarySearchFilters,
  LibraryExportFormat,
  LibraryImportReport,
} from "../../library/types";

export type {
  LibraryMaterial,
  LibraryHardware,
  LibraryPBRMaps,
  LibrarySearchFilters,
  LibraryExportFormat,
  LibraryImportReport,
};

/** Categorias oficiais de materiais suportadas pela Biblioteca Premium. */
export const PREMIUM_MATERIAL_CATEGORIES = [
  "MDF",
  "MDP",
  "Compensado",
  "Multilaminado",
  "Madeira Maciça",
  "Vidro",
  "Espelho",
  "Acrílico",
  "Metal",
  "Alumínio",
  "Inox",
  "Pedra",
  "Granito",
  "Quartzo",
  "Mármore",
  "Porcelanato",
  "Tecido",
  "Couro",
  "Laca",
  "Pintura",
  "Laminado",
  "Fita de Borda",
  "Perfil",
  "LED",
] as const;
export type PremiumMaterialCategory = (typeof PREMIUM_MATERIAL_CATEGORIES)[number];

/** Categorias oficiais de ferragens. */
export const PREMIUM_HARDWARE_CATEGORIES = [
  "Corrediça",
  "Dobradiça",
  "Pistão",
  "Puxador",
  "Perfil",
  "Rodízio",
  "Pé",
  "Minifix",
  "Cavilha",
  "Parafuso",
  "Conector",
  "Cabideiro",
  "Calceiro",
  "Aramado",
  "Organizador",
] as const;
export type PremiumHardwareCategory = (typeof PREMIUM_HARDWARE_CATEGORIES)[number];

/** Fabricantes oficiais preparados pela Biblioteca Premium. */
export const PREMIUM_MANUFACTURERS = [
  "Duratex",
  "Arauco",
  "Guararapes",
  "Eucatex",
  "Berneck",
  "Sudati",
  "Greenplac",
  "Masisa",
  "Blum",
  "Hettich",
  "FGV",
  "Häfele",
  "Rometal",
  "Zen",
  "Gavetaço",
  "Bigfer",
  "Archi",
  "Albras",
] as const;
export type PremiumManufacturer = (typeof PREMIUM_MANUFACTURERS)[number];

/** Tipos de vidro suportados. */
export const GLASS_TYPES = [
  "Incolor",
  "Fumê",
  "Reflecta",
  "Bronze",
  "Canelado",
  "Acidato",
  "Temperado",
  "Laminado",
] as const;
export type GlassType = (typeof GLASS_TYPES)[number];

/** Tipos de espelho suportados. */
export const MIRROR_TYPES = ["Prata", "Bronze", "Fumê", "Bisotê", "Lapidado"] as const;
export type MirrorType = (typeof MIRROR_TYPES)[number];

/** Acabamentos suportados. */
export const FINISH_TYPES = ["Fosco", "Acetinado", "Brilho", "Alto Brilho", "Texturizado"] as const;
export type FinishType = (typeof FINISH_TYPES)[number];

/** Perfis / componentes LED. */
export const LED_COMPONENTS = [
  "Perfil",
  "Fonte",
  "Controlador",
  "RGB",
  "RGBW",
  "COB",
  "Warm",
  "Neutral",
  "Cold",
] as const;
export type LEDComponent = (typeof LED_COMPONENTS)[number];

/** Cor Premium — representação normalizada. */
export interface PremiumColor {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
  readonly collection: string | null;
  readonly finish: FinishType | null;
  readonly hex: string | null;
  readonly previewUrl: string | null;
  readonly pbr: LibraryPBRMaps | null;
}

/** Coleção de materiais/ferragens de um fabricante. */
export interface PremiumCollection {
  readonly id: string;
  readonly manufacturer: string;
  readonly name: string;
  readonly kind: "material" | "hardware" | "led" | "glass" | "mirror";
  readonly itemCount: number;
}

/** Item favorito genérico. */
export interface PremiumFavorite {
  readonly id: string;
  readonly kind: "material" | "hardware";
  readonly addedAt: number;
}

/** Formatos suportados na importação. */
export type PremiumImportFormat =
  "csv" | "excel" | "xml" | "json" | "zip" | "promob" | "sketchup" | "custom";

/** Formatos suportados na exportação. */
export type PremiumExportFormat = "csv" | "excel" | "xml" | "json" | "zip";

/** Métricas globais da biblioteca. */
export interface PremiumLibraryStats {
  readonly totalMaterials: number;
  readonly totalHardware: number;
  readonly totalManufacturers: number;
  readonly totalCollections: number;
  readonly totalFavorites: number;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byManufacturer: Readonly<Record<string, number>>;
}

/** Estado de sincronização futura (preparação — sem chamada real nesta fase). */
export interface PremiumSyncState {
  readonly lastSyncAt: number | null;
  readonly pending: number;
  readonly status: "idle" | "syncing" | "ready" | "error";
  readonly message: string | null;
}
