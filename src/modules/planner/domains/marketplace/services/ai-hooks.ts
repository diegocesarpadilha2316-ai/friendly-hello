/** Fase 3.25 — Respostas determinísticas para a IA (sem API). */
import { MARKETPLACE_ITEMS } from "./publish";
import { MARKETPLACE_COLLECTIONS } from "./collections";
import { snapshot } from "./analytics";
import { mostDownloaded, mostFavorited, highestRated } from "./featured";

export interface MarketplaceAIResponse {
  readonly question: string;
  readonly answer: string;
  readonly evidenceIds: readonly string[];
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function answer(question: string): MarketplaceAIResponse {
  const q = normalize(question);
  if (q.includes("mais baixad")) {
    const top = mostDownloaded(1)[0];
    if (top) return {
      question,
      answer: `A biblioteca mais baixada é ${top.name} (${top.brand.toUpperCase()}) com ${top.downloads.toLocaleString("pt-BR")} downloads.`,
      evidenceIds: [top.id],
    };
  }
  if (q.includes("fabricante") && q.includes("modul")) {
    const counts = new Map<string, number>();
    for (const item of MARKETPLACE_ITEMS) counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) return { question, answer: `${top[0].toUpperCase()} possui ${top[1]} módulos publicados.`, evidenceIds: [] };
  }
  if (q.includes("mais usad") || q.includes("mais favoritad")) {
    const top = mostFavorited(1)[0];
    if (top) return { question, answer: `O item mais favoritado é ${top.name} (${top.favorites} favoritos).`, evidenceIds: [top.id] };
  }
  if (q.includes("colecao") || q.includes("coleção") || q.includes("collection")) {
    const first = MARKETPLACE_COLLECTIONS[0];
    if (first) return { question, answer: `Recomendo começar pela coleção "${first.name}" (${first.itemIds.length} itens).`, evidenceIds: [...first.itemIds] };
  }
  if (q.includes("bem avaliad") || q.includes("melhor avali")) {
    const top = highestRated(1)[0];
    if (top) return { question, answer: `O item mais bem avaliado é ${top.name} (${top.rating.average.toFixed(1)} ★).`, evidenceIds: [top.id] };
  }
  const snap = snapshot();
  return {
    question,
    answer: `Marketplace Dioris hoje: ${snap.totalItems} itens, ${snap.totalDownloads.toLocaleString("pt-BR")} downloads. Marca em destaque: ${snap.topBrand ?? "—"}.`,
    evidenceIds: snap.mostDownloaded ? [snap.mostDownloaded] : [],
  };
}
