import { searchLibrary } from "../../library/services/search";
import type { LibrarySearchFilters, LibraryMaterial, LibraryHardware } from "../types";

export interface PremiumSearchResult {
  readonly materials: readonly LibraryMaterial[];
  readonly hardware: readonly LibraryHardware[];
  readonly total: number;
  readonly tookMs: number;
}

export async function premiumSearch(filters: LibrarySearchFilters): Promise<PremiumSearchResult> {
  const t0 = performance.now();
  const r = await searchLibrary({ ...filters, limit: filters.limit ?? 200 });
  const tookMs = Math.round(performance.now() - t0);
  return {
    materials: r.materials,
    hardware: r.hardware,
    total: r.materials.length + r.hardware.length,
    tookMs,
  };
}