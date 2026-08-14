/**
 * Fase 3.26 — Bridge Supabase → Ferragens Oficiais Dioris (`planner_hardware`).
 *
 * Espelha `catalog/services/library-supabase.ts` (materiais) para ferragens.
 * Sem novos providers/stores/managers — apenas cache em memória com
 * carregamento sob demanda e assinatura via `useSyncExternalStore`.
 */
import { getSupabaseBrowser } from "@/core/lib/supabase/client";
import type { LibraryHardware } from "../types";

interface RawRow {
  id: string;
  fabricante: string;
  marca: string;
  categoria: string;
  modelo: string;
  descricao: string | null;
  imagem_url: string | null;
  preco_unitario: number | string | null;
  parametros_cnc: Record<string, unknown> | null;
  furacao: number | string | null;
  profundidade: number | string | null;
  folga: number | string | null;
}

const cache = new Map<string, LibraryHardware>();
const subscribers = new Set<() => void>();

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalize(row: RawRow): LibraryHardware {
  return {
    id: row.id,
    manufacturer: row.fabricante,
    brand: row.marca,
    category: row.categoria,
    model: row.modelo,
    description: row.descricao,
    imageUrl: row.imagem_url,
    unitPrice: num(row.preco_unitario),
    cncParams: row.parametros_cnc ?? {},
    drillDiameterMm: num(row.furacao),
    drillDepthMm: num(row.profundidade),
    clearanceMm: num(row.folga),
  };
}

function notify() {
  for (const cb of subscribers) cb();
}

export function subscribeHardware(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function getCachedHardware(id: string): LibraryHardware | null {
  return cache.get(id) ?? null;
}

export async function searchHardware(params: {
  query?: string;
  category?: string;
  manufacturer?: string;
  limit?: number;
}): Promise<readonly LibraryHardware[]> {
  const supabase = getSupabaseBrowser();
  let q = supabase
    .from("planner_hardware")
    .select(
      "id,fabricante,marca,categoria,modelo,descricao,imagem_url,preco_unitario,parametros_cnc,furacao,profundidade,folga",
    )
    .eq("ativo", true)
    .limit(params.limit ?? 60);
  if (params.category) q = q.eq("categoria", params.category);
  if (params.manufacturer) q = q.eq("fabricante", params.manufacturer);
  if (params.query && params.query.trim()) {
    const t = `%${params.query.trim()}%`;
    q = q.or(`modelo.ilike.${t},descricao.ilike.${t},fabricante.ilike.${t}`);
  }
  const { data, error } = await q;
  if (error) return [];
  const out = ((data ?? []) as RawRow[]).map(normalize);
  for (const h of out) cache.set(h.id, h);
  notify();
  return out;
}

export async function fetchHardwareByIds(
  ids: readonly string[],
): Promise<readonly LibraryHardware[]> {
  const missing = ids.filter((id) => !cache.has(id));
  if (missing.length === 0)
    return ids.map((id) => cache.get(id)!).filter(Boolean) as LibraryHardware[];
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("planner_hardware")
    .select(
      "id,fabricante,marca,categoria,modelo,descricao,imagem_url,preco_unitario,parametros_cnc,furacao,profundidade,folga",
    )
    .in("id", missing);
  if (!error) {
    for (const row of (data ?? []) as RawRow[]) cache.set(row.id, normalize(row));
    notify();
  }
  return ids.map((id) => cache.get(id)).filter(Boolean) as LibraryHardware[];
}
