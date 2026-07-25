import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware } from "../types";
export async function listHinges(query?: string, limit = 60): Promise<readonly LibraryHardware[]> {
  return searchHardware({ query, category: "Dobradiça", limit });
}