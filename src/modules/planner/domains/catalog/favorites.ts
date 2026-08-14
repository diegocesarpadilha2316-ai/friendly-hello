/**
 * Fase 3.24 — Favoritos do catálogo.
 *
 * Persistência via localStorage do tenant. Nada de novos providers/stores/banco.
 */
import type { CatalogFavoritesState } from "./types";

const KEY = "dioris.planner.catalog.favorites.v1";

function safeGet(): CatalogFavoritesState {
  if (typeof window === "undefined") return { itemIds: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { itemIds: [] };
    const parsed = JSON.parse(raw) as CatalogFavoritesState;
    if (!Array.isArray(parsed.itemIds)) return { itemIds: [] };
    return { itemIds: parsed.itemIds };
  } catch {
    return { itemIds: [] };
  }
}

function safeSet(state: CatalogFavoritesState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function readFavorites(): CatalogFavoritesState {
  return safeGet();
}

export function toggleFavorite(itemId: string): CatalogFavoritesState {
  const current = safeGet();
  const has = current.itemIds.includes(itemId);
  const next: CatalogFavoritesState = {
    itemIds: has ? current.itemIds.filter((i) => i !== itemId) : [...current.itemIds, itemId],
  };
  safeSet(next);
  return next;
}

export function clearFavorites(): CatalogFavoritesState {
  const empty: CatalogFavoritesState = { itemIds: [] };
  safeSet(empty);
  return empty;
}
