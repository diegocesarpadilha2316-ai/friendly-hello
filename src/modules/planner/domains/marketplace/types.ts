/**
 * Fase 3.25 — Marketplace de Componentes + Biblioteca Online Enterprise.
 *
 * Modelos imutáveis session-only. Zero providers/stores/managers/banco.
 * A instalação de um item transforma-o em `CatalogItem` (Fase 3.24) e a
 * inserção continua passando por `updateProject()` do PlannerEditorProvider.
 */
import type { CatalogCategoryId, CatalogManufacturerId, CatalogItem } from "../catalog/types";

export type MarketplaceCategoryId =
  | "cozinhas"
  | "dormitorios"
  | "closets"
  | "banheiros"
  | "escritorios"
  | "lavanderias"
  | "salas"
  | "paineis"
  | "portas"
  | "gavetas"
  | "ferragens"
  | "perfis"
  | "iluminacao"
  | "vidros"
  | "espelhos"
  | "decoracao"
  | "objetos"
  | "ambientes";

export type MarketplaceManufacturerId = CatalogManufacturerId | "sudati" | "zen" | "metalnox";

export type MarketplaceLicense = "free" | "premium" | "empresa" | "marketplace";

export interface MarketplaceAuthor {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly verified: boolean;
  readonly avatar?: string;
}

export interface MarketplaceCollection {
  readonly id: string;
  readonly name: string;
  readonly ownerKind: "fabricante" | "empresa" | "usuario" | "marketplace";
  readonly ownerId: string;
  readonly itemIds: readonly string[];
  readonly description: string;
}

export interface MarketplaceCompatibility {
  readonly plannerMin: string;
  readonly plannerRecommended: string;
  readonly dependencies: readonly string[];
}

export interface MarketplacePricing {
  readonly kind: "free" | "paid";
  readonly amount: number;
  readonly currency: "BRL";
}

export interface MarketplaceReview {
  readonly id: string;
  readonly itemId: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly stars: 1 | 2 | 3 | 4 | 5;
  readonly comment: string;
  readonly likes: number;
  readonly createdAt: string;
}

export interface MarketplaceRating {
  readonly average: number;
  readonly count: number;
  readonly distribution: Readonly<Record<1 | 2 | 3 | 4 | 5, number>>;
}

export interface MarketplaceItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly brand: MarketplaceManufacturerId;
  readonly category: MarketplaceCategoryId;
  readonly catalogCategory: CatalogCategoryId;
  readonly collectionId?: string;
  readonly authorId: string;
  readonly company: string;
  readonly version: string;
  readonly compatibility: MarketplaceCompatibility;
  readonly pricing: MarketplacePricing;
  readonly license: MarketplaceLicense;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly downloads: number;
  readonly rating: MarketplaceRating;
  readonly favorites: number;
  readonly tags: readonly string[];
  readonly images: readonly string[];
  readonly preview3d?: string;
  readonly checksum: string;
  readonly blueprint: CatalogItem;
  readonly featured: boolean;
}

export type MarketplaceInstallStatus =
  "not_installed" | "installed" | "update_available" | "removed";

export interface MarketplaceInstalledRecord {
  readonly itemId: string;
  readonly version: string;
  readonly installedAt: string;
  readonly updatedAt: string;
}

export interface MarketplaceInstalledState {
  readonly records: readonly MarketplaceInstalledRecord[];
}

export interface MarketplaceFavoritesState {
  readonly itemIds: readonly string[];
}

export interface MarketplaceSearchFilters {
  readonly query?: string;
  readonly categories?: readonly MarketplaceCategoryId[];
  readonly brands?: readonly MarketplaceManufacturerId[];
  readonly collections?: readonly string[];
  readonly tags?: readonly string[];
  readonly free?: boolean;
  readonly paid?: boolean;
  readonly minRating?: number;
  readonly plannerVersion?: string;
}

export interface MarketplaceAnalyticsSnapshot {
  readonly totalItems: number;
  readonly totalDownloads: number;
  readonly totalInstalled: number;
  readonly totalUpdates: number;
  readonly totalFavorites: number;
  readonly totalCollections: number;
  readonly topBrand: MarketplaceManufacturerId | null;
  readonly topCategory: MarketplaceCategoryId | null;
  readonly mostDownloaded: string | null;
}

export const PLANNER_VERSION = "3.25.0" as const;
