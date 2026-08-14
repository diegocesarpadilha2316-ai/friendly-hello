import type { PremiumFavorite } from "../types";

const KEY = "dioris.planner.library-premium.favorites";

function read(): PremiumFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PremiumFavorite[]) : [];
  } catch {
    return [];
  }
}

function write(list: PremiumFavorite[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function listFavorites(): readonly PremiumFavorite[] {
  return read();
}

export function toggleFavorite(
  id: string,
  kind: PremiumFavorite["kind"],
): readonly PremiumFavorite[] {
  const list = read();
  const i = list.findIndex((f) => f.id === id && f.kind === kind);
  if (i >= 0) list.splice(i, 1);
  else list.push({ id, kind, addedAt: Date.now() });
  write(list);
  return list;
}

export function isFavorite(id: string, kind: PremiumFavorite["kind"]): boolean {
  return read().some((f) => f.id === id && f.kind === kind);
}
