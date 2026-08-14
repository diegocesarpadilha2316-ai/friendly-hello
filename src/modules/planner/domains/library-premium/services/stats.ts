import type { LibraryHardware, LibraryMaterial, PremiumLibraryStats } from "../types";

export function computeStats(
  materials: readonly LibraryMaterial[],
  hardware: readonly LibraryHardware[],
  favoritesCount = 0,
): PremiumLibraryStats {
  const byCategory: Record<string, number> = {};
  const byManufacturer: Record<string, number> = {};
  const collections = new Set<string>();
  const manufacturers = new Set<string>();
  for (const m of materials) {
    byCategory[m.category] = (byCategory[m.category] ?? 0) + 1;
    byManufacturer[m.manufacturer] = (byManufacturer[m.manufacturer] ?? 0) + 1;
    manufacturers.add(m.manufacturer);
    const line = (m as { line?: string | null }).line;
    if (line) collections.add(`${m.manufacturer}::${line}`);
  }
  for (const h of hardware) {
    byCategory[h.category] = (byCategory[h.category] ?? 0) + 1;
    byManufacturer[h.manufacturer] = (byManufacturer[h.manufacturer] ?? 0) + 1;
    manufacturers.add(h.manufacturer);
  }
  return {
    totalMaterials: materials.length,
    totalHardware: hardware.length,
    totalManufacturers: manufacturers.size,
    totalCollections: collections.size,
    totalFavorites: favoritesCount,
    byCategory,
    byManufacturer,
  };
}
