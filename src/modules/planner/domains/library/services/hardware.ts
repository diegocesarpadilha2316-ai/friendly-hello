export {
  searchHardware as listHardware,
  getCachedHardware as getHardware,
  fetchHardwareByIds,
  subscribeHardware,
} from "./hardware-supabase";
export type { LibraryHardware } from "../types";

import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware } from "../types";

export async function listByCategory(
  category: string,
  query?: string,
  limit = 60,
): Promise<readonly LibraryHardware[]> {
  return searchHardware({ query, category, limit });
}
