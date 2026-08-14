/** Fase 3.25 — Curadoria: destaques, novidades, mais baixados. */
import type { MarketplaceItem } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";

export function featured(): readonly MarketplaceItem[] {
  return MARKETPLACE_ITEMS.filter((i) => i.featured);
}

export function mostDownloaded(limit = 10): readonly MarketplaceItem[] {
  return [...MARKETPLACE_ITEMS].sort((a, b) => b.downloads - a.downloads).slice(0, limit);
}

export function mostFavorited(limit = 10): readonly MarketplaceItem[] {
  return [...MARKETPLACE_ITEMS].sort((a, b) => b.favorites - a.favorites).slice(0, limit);
}

export function highestRated(limit = 10): readonly MarketplaceItem[] {
  return [...MARKETPLACE_ITEMS].sort((a, b) => b.rating.average - a.rating.average).slice(0, limit);
}

export function newest(limit = 10): readonly MarketplaceItem[] {
  return [...MARKETPLACE_ITEMS]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}
