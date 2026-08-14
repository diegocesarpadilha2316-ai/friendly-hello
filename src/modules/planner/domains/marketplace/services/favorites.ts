/** Fase 3.25 — Favoritos session-only. */
import type { MarketplaceFavoritesState } from "../types";

const KEY = "dioris.planner.marketplace.favorites.v1";
const EMPTY: MarketplaceFavoritesState = { itemIds: [] };

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readFavorites(): MarketplaceFavoritesState {
  const s = safeStorage();
  if (!s) return EMPTY;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as MarketplaceFavoritesState;
    if (!parsed || !Array.isArray(parsed.itemIds)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

function writeFavorites(state: MarketplaceFavoritesState): MarketplaceFavoritesState {
  const s = safeStorage();
  if (s) {
    try {
      s.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  return state;
}

export function toggleFavorite(itemId: string): MarketplaceFavoritesState {
  const current = readFavorites();
  const has = current.itemIds.includes(itemId);
  const next = has
    ? { itemIds: current.itemIds.filter((id) => id !== itemId) }
    : { itemIds: [...current.itemIds, itemId] };
  return writeFavorites(next);
}

export function clearFavorites(): MarketplaceFavoritesState {
  return writeFavorites(EMPTY);
}
