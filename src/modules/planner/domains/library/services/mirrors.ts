import { searchLibraryMaterials } from "../../catalog/services/library-supabase";
import type { LibraryMaterial } from "../types";
export async function listMirrors(query?: string, limit = 60): Promise<readonly LibraryMaterial[]> {
  return searchLibraryMaterials({ query, category: "espelho", limit });
}
