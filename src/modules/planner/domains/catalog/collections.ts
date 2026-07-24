/**
 * Fase 3.24 — Coleções (linhas) por fabricante.
 */
import type { CatalogCollection } from "./types";

export const CATALOG_COLLECTIONS: readonly CatalogCollection[] = [
  { id: "col-dioris-signature", name: "Signature", manufacturer: "dioris", line: "Premium", year: 2026, tags: ["premium", "assinatura"] },
  { id: "col-dioris-essence",   name: "Essence",   manufacturer: "dioris", line: "Core",    year: 2026, tags: ["core"] },
  { id: "col-dioris-atelier",   name: "Atelier",   manufacturer: "dioris", line: "Custom",  year: 2026, tags: ["custom", "atelier"] },
  { id: "col-duratex-essencial", name: "Essencial", manufacturer: "duratex", line: "Standard", year: 2025, tags: ["standard"] },
  { id: "col-arauco-vesto",     name: "Vesto",     manufacturer: "arauco", line: "Trend",   year: 2025, tags: ["trend"] },
  { id: "col-blum-legrabox",    name: "Legrabox",  manufacturer: "blum",   line: "Premium", year: 2025, tags: ["gaveta", "premium"] },
  { id: "col-hettich-innotech", name: "InnoTech",  manufacturer: "hettich", line: "Premium", year: 2025, tags: ["gaveta"] },
  { id: "col-hafele-loox",      name: "Loox 5",    manufacturer: "hafele", line: "LED",     year: 2026, tags: ["led"] },
];

export function listCollections(): readonly CatalogCollection[] {
  return CATALOG_COLLECTIONS;
}

export function getCollection(id: string): CatalogCollection | undefined {
  return CATALOG_COLLECTIONS.find((c) => c.id === id);
}