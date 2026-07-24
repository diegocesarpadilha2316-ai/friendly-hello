/** Fase 3.25 — Analytics determinístico (session-only). */
import type { MarketplaceAnalyticsSnapshot, MarketplaceCategoryId, MarketplaceManufacturerId } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";
import { MARKETPLACE_COLLECTIONS } from "./collections";
import { readInstalled } from "./install";
import { readFavorites } from "./favorites";
import { pendingUpdates } from "./updates";

export function snapshot(): MarketplaceAnalyticsSnapshot {
  const brandCount = new Map<MarketplaceManufacturerId, number>();
  const categoryCount = new Map<MarketplaceCategoryId, number>();
  for (const item of MARKETPLACE_ITEMS) {
    brandCount.set(item.brand, (brandCount.get(item.brand) ?? 0) + item.downloads);
    categoryCount.set(item.category, (categoryCount.get(item.category) ?? 0) + item.downloads);
  }
  const topBrand = [...brandCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostDownloaded = [...MARKETPLACE_ITEMS].sort((a, b) => b.downloads - a.downloads)[0]?.id ?? null;
  return {
    totalItems: MARKETPLACE_ITEMS.length,
    totalDownloads: MARKETPLACE_ITEMS.reduce((sum, i) => sum + i.downloads, 0),
    totalInstalled: readInstalled().records.length,
    totalUpdates: pendingUpdates().length,
    totalFavorites: readFavorites().itemIds.length,
    totalCollections: MARKETPLACE_COLLECTIONS.length,
    topBrand,
    topCategory,
    mostDownloaded,
  };
}
