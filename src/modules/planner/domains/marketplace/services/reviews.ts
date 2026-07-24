/** Fase 3.25 — Reviews determinísticos. Sem persistência. */
import type { MarketplaceReview } from "../types";
import { MARKETPLACE_ITEMS } from "./publish";

function make(id: string, itemId: string, author: string, stars: 1 | 2 | 3 | 4 | 5, comment: string, likes: number, day: number): MarketplaceReview {
  return {
    id,
    itemId,
    authorId: `user-${id}`,
    authorName: author,
    stars,
    comment,
    likes,
    createdAt: `2026-05-${String(day).padStart(2, "0")}T10:00:00.000Z`,
  };
}

export const MARKETPLACE_REVIEWS: readonly MarketplaceReview[] = MARKETPLACE_ITEMS.flatMap((item, idx) => [
  make(`rev-${item.id}-1`, item.id, "Ana Marcenaria", 5, "Encaixou perfeitamente no Planner Dioris.", 42 + idx, 4 + (idx % 20)),
  make(`rev-${item.id}-2`, item.id, "Estúdio Nex", 4, "Ótima biblioteca, faltou apenas mais variação de puxadores.", 18 + idx, 6 + (idx % 15)),
  make(`rev-${item.id}-3`, item.id, "Marcelo Móveis", 5, "Instalação e atualização automáticas funcionaram lindamente.", 24 + idx, 12 + (idx % 10)),
]);

export function reviewsFor(itemId: string): readonly MarketplaceReview[] {
  return MARKETPLACE_REVIEWS.filter((r) => r.itemId === itemId);
}
