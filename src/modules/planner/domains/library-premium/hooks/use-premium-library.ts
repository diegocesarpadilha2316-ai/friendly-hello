import { useEffect, useMemo, useState } from "react";
import { searchLibrary } from "../../library/services/search";
import { computeStats } from "../services/stats";
import { listFavorites, toggleFavorite as toggle, isFavorite } from "../services/favorites";
import { listRecents, pushRecent as pushRecentSvc } from "../services/recents";
import { premiumSearch } from "../services/search";
import type {
  LibraryHardware,
  LibraryMaterial,
  LibrarySearchFilters,
  PremiumFavorite,
  PremiumLibraryStats,
} from "../types";

export interface UsePremiumLibraryResult {
  readonly materials: readonly LibraryMaterial[];
  readonly hardware: readonly LibraryHardware[];
  readonly loading: boolean;
  readonly stats: PremiumLibraryStats;
  readonly favorites: readonly PremiumFavorite[];
  readonly recents: readonly string[];
  readonly toggleFavorite: (id: string, kind: PremiumFavorite["kind"]) => void;
  readonly isFavorite: (id: string, kind: PremiumFavorite["kind"]) => boolean;
  readonly pushRecent: (id: string) => void;
  readonly search: (filters: LibrarySearchFilters) => Promise<void>;
  readonly reload: () => void;
}

/**
 * Hook composicional da Biblioteca Oficial Premium.
 * Nenhum Provider/Store/Manager novo.
 */
export function usePremiumLibrary(initial?: LibrarySearchFilters): UsePremiumLibraryResult {
  const [materials, setMaterials] = useState<readonly LibraryMaterial[]>([]);
  const [hardware, setHardware] = useState<readonly LibraryHardware[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<readonly PremiumFavorite[]>(() => listFavorites());
  const [recents, setRecents] = useState<readonly string[]>(() => listRecents());
  const [nonce, setNonce] = useState(0);

  const key = JSON.stringify(initial ?? {});
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchLibrary({ limit: 500, ...(initial ?? {}) })
      .then((r) => {
        if (cancelled) return;
        setMaterials(r.materials);
        setHardware(r.hardware);
      })
      .catch(() => {
        if (cancelled) return;
        setMaterials([]);
        setHardware([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(
    () => computeStats(materials, hardware, favorites.length),
    [materials, hardware, favorites.length],
  );

  return {
    materials,
    hardware,
    loading,
    stats,
    favorites,
    recents,
    toggleFavorite: (id, kind) => setFavorites(toggle(id, kind)),
    isFavorite,
    pushRecent: (id) => {
      pushRecentSvc(id);
      setRecents(listRecents());
    },
    search: async (filters) => {
      setLoading(true);
      try {
        const r = await premiumSearch(filters);
        setMaterials(r.materials);
        setHardware(r.hardware);
      } finally {
        setLoading(false);
      }
    },
    reload: () => setNonce((n) => n + 1),
  };
}