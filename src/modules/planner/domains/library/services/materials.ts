import {
  searchLibraryMaterials,
  getCachedLibraryMaterial,
  requestLibraryMaterial,
  resolveLibraryMaterialsSync,
} from "../../catalog/services/library-supabase";
import type { LibraryMaterial } from "../types";

export async function listMaterials(params: { query?: string; category?: string; limit?: number } = {}): Promise<readonly LibraryMaterial[]> {
  return searchLibraryMaterials(params);
}
export function getMaterial(id: string): LibraryMaterial | null { return getCachedLibraryMaterial(id); }
export function requestMaterial(id: string): Promise<LibraryMaterial | null> { return requestLibraryMaterial(id); }
export function resolveMaterials(ids: readonly string[]): Map<string, LibraryMaterial> { return resolveLibraryMaterialsSync(ids); }