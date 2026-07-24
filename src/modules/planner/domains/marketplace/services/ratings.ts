/** Fase 3.25 — Agregação de avaliações. */
import type { MarketplaceItem, MarketplaceRating } from "../types";

export function starsLabel(rating: MarketplaceRating): string {
  return `${rating.average.toFixed(1)} ★ (${rating.count})`;
}

export function ratingBar(rating: MarketplaceRating, stars: 1 | 2 | 3 | 4 | 5): number {
  if (rating.count === 0) return 0;
  return Math.round((rating.distribution[stars] / rating.count) * 100);
}

export function topRated(items: readonly MarketplaceItem[], limit = 5): readonly MarketplaceItem[] {
  return [...items].sort((a, b) => b.rating.average - a.rating.average).slice(0, limit);
}
