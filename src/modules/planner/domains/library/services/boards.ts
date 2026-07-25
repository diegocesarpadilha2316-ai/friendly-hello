import {
  searchLibraryMaterials,
  getCachedLibraryMaterial,
  requestLibraryMaterial,
} from "../../catalog/services/library-supabase";
import type { LibraryMaterial } from "../types";

export async function listBoards(query?: string, limit = 120): Promise<readonly LibraryMaterial[]> {
  return searchLibraryMaterials({ query, category: "chapa", limit });
}

export function getBoard(id: string): LibraryMaterial | null { return getCachedLibraryMaterial(id); }
export function requestBoard(id: string): Promise<LibraryMaterial | null> { return requestLibraryMaterial(id); }