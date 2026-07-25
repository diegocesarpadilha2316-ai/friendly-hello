import { searchLibrary } from "../../library/services/search";
import { searchHardware } from "../../library/services/hardware-supabase";
import type {
  LibraryHardware,
  LibraryMaterial,
  LibrarySearchFilters,
  PremiumMaterialCategory,
  PremiumHardwareCategory,
} from "../types";

export async function listMaterialsByCategory(
  category: PremiumMaterialCategory,
  filters: Omit<LibrarySearchFilters, "category"> = {},
): Promise<readonly LibraryMaterial[]> {
  const r = await searchLibrary({ ...filters, category });
  return r.materials;
}

export async function listHardwareByCategory(
  category: PremiumHardwareCategory,
  filters: Omit<LibrarySearchFilters, "category"> = {},
): Promise<readonly LibraryHardware[]> {
  return searchHardware({ ...filters, category, limit: filters.limit ?? 120 });
}

export async function listGlass(subtype?: string): Promise<readonly LibraryMaterial[]> {
  const r = await searchLibrary({ category: "Vidro", query: subtype });
  return r.materials;
}

export async function listMirrors(subtype?: string): Promise<readonly LibraryMaterial[]> {
  const r = await searchLibrary({ category: "Espelho", query: subtype });
  return r.materials;
}

export async function listLED(subtype?: string): Promise<readonly LibraryHardware[]> {
  return searchHardware({ category: "LED", query: subtype, limit: 200 });
}