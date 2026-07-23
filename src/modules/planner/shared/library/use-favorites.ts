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
const RECENT_LIMIT = 12;

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

export function useLibraryFavorites() {
  const [favorites, setFavorites] = useState<readonly string[]>([]);
  const [recents, setRecents] = useState<readonly string[]>([]);

  useEffect(() => {
    setFavorites(readList(KEY_FAV));
    setRecents(readList(KEY_RECENT));
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
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    writeList(KEY_RECENT, []);
  }, []);

  return { favorites, recents, toggleFavorite, registerRecent, clearRecents };
}