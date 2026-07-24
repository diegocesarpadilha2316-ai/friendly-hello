/** Fase 3.25 — Busca profissional de itens do Marketplace. */
import type { MarketplaceItem, MarketplaceSearchFilters } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";
import { isCompatible } from "./compatibility";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function searchItems(filters: MarketplaceSearchFilters): readonly MarketplaceItem[] {
  const query = filters.query ? normalize(filters.query) : "";
  return MARKETPLACE_ITEMS.filter((item) => {
    if (filters.categories?.length && !filters.categories.includes(item.category)) return false;
    if (filters.brands?.length && !filters.brands.includes(item.brand)) return false;
    if (filters.collections?.length && (!item.collectionId || !filters.collections.includes(item.collectionId))) return false;
    if (filters.tags?.length && !filters.tags.some((t) => item.tags.includes(t))) return false;
    if (filters.free && item.pricing.kind !== "free") return false;
    if (filters.paid && item.pricing.kind !== "paid") return false;
    if (typeof filters.minRating === "number" && item.rating.average < filters.minRating) return false;
    if (filters.plannerVersion && !isCompatible(item, filters.plannerVersion)) return false;
    if (query) {
      const hay = normalize(`${item.name} ${item.description} ${item.brand} ${item.tags.join(" ")}`);
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function suggest(query: string, limit = 8): readonly MarketplaceItem[] {
  if (!query) return [];
  return searchItems({ query }).slice(0, limit);
}
