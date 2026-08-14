/**
 * Módulo 05 — Busca inteligente.
 *
 * Normalização (case/acento), índice invertido leve e ranqueamento por
 * ocorrência de tokens. Sem dependências externas, roda em memória.
 */
import type { CatalogItem } from "./types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  const n = normalize(s);
  if (!n) return [];
  return n.split(" ");
}

/** Distância de Levenshtein truncada a 2 — para tolerar erros de digitação. */
function fuzzyMatch(needle: string, hay: string): boolean {
  if (hay.includes(needle)) return true;
  if (needle.length < 4) return false;
  const n = needle.length;
  const m = hay.length;
  if (Math.abs(n - m) > 2) return false;
  // busca simples: verifica se alguma janela de hay tem distância ≤ 2
  for (let i = 0; i <= m - n + 2; i++) {
    const seg = hay.slice(Math.max(0, i - 1), i + n + 1);
    if (levenshtein(needle, seg, 2) <= 2) return true;
  }
  return false;
}

function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  const dp = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
      if (dp[j] < rowMin) rowMin = dp[j];
    }
    if (rowMin > max) return max + 1;
  }
  return dp[lb];
}

export interface IndexedItem {
  item: CatalogItem;
  haystack: string;
  tokens: readonly string[];
}

export function buildIndex(items: readonly CatalogItem[]): readonly IndexedItem[] {
  return items.map((item) => {
    const parts = [
      item.name,
      item.description,
      item.subtype,
      item.category,
      item.brand ?? "",
      item.line ?? "",
      item.code ?? "",
      item.material ?? "",
      item.color ?? "",
      ...item.tags,
      ...item.ai.semanticTags,
      ...item.ai.contexts,
    ].join(" ");
    return { item, haystack: normalize(parts), tokens: tokenize(parts) };
  });
}

/**
 * Busca com ranqueamento. Retorna itens ordenados pela relevância;
 * quando `query` é vazio, retorna todos na ordem original.
 */
export function searchIndex(index: readonly IndexedItem[], query: string): readonly CatalogItem[] {
  const q = normalize(query);
  if (!q) return index.map((x) => x.item);
  const needles = q.split(" ").filter(Boolean);
  const scored: Array<{ item: CatalogItem; score: number }> = [];
  for (const entry of index) {
    let score = 0;
    let missed = false;
    for (const n of needles) {
      if (entry.haystack.includes(n)) score += 10;
      else if (entry.tokens.some((t) => fuzzyMatch(n, t))) score += 3;
      else {
        missed = true;
        break;
      }
    }
    if (missed) continue;
    // Boost quando o nome cita o termo
    const nameLc = normalize(entry.item.name);
    for (const n of needles) if (nameLc.includes(n)) score += 25;
    scored.push({ item: entry.item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
