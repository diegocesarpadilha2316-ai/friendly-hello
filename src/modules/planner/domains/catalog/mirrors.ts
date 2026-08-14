/**
 * Fase 3.24 — Espelhos.
 */
import type { CatalogMirror } from "./types";

export const CATALOG_MIRRORS: readonly CatalogMirror[] = [
  {
    id: "mirror-prata-4",
    name: "Espelho Prata 4mm",
    kind: "prata",
    thicknessMm: 4,
    pricePerM2: 180,
  },
  {
    id: "mirror-bronze-4",
    name: "Espelho Bronze 4mm",
    kind: "bronze",
    thicknessMm: 4,
    pricePerM2: 210,
  },
  { id: "mirror-fume-4", name: "Espelho Fumê 4mm", kind: "fume", thicknessMm: 4, pricePerM2: 220 },
  {
    id: "mirror-antique",
    name: "Espelho Antique 4mm",
    kind: "antique",
    thicknessMm: 4,
    pricePerM2: 320,
  },
];

export function listMirrors(): readonly CatalogMirror[] {
  return CATALOG_MIRRORS;
}

export function getMirror(id: string): CatalogMirror | undefined {
  return CATALOG_MIRRORS.find((m) => m.id === id);
}
