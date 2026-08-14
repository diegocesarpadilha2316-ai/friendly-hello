/** Fase 3.25 — Recomendações determinísticas baseadas em tags e categoria. */
import type { MarketplaceItem } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";

export function recommendationsFor(item: MarketplaceItem, limit = 6): readonly MarketplaceItem[] {
  const score = (candidate: MarketplaceItem): number => {
    if (candidate.id === item.id) return -1;
    let value = 0;
    if (candidate.category === item.category) value += 3;
    if (candidate.brand === item.brand) value += 2;
    value += candidate.tags.filter((t) => item.tags.includes(t)).length;
    value += candidate.rating.average / 5;
    return value;
  };
  return [...MARKETPLACE_ITEMS]
    .map((i) => ({ item: i, score: score(i) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function recommendationsForUser(
  installedIds: readonly string[],
  limit = 6,
): readonly MarketplaceItem[] {
  const installed = MARKETPLACE_ITEMS.filter((i) => installedIds.includes(i.id));
  const scored = new Map<string, number>();
  for (const inst of installed) {
    for (const rec of recommendationsFor(inst, 20)) {
      if (installedIds.includes(rec.id)) continue;
      scored.set(rec.id, (scored.get(rec.id) ?? 0) + 1);
    }
  }
  const ordered = [...scored.entries()].sort((a, b) => b[1] - a[1]);
  return ordered
    .map(([id]) => MARKETPLACE_ITEMS.find((i) => i.id === id)!)
    .filter(Boolean)
    .slice(0, limit);
}
