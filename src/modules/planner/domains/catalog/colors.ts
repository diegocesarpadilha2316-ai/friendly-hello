/**
 * Fase 3.24 — Paleta de cores para acabamentos pintados.
 */
import type { CatalogColor } from "./types";

export const CATALOG_COLORS: readonly CatalogColor[] = [
  { id: "color-branco-neve", name: "Branco Neve", hex: "#F5F5F0", ral: "RAL 9010" },
  { id: "color-off-white", name: "Off White", hex: "#EDE7DA", ral: "RAL 9001" },
  { id: "color-cinza-urbano", name: "Cinza Urbano", hex: "#6E6E6E", ral: "RAL 7037" },
  { id: "color-grafite", name: "Grafite", hex: "#2E2E2E", ral: "RAL 7024" },
  { id: "color-preto-supremo", name: "Preto Supremo", hex: "#111111", ral: "RAL 9005" },
  { id: "color-verde-oliva", name: "Verde Oliva", hex: "#5B6B3A", ral: "RAL 6013" },
  { id: "color-terracota", name: "Terracota", hex: "#B76B4A", ral: "RAL 8004" },
  { id: "color-azul-marinho", name: "Azul Marinho", hex: "#1F2A44", ral: "RAL 5011" },
];

export function listColors(): readonly CatalogColor[] {
  return CATALOG_COLORS;
}

export function getColor(id: string): CatalogColor | undefined {
  return CATALOG_COLORS.find((c) => c.id === id);
}
