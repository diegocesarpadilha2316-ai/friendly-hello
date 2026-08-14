/** Fase 3.25 — Coleções do Marketplace. */
import type { MarketplaceCollection } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";

export const MARKETPLACE_COLLECTIONS: readonly MarketplaceCollection[] = [
  {
    id: "col-duratex-arya",
    name: "Coleção Arya",
    ownerKind: "fabricante",
    ownerId: "duratex",
    itemIds: MARKETPLACE_ITEMS.filter((i) => i.collectionId === "col-duratex-arya").map(
      (i) => i.id,
    ),
    description: "Coleção Duratex Arya — cozinhas e áreas úmidas.",
  },
  {
    id: "col-arauco-innova",
    name: "Coleção Innova",
    ownerKind: "fabricante",
    ownerId: "arauco",
    itemIds: MARKETPLACE_ITEMS.filter((i) => i.collectionId === "col-arauco-innova").map(
      (i) => i.id,
    ),
    description: "Coleção Arauco Innova — closets premium.",
  },
  {
    id: "col-blum-tandembox",
    name: "Tandembox Antaro",
    ownerKind: "fabricante",
    ownerId: "blum",
    itemIds: MARKETPLACE_ITEMS.filter((i) => i.collectionId === "col-blum-tandembox").map(
      (i) => i.id,
    ),
    description: "Sistema Blum Tandembox completo.",
  },
  {
    id: "col-dioris-loft",
    name: "Ambientes Loft Dioris",
    ownerKind: "marketplace",
    ownerId: "dioris",
    itemIds: MARKETPLACE_ITEMS.filter((i) => i.collectionId === "col-dioris-loft").map((i) => i.id),
    description: "Ambientes Loft Industriais prontos.",
  },
];

export function listCollections(): readonly MarketplaceCollection[] {
  return MARKETPLACE_COLLECTIONS;
}

export function getCollection(id: string): MarketplaceCollection | undefined {
  return MARKETPLACE_COLLECTIONS.find((c) => c.id === id);
}
