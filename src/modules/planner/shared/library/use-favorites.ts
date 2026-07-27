/**
 * Estado local do usuário para a Biblioteca (Fase 3.4).
 *
 * Não é um provider — é um hook client-only que sincroniza favoritos e
 * recentes com `localStorage` do próprio Editor. Segue o mesmo padrão do
 * `persistence/local-store.ts` do Planner: leitura em `useEffect`, sem
 * quebrar SSR, sem novos providers/stores globais.
 */
import { useCallback, useEffect, useState } from "react";

const KEY_FAV = "dioris.planner.library.favorites";
const KEY_RECENT = "dioris.planner.library.recents";
const KEY_USAGE = "dioris.planner.library.usage";
const RECENT_LIMIT = 12;
const TOP_LIMIT = 20;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota / privado — ignora silenciosamente */
  }
}

function readUsage(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY_USAGE);
    if (!raw) return {};
    const obj = JSON.parse(raw) as unknown;
    if (obj && typeof obj === "object") {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

function writeUsage(u: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_USAGE, JSON.stringify(u));
  } catch { /* ignore */ }
}

export function useLibraryFavorites() {
  const [favorites, setFavorites] = useState<readonly string[]>([]);
  const [recents, setRecents] = useState<readonly string[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    setFavorites(readList(KEY_FAV));
    setRecents(readList(KEY_RECENT));
    setUsage(readUsage());
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeList(KEY_FAV, next);
      return next;
    });
  }, []);

  const registerRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT);
      writeList(KEY_RECENT, next);
      return next;
    });
    setUsage((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      writeUsage(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    writeList(KEY_RECENT, []);
  }, []);

  const mostUsed: readonly string[] = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LIMIT)
    .map(([id]) => id);

  return { favorites, recents, mostUsed, usage, toggleFavorite, registerRecent, clearRecents };
}