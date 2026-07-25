import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware } from "../types";
export async function listDrawers(query?: string, limit = 60): Promise<readonly LibraryHardware[]> {
  return searchHardware({ query, category: "Corrediça", limit });
}