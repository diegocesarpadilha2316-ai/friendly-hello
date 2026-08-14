/**
 * Fase 3.24 — Vidros.
 */
import type { CatalogGlass } from "./types";

export const CATALOG_GLASS: readonly CatalogGlass[] = [
  {
    id: "glass-temp-6",
    name: "Vidro Temperado 6mm",
    kind: "temperado",
    thicknessMm: 6,
    pricePerM2: 210,
  },
  {
    id: "glass-temp-8",
    name: "Vidro Temperado 8mm",
    kind: "temperado",
    thicknessMm: 8,
    pricePerM2: 260,
  },
  {
    id: "glass-lam-88",
    name: "Vidro Laminado 8+8",
    kind: "laminado",
    thicknessMm: 16,
    pricePerM2: 520,
  },
  {
    id: "glass-fume-6",
    name: "Vidro Fumê 6mm",
    kind: "reflectivo",
    thicknessMm: 6,
    pricePerM2: 240,
  },
];

export function listGlass(): readonly CatalogGlass[] {
  return CATALOG_GLASS;
}

export function getGlass(id: string): CatalogGlass | undefined {
  return CATALOG_GLASS.find((g) => g.id === id);
}
