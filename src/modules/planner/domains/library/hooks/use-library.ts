import { useEffect, useMemo, useState } from "react";
import {
  useLibraryMaterial as useMaterialFromCatalog,
  useLibrarySearch as useMaterialSearch,
} from "../../catalog/hooks/use-library";
import { searchHardware } from "../services/hardware-supabase";
import { searchLibrary } from "../services/search";
import type { LibraryHardware, LibraryMaterial, LibrarySearchFilters } from "../types";

export function useLibraryMaterial(id: string | null | undefined): LibraryMaterial | null {
  return useMaterialFromCatalog(id);
}

export function useLibraryMaterialSearch(query: string, category?: string) {
  return useMaterialSearch(query, category);
}

export function useLibraryHardwareSearch(query: string, category?: string) {
  const [items, setItems] = useState<readonly LibraryHardware[]>([]);
  const [loading, setLoading] = useState(false);
  const key = useMemo(() => `${category ?? ""}::${query}`, [category, query]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchHardware({ query, category, limit: 60 })
      .then((r) => { if (!cancelled) setItems(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { items, loading };
}

export function useLibrarySearch(filters: LibrarySearchFilters) {
  const [state, setState] = useState<{
    materials: readonly LibraryMaterial[];
    hardware: readonly LibraryHardware[];
    loading: boolean;
  }>({ materials: [], hardware: [], loading: false });
  const key = JSON.stringify(filters);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    searchLibrary(filters)
      .then((r) => { if (!cancelled) setState({ ...r, loading: false }); })
      .catch(() => { if (!cancelled) setState({ materials: [], hardware: [], loading: false }); });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}