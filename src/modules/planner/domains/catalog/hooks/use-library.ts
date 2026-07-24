/**
 * Hooks React para a Biblioteca Dioris — carregamento sob demanda com
 * cache global compartilhado (ver `services/library-supabase.ts`).
 */
import { useEffect, useState, useSyncExternalStore, useMemo } from "react";
import {
  getCachedLibraryMaterial,
  requestLibraryMaterial,
  searchLibraryMaterials,
  subscribeLibrary,
  type LibraryMaterial,
} from "../services/library-supabase";

function getSnapshot(id: string | null | undefined): LibraryMaterial | null {
  return id ? getCachedLibraryMaterial(id) : null;
}

export function useLibraryMaterial(id: string | null | undefined): LibraryMaterial | null {
  useEffect(() => {
    if (id) requestLibraryMaterial(id);
  }, [id]);
  return useSyncExternalStore(
    subscribeLibrary,
    () => getSnapshot(id),
    () => null,
  );
}

export function useLibraryMaterials(
  ids: readonly string[],
): Map<string, LibraryMaterial> {
  useEffect(() => {
    for (const id of ids) if (id) requestLibraryMaterial(id);
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const key = ids.join("|");
  return useSyncExternalStore(
    subscribeLibrary,
    () => {
      const map = new Map<string, LibraryMaterial>();
      for (const id of ids) {
        const m = getCachedLibraryMaterial(id);
        if (m) map.set(id, m);
      }
      // Mesma referência quando o conjunto não muda evita rerenders.
      return snapshotFor(key, map);
    },
    () => new Map(),
  );
}

const snapshots = new Map<string, { fingerprint: string; map: Map<string, LibraryMaterial> }>();
function snapshotFor(key: string, map: Map<string, LibraryMaterial>) {
  const fingerprint = Array.from(map.keys()).sort().join(",") + ":" + map.size;
  const prev = snapshots.get(key);
  if (prev && prev.fingerprint === fingerprint) return prev.map;
  snapshots.set(key, { fingerprint, map });
  return map;
}

export function useLibrarySearch(query: string, category?: string) {
  const [items, setItems] = useState<readonly LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const key = useMemo(() => `${category ?? ""}::${query}`, [category, query]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchLibraryMaterials({ query, category, limit: 60 })
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { items, loading };
}