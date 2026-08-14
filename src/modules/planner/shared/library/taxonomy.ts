/**
 * Módulo 05 — Taxonomia profissional da Biblioteca.
 *
 * As 21 categorias listadas no briefing são organizadas como TAGS SEMÂNTICAS
 * sobre os itens do catálogo (via `subtype`/`tags`), preservando a estrutura
 * de `CatalogCategoryId` já existente. Isso permite a árvore Cozinha → Balcão
 * 1 Porta / 2 Portas / Torre Quente / … sem mexer em cada item.
 */
import type { CatalogItem, CatalogSubtype } from "./types";

export interface RoomBucket {
  id: string;
  label: string;
  /** subtypes que pertencem a este ambiente */
  subtypes: readonly CatalogSubtype[];
  /** tags de contexto que também qualificam (ex.: "cozinha", "closet"). */
  contexts?: readonly string[];
}

export const ROOM_BUCKETS: readonly RoomBucket[] = [
  {
    id: "cozinha",
    label: "Cozinha",
    subtypes: [
      "balcao",
      "aereo",
      "torre",
      "gaveteiro",
      "tampo",
      "bancada",
      "ilha",
      "cristaleira",
      "cooktop",
      "fogao",
      "forno",
      "coifa",
      "microondas",
      "lava-loucas",
      "adega",
      "geladeira",
      "cuba",
      "torneira",
    ],
    contexts: ["cozinha"],
  },
  {
    id: "closet",
    label: "Closet",
    subtypes: ["closet", "roupeiro", "cristaleira", "gaveteiro"],
    contexts: ["closet"],
  },
  {
    id: "dormitorio",
    label: "Dormitório",
    subtypes: ["roupeiro", "cama", "criado-mudo", "painel", "aereo"],
    contexts: ["dormitorio"],
  },
  {
    id: "banheiro",
    label: "Banheiro",
    subtypes: [
      "cuba",
      "torneira",
      "vaso-sanitario",
      "chuveiro",
      "banheira",
      "espelho",
      "balcao",
      "gaveteiro",
    ],
    contexts: ["banheiro"],
  },
  {
    id: "lavanderia",
    label: "Lavanderia",
    subtypes: ["balcao", "aereo", "tampo", "cuba", "lava-roupas"],
    contexts: ["lavanderia", "area-servico"],
  },
  {
    id: "home-office",
    label: "Home Office",
    subtypes: ["mesa", "cadeira", "estante", "painel", "balcao", "aereo"],
    contexts: ["escritorio", "home-office"],
  },
  {
    id: "sala",
    label: "Sala",
    subtypes: [
      "painel",
      "cristaleira",
      "nicho",
      "sofa",
      "mesa",
      "aparador",
      "estante",
      "tv",
      "poltrona",
    ],
    contexts: ["sala", "estar"],
  },
  { id: "paineis", label: "Painéis", subtypes: ["painel"] },
  { id: "ilhas", label: "Ilhas", subtypes: ["ilha"] },
  { id: "torres", label: "Torres", subtypes: ["torre"] },
  { id: "cristaleiras", label: "Cristaleiras", subtypes: ["cristaleira"] },
  { id: "nichos", label: "Nichos", subtypes: ["nicho"] },
  { id: "aereos", label: "Armários Aéreos / Superiores", subtypes: ["aereo"] },
  { id: "inferiores", label: "Armários Inferiores / Balcões", subtypes: ["balcao", "gaveteiro"] },
  { id: "roupeiros", label: "Roupeiros", subtypes: ["roupeiro"] },
  { id: "mesas", label: "Mesas", subtypes: ["mesa", "bancada"] },
  { id: "estantes", label: "Estantes", subtypes: ["estante"] },
  { id: "racks", label: "Racks", subtypes: ["aparador"], contexts: ["rack", "tv"] },
  { id: "criados", label: "Criados-mudos", subtypes: ["criado-mudo"] },
  {
    id: "iluminacao",
    label: "Iluminação",
    subtypes: ["iluminacao", "luminaria", "pendente", "arandela", "spot"],
  },
  {
    id: "decoracao",
    label: "Decoração",
    subtypes: [
      "tapete",
      "cortina",
      "persiana",
      "quadro",
      "vaso-planta",
      "planta",
      "livro",
      "objeto-deco",
    ],
  },
];

export function bucketsFor(item: CatalogItem): string[] {
  const st = String(item.subtype);
  const ctxs = new Set(item.ai.contexts.map((c) => c.toLowerCase()));
  const tags = new Set(item.tags.map((t) => t.toLowerCase()));
  const hits: string[] = [];
  for (const b of ROOM_BUCKETS) {
    if ((b.subtypes as readonly string[]).includes(st)) {
      hits.push(b.id);
      continue;
    }
    if (b.contexts?.some((c) => ctxs.has(c) || tags.has(c))) hits.push(b.id);
  }
  return hits;
}

/** Conta itens por bucket para o painel esquerdo do LibraryPanel. */
export function countBuckets(items: readonly CatalogItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) for (const b of bucketsFor(it)) out[b] = (out[b] ?? 0) + 1;
  return out;
}
