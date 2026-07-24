/** Fase 3.25 — Atualizações de itens instalados. */
import type { MarketplaceInstalledState, MarketplaceItem } from "../types";
import { getItem } from "./publish";
import { readInstalled, install } from "./install";

export interface MarketplaceUpdateSuggestion {
  readonly item: MarketplaceItem;
  readonly installedVersion: string;
  readonly latestVersion: string;
}

export function pendingUpdates(): readonly MarketplaceUpdateSuggestion[] {
  const suggestions: MarketplaceUpdateSuggestion[] = [];
  for (const record of readInstalled().records) {
    const item = getItem(record.itemId);
    if (!item) continue;
    if (item.version !== record.version) {
      suggestions.push({ item, installedVersion: record.version, latestVersion: item.version });
    }
  }
  return suggestions;
}

export function applyUpdate(itemId: string): MarketplaceInstalledState {
  return install(itemId);
}

export function applyAllUpdates(): MarketplaceInstalledState {
  let state = readInstalled();
  for (const suggestion of pendingUpdates()) {
    state = install(suggestion.item.id);
  }
  return state;
}
