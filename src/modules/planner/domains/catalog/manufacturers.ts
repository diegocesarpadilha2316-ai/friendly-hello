/**
 * Fase 3.24 — Fabricantes homologados no Catálogo Dioris.
 * Estrutura determinística e imutável; sem provider/store.
 */
import type { CatalogManufacturer, CatalogManufacturerId } from "./types";

export const CATALOG_MANUFACTURERS: Readonly<Record<CatalogManufacturerId, CatalogManufacturer>> = {
  duratex: {
    id: "duratex",
    name: "Duratex",
    country: "BR",
    categories: ["armario", "porta", "prateleira", "painel", "tampo"],
    premium: false,
  },
  arauco: {
    id: "arauco",
    name: "Arauco",
    country: "CL",
    categories: ["armario", "porta", "prateleira", "painel"],
    premium: false,
  },
  guararapes: {
    id: "guararapes",
    name: "Guararapes",
    country: "BR",
    categories: ["armario", "porta", "painel", "rodape"],
    premium: false,
  },
  berneck: {
    id: "berneck",
    name: "Berneck",
    country: "BR",
    categories: ["armario", "painel", "prateleira"],
    premium: false,
  },
  sudati: {
    id: "sudati",
    name: "Sudati",
    country: "BR",
    categories: ["armario", "painel", "porta"],
    premium: false,
  },
  blum: {
    id: "blum",
    name: "Blum",
    country: "AT",
    categories: ["ferragem", "gaveta"],
    premium: true,
  },
  hettich: {
    id: "hettich",
    name: "Hettich",
    country: "DE",
    categories: ["ferragem", "gaveta"],
    premium: true,
  },
  fgv: {
    id: "fgv",
    name: "FGV",
    country: "IT",
    categories: ["ferragem", "gaveta"],
    premium: true,
  },
  hafele: {
    id: "hafele",
    name: "Häfele",
    country: "DE",
    categories: ["ferragem", "led", "perfil", "acessorio"],
    premium: true,
  },
  dioris: {
    id: "dioris",
    name: "Dioris",
    country: "BR",
    categories: [
      "armario", "balcao", "aereo", "torre", "closet", "painel",
      "nicho", "cristaleira", "tampo", "ilha", "prateleira",
      "porta", "gaveta", "divisoria", "ferragem", "led",
      "perfil", "vidro", "espelho", "rodape", "pe", "acessorio",
    ],
    premium: true,
  },
};

export function listManufacturers(): readonly CatalogManufacturer[] {
  return Object.values(CATALOG_MANUFACTURERS);
}

export function getManufacturer(id: CatalogManufacturerId): CatalogManufacturer {
  return CATALOG_MANUFACTURERS[id];
}

export function manufacturersForCategory(cat: string): readonly CatalogManufacturer[] {
  return listManufacturers().filter((m) => m.categories.includes(cat as CatalogManufacturer["categories"][number]));
}