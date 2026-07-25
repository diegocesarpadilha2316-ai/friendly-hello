import { PREMIUM_MANUFACTURERS, type PremiumManufacturer } from "../types";
import { searchLibrary } from "../../library/services/search";

export function listManufacturers(): readonly PremiumManufacturer[] {
  return PREMIUM_MANUFACTURERS;
}

export async function listCollectionsByManufacturer(manufacturer: string) {
  const r = await searchLibrary({ manufacturer, limit: 500 });
  const collections = new Map<string, number>();
  for (const m of r.materials) {
    const line = (m as { line?: string | null }).line ?? "Geral";
    collections.set(line, (collections.get(line) ?? 0) + 1);
  }
  return Array.from(collections.entries()).map(([name, itemCount]) => ({
    id: `${manufacturer}::${name}`,
    manufacturer,
    name,
    kind: "material" as const,
    itemCount,
  }));
}