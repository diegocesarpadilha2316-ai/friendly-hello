/**
 * Fase 3.24 — Acessórios internos (cestos, porta-talheres, etc).
 */
import type { CatalogAccessory } from "./types";

export const CATALOG_ACCESSORIES: readonly CatalogAccessory[] = [
  {
    id: "acc-cesto-cozinha",
    name: "Cesto Aramado Cozinha",
    kind: "cesto",
    manufacturer: "hafele",
    price: 210,
  },
  {
    id: "acc-porta-talheres",
    name: "Porta Talheres Modular",
    kind: "porta-talheres",
    manufacturer: "blum",
    price: 320,
  },
  {
    id: "acc-lixeira-dupla",
    name: "Lixeira Dupla 20L",
    kind: "lixeira",
    manufacturer: "hettich",
    price: 380,
  },
  {
    id: "acc-cabideiro-ext",
    name: "Cabideiro Extensível",
    kind: "cabideiro",
    manufacturer: "hafele",
    price: 240,
  },
  {
    id: "acc-sapateira",
    name: "Sapateira Basculante",
    kind: "sapateira",
    manufacturer: "hafele",
    price: 280,
  },
];

export function listAccessories(): readonly CatalogAccessory[] {
  return CATALOG_ACCESSORIES;
}

export function getAccessory(id: string): CatalogAccessory | undefined {
  return CATALOG_ACCESSORIES.find((a) => a.id === id);
}
