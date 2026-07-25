import { searchLibraryMaterials } from "../../catalog/services/library-supabase";
import type { LibraryMaterial } from "../types";
export async function listGlass(query?: string, limit = 60): Promise<readonly LibraryMaterial[]> {
  return searchLibraryMaterials({ query, category: "vidro", limit });
}