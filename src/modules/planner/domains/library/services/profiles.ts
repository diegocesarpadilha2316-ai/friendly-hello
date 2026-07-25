import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware } from "../types";
export async function listProfiles(query?: string, limit = 60): Promise<readonly LibraryHardware[]> {
  return searchHardware({ query, category: "Perfil", limit });
}