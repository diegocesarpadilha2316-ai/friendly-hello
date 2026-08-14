/**
 * Fase 3.24 — Puxadores e sistemas de abertura.
 */
import type { CatalogHandle } from "./types";

export const CATALOG_HANDLES: readonly CatalogHandle[] = [
  {
    id: "handle-alca-96",
    name: "Alça Slim 96mm",
    manufacturer: "hafele",
    kind: "puxador",
    lengthMm: 96,
    finish: "Escovado",
    price: 24,
  },
  {
    id: "handle-alca-160",
    name: "Alça Slim 160mm",
    manufacturer: "hafele",
    kind: "puxador",
    lengthMm: 160,
    finish: "Escovado",
    price: 32,
  },
  {
    id: "handle-alca-320",
    name: "Alça Linear 320mm",
    manufacturer: "hafele",
    kind: "puxador",
    lengthMm: 320,
    finish: "Preto Fosco",
    price: 58,
  },
  {
    id: "handle-cava-lat",
    name: "Cava Lateral",
    manufacturer: "dioris",
    kind: "cava",
    lengthMm: 0,
    finish: "Integrado",
    price: 0,
  },
  {
    id: "handle-gola-h",
    name: "Gola Horizontal",
    manufacturer: "dioris",
    kind: "gola",
    lengthMm: 0,
    finish: "Alumínio",
    price: 42,
  },
  {
    id: "handle-toque",
    name: "Push To Open",
    manufacturer: "blum",
    kind: "toque",
    lengthMm: 0,
    finish: "Interno",
    price: 38,
  },
];

export function listHandles(): readonly CatalogHandle[] {
  return CATALOG_HANDLES;
}

export function getHandle(id: string): CatalogHandle | undefined {
  return CATALOG_HANDLES.find((h) => h.id === id);
}
