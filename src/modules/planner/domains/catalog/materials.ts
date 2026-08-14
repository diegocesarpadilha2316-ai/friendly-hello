/**
 * Fase 3.24 — Biblioteca de materiais de base.
 */
import type { CatalogMaterial } from "./types";

export const CATALOG_MATERIALS: readonly CatalogMaterial[] = [
  {
    id: "mat-mdf-15-branco",
    name: "MDF 15mm Branco TX",
    manufacturer: "duratex",
    kind: "mdf",
    thicknessesMm: [6, 9, 15, 18, 25],
    grain: false,
    finish: "texturizado",
    pricePerM2: 89,
  },
  {
    id: "mat-mdf-18-carvalho",
    name: "MDF 18mm Carvalho Nature",
    manufacturer: "duratex",
    kind: "mdf",
    thicknessesMm: [15, 18, 25],
    grain: true,
    finish: "acetinado",
    pricePerM2: 148,
  },
  {
    id: "mat-mdf-18-nogueira",
    name: "MDF 18mm Nogueira",
    manufacturer: "arauco",
    kind: "mdf",
    thicknessesMm: [15, 18],
    grain: true,
    finish: "acetinado",
    pricePerM2: 172,
  },
  {
    id: "mat-mdp-15-cinza",
    name: "MDP 15mm Cinza Antracite",
    manufacturer: "berneck",
    kind: "mdp",
    thicknessesMm: [15, 18],
    grain: false,
    finish: "fosco",
    pricePerM2: 74,
  },
  {
    id: "mat-mdf-18-off-white",
    name: "MDF 18mm Off White Fosco",
    manufacturer: "guararapes",
    kind: "mdf",
    thicknessesMm: [15, 18],
    grain: false,
    finish: "fosco",
    pricePerM2: 96,
  },
  {
    id: "mat-mdf-18-preto-supremo",
    name: "MDF 18mm Preto Supremo",
    manufacturer: "sudati",
    kind: "mdf",
    thicknessesMm: [15, 18, 25],
    grain: false,
    finish: "brilhante",
    pricePerM2: 178,
  },
  {
    id: "mat-macico-freijo",
    name: "Maciço Freijó 20mm",
    manufacturer: "dioris",
    kind: "macico",
    thicknessesMm: [20, 25, 30],
    grain: true,
    finish: "acetinado",
    pricePerM2: 420,
  },
];

export function listMaterials(): readonly CatalogMaterial[] {
  return CATALOG_MATERIALS;
}

export function getMaterial(id: string): CatalogMaterial | undefined {
  return CATALOG_MATERIALS.find((m) => m.id === id);
}
