/**
 * Fase 3.24 — Itens recentes (últimos 20).
 */
import type { CatalogRecentsState } from "./types";

const KEY = "dioris.planner.catalog.recents.v1";
const LIMIT = 20;

function safeGet(): CatalogRecentsState {
  if (typeof window === "undefined") return { itemIds: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { itemIds: [] };
    const parsed = JSON.parse(raw) as CatalogRecentsState;
    if (!Array.isArray(parsed.itemIds)) return { itemIds: [] };
    return { itemIds: parsed.itemIds.slice(0, LIMIT) };
  } catch {
    return { itemIds: [] };
  }
}

function safeSet(state: CatalogRecentsState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function readRecents(): CatalogRecentsState {
  return safeGet();
}

export function pushRecent(itemId: string): CatalogRecentsState {
  const current = safeGet();
  const filtered = current.itemIds.filter((i) => i !== itemId);
  const next: CatalogRecentsState = { itemIds: [itemId, ...filtered].slice(0, LIMIT) };
  safeSet(next);
  return next;
}

export function clearRecents(): CatalogRecentsState {
  const empty: CatalogRecentsState = { itemIds: [] };
  safeSet(empty);
  return empty;
}
