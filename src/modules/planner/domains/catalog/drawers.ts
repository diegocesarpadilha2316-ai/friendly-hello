/**
 * Fase 3.24 — Sistemas de gavetas (corrediças).
 */
import type { CatalogSlide } from "./types";

export const CATALOG_SLIDES: readonly CatalogSlide[] = [
  { id: "slide-blum-legrabox-500", name: "Blum Legrabox 500", manufacturer: "blum", kind: "oculta", lengthMm: 500, loadKg: 40, softClose: true, price: 220 },
  { id: "slide-blum-tandembox-500", name: "Blum Tandembox 500", manufacturer: "blum", kind: "oculta", lengthMm: 500, loadKg: 30, softClose: true, price: 168 },
  { id: "slide-hettich-innotech-500", name: "Hettich InnoTech 500", manufacturer: "hettich", kind: "oculta", lengthMm: 500, loadKg: 30, softClose: true, price: 172 },
  { id: "slide-fgv-telescopica-500", name: "FGV Telescópica 500", manufacturer: "fgv", kind: "telescopica", lengthMm: 500, loadKg: 35, softClose: true, price: 62 },
  { id: "slide-hafele-sincro", name: "Häfele Sincronizada 500", manufacturer: "hafele", kind: "sincronizada", lengthMm: 500, loadKg: 30, softClose: true, price: 148 },
];

export function listSlides(): readonly CatalogSlide[] {
  return CATALOG_SLIDES;
}

export function getSlide(id: string): CatalogSlide | undefined {
  return CATALOG_SLIDES.find((s) => s.id === id);
}