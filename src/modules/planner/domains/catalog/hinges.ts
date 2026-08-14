/**
 * Fase 3.24 — Dobradiças (hinges).
 */
import type { CatalogHinge } from "./types";

export const CATALOG_HINGES: readonly CatalogHinge[] = [
  {
    id: "hinge-blum-clip-110",
    name: "Blum Clip Top 110°",
    manufacturer: "blum",
    angleDeg: 110,
    softClose: true,
    price: 22,
  },
  {
    id: "hinge-blum-clip-155",
    name: "Blum Clip Top 155°",
    manufacturer: "blum",
    angleDeg: 155,
    softClose: true,
    price: 34,
  },
  {
    id: "hinge-hettich-sensys-110",
    name: "Hettich Sensys 110°",
    manufacturer: "hettich",
    angleDeg: 110,
    softClose: true,
    price: 26,
  },
  {
    id: "hinge-fgv-slide-on-95",
    name: "FGV Slide-on 90°",
    manufacturer: "fgv",
    angleDeg: 90,
    softClose: false,
    price: 8,
  },
  {
    id: "hinge-hafele-metalla-165",
    name: "Häfele Metalla 165°",
    manufacturer: "hafele",
    angleDeg: 165,
    softClose: true,
    price: 42,
  },
];

export function listHinges(): readonly CatalogHinge[] {
  return CATALOG_HINGES;
}

export function getHinge(id: string): CatalogHinge | undefined {
  return CATALOG_HINGES.find((h) => h.id === id);
}
