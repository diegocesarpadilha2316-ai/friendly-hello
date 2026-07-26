/**
 * Biblioteca Dioris — bridge Supabase → Planner.
 *
 * Fonte única para materiais/ferragens oficiais publicados na tabela
 * `planner_materials` / `planner_hardware`. Consumido pelo Editor 3D,
 * Visualização Realista, Render Final e Orçamento — sempre via cache
 * em memória com carregamento sob demanda. Nenhum novo provider,
 * store ou motor é criado.
 */
import { getSupabaseBrowser } from "@/core/lib/supabase/client";
import { getPbrMaterial, isPbrId, listPbrMaterials } from "@/modules/planner/shared/materials/pbr-catalog";

export interface LibraryMaterial {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly line: string | null;
  readonly category: string;
  readonly pattern: string | null;
  readonly colorName: string | null;
  readonly colorHex: string | null;
  readonly textureUrl: string | null;
  readonly thicknessMm: number;
  /** Largura da chapa em mm — usada como tile em X. */
  readonly widthMm: number | null;
  /** Comprimento da chapa em mm — usada como tile em Y. */
  readonly lengthMm: number | null;
  readonly grain: "vertical" | "horizontal" | "livre" | null;
  readonly pricePerM2: number | null;
}

interface RawRow {
  id: string;
  fabricante: string;
  marca: string;
  linha: string | null;
  categoria: string;
  padrao: string | null;
  cor_nome: string | null;
  cor_hex: string | null;
  textura_url: string | null;
  espessura_mm: number | string;
  largura_mm: number | string | null;
  comprimento_mm: number | string | null;
  sentido_veio: LibraryMaterial["grain"];
  preco_m2: number | string | null;
}

const cache = new Map<string, LibraryMaterial>();
const pending = new Map<string, Promise<LibraryMaterial | null>>();
const subscribers = new Set<() => void>();
let pendingIds = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function normalize(row: RawRow): LibraryMaterial {
  const num = (v: unknown): number | null => {
    if (v == null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const pattern = row.padrao ?? row.cor_nome ?? row.linha ?? null;
  return {
    id: row.id,
    name: [row.fabricante, row.linha, pattern].filter(Boolean).join(" · ") || row.id,
    manufacturer: row.fabricante,
    line: row.linha,
    category: row.categoria,
    pattern,
    colorName: row.cor_nome,
    colorHex: row.cor_hex,
    textureUrl: row.textura_url,
    thicknessMm: num(row.espessura_mm) ?? 18,
    widthMm: num(row.largura_mm),
    lengthMm: num(row.comprimento_mm),
    grain: row.sentido_veio,
    pricePerM2: num(row.preco_m2),
  };
}

function notify() {
  for (const cb of subscribers) cb();
}

async function flush() {
  flushTimer = null;
  const ids = Array.from(pendingIds);
  pendingIds = new Set();
  if (ids.length === 0) return;
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("planner_materials")
      .select(
        "id,fabricante,marca,linha,categoria,padrao,cor_nome,cor_hex,textura_url,espessura_mm,largura_mm,comprimento_mm,sentido_veio,preco_m2",
      )
      .in("id", ids);
    if (error) throw error;
    const seen = new Set<string>();
    for (const row of (data ?? []) as RawRow[]) {
      const mat = normalize(row);
      cache.set(mat.id, mat);
      seen.add(mat.id);
    }
    // Marca ausentes como resolvidos-nulos para não reconsultar em loop.
    for (const id of ids) {
      if (!seen.has(id)) cache.set(id, { ...emptyMaterial(id) });
    }
  } catch {
    // Falhou: apenas limpa pendentes, mantém tentativa futura possível.
  } finally {
    for (const id of ids) pending.delete(id);
    notify();
  }
}

function emptyMaterial(id: string): LibraryMaterial {
  return {
    id,
    name: id,
    manufacturer: "",
    line: null,
    category: "chapa",
    pattern: null,
    colorName: null,
    colorHex: null,
    textureUrl: null,
    thicknessMm: 18,
    widthMm: null,
    lengthMm: null,
    grain: null,
    pricePerM2: null,
  };
}

export function getCachedLibraryMaterial(id: string): LibraryMaterial | null {
  if (isPbrId(id)) return getPbrMaterial(id);
  return cache.get(id) ?? null;
}

export function requestLibraryMaterial(id: string): Promise<LibraryMaterial | null> {
  if (!id) return Promise.resolve(null);
  if (isPbrId(id)) {
    const mat = getPbrMaterial(id);
    if (mat) return Promise.resolve(mat);
  }
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(id);
  if (inflight) return inflight;
  const promise = new Promise<LibraryMaterial | null>((resolve) => {
    const unsub = subscribeLibrary(() => {
      const c = cache.get(id);
      if (c) {
        unsub();
        resolve(c);
      }
    });
  });
  pending.set(id, promise);
  pendingIds.add(id);
  if (flushTimer == null) flushTimer = setTimeout(flush, 30);
  return promise;
}

export function subscribeLibrary(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export async function searchLibraryMaterials(params: {
  query?: string;
  category?: string;
  limit?: number;
}): Promise<readonly LibraryMaterial[]> {
  const pbr = listPbrMaterials().filter((m) => {
    if (params.category && m.category !== params.category) return false;
    if (params.query && params.query.trim()) {
      const q = params.query.trim().toLowerCase();
      return (m.pattern ?? "").toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    }
    return true;
  });
  const supabase = getSupabaseBrowser();
  let q = supabase
    .from("planner_materials")
    .select(
      "id,fabricante,marca,linha,categoria,padrao,cor_nome,cor_hex,textura_url,espessura_mm,largura_mm,comprimento_mm,sentido_veio,preco_m2",
    )
    .eq("ativo", true)
    .limit(params.limit ?? 60);
  if (params.category) q = q.eq("categoria", params.category);
  if (params.query && params.query.trim()) {
    const term = `%${params.query.trim()}%`;
    q = q.or(
      `padrao.ilike.${term},cor_nome.ilike.${term},fabricante.ilike.${term},linha.ilike.${term}`,
    );
  }
  const { data, error } = await q;
  if (error) return pbr;
  const out = ((data ?? []) as RawRow[]).map(normalize);
  for (const m of out) cache.set(m.id, m);
  notify();
  return [...pbr, ...out];
}

/** Resolver síncrono para consumidores em batch (pricing, exportações). */
export function resolveLibraryMaterialsSync(
  ids: readonly string[],
): Map<string, LibraryMaterial> {
  const out = new Map<string, LibraryMaterial>();
  for (const id of ids) {
    const m = cache.get(id);
    if (m) out.set(id, m);
    else requestLibraryMaterial(id);
  }
  return out;
}