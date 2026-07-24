/**
 * Fase 3.24 — Busca e filtros determinísticos.
 */
import type { CatalogItem, CatalogSearchFilters } from "./types";
import { CATALOG_ITEMS } from "./catalog";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchItems(filters: CatalogSearchFilters): readonly CatalogItem[] {
  const q = filters.query ? normalize(filters.query) : "";
  return CATALOG_ITEMS.filter((item) => {
    if (q) {
      const haystack = normalize(`${item.name} ${item.description} ${item.tags.join(" ")}`);
      if (!haystack.includes(q)) return false;
    }
    if (filters.categories?.length && !filters.categories.includes(item.category)) return false;
    if (filters.manufacturers?.length && !filters.manufacturers.includes(item.manufacturer)) return false;
    if (filters.tags?.length && !filters.tags.some((t) => item.tags.includes(t))) return false;
    if (typeof filters.minPrice === "number" && item.basePrice < filters.minPrice) return false;
    if (typeof filters.maxPrice === "number" && item.basePrice > filters.maxPrice) return false;
    if (filters.withLed && !item.parametric.withLed) return false;
    if (filters.withGlass && !item.parametric.withGlass) return false;
    if (filters.withMirror && !item.parametric.withMirror) return false;
    return true;
  });
}

export function suggest(query: string, limit = 8): readonly CatalogItem[] {
  return searchItems({ query }).slice(0, limit);
}