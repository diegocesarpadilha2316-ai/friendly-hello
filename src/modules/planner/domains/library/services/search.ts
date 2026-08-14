import { searchLibraryMaterials } from "../../catalog/services/library-supabase";
import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware, LibraryMaterial, LibrarySearchFilters } from "../types";

export async function searchLibrary(filters: LibrarySearchFilters): Promise<{
  readonly materials: readonly LibraryMaterial[];
  readonly hardware: readonly LibraryHardware[];
}> {
  const [materials, hardware] = await Promise.all([
    searchLibraryMaterials({
      query: filters.query,
      category: filters.category,
      limit: filters.limit ?? 60,
    }),
    searchHardware({
      query: filters.query,
      category: filters.category,
      manufacturer: filters.manufacturer,
      limit: filters.limit ?? 60,
    }),
  ]);
  return { materials, hardware };
}
