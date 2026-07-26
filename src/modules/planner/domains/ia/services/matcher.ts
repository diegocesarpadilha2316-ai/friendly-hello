/**
 * Casador paramétrico — Parte 2 do Copiloto.
 *
 * Traduz uma descrição livre em pt-BR (ex.: "aéreo 800 com vidro reeded em
 * louro freijó") num `CatalogItem` REAL da biblioteca da Dioris + overrides
 * paramétricos (largura, cor, material, tipo de frente). Puro, sem estado.
 *
 * Consumido tanto pela ferramenta `insert_described` quanto pelo
 * interpretador heurístico e pelo planner do LLM.
 */
import {
  CATALOG_ITEMS,
  findCatalogItem,
  type CatalogItem,
  type CatalogSubtype,
} from "@/modules/planner/shared";

export type FrontType = "vidro" | "reeded" | "solid" | "aberto";

export interface MatchResult {
  item: CatalogItem;
  overrides: { width?: number; depth?: number; height?: number };
  params: Record<string, string | number | boolean>;
  reasons: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ─────────── subtype ───────────
const SUBTYPE_HINTS: Array<{ subtype: CatalogSubtype; words: string[] }> = [
  { subtype: "aereo", words: ["aereo", "superior", "de cima"] },
  { subtype: "balcao", words: ["balcao", "inferior", "de baixo"] },
  { subtype: "torre", words: ["torre", "torre quente"] },
  { subtype: "gaveteiro", words: ["gaveteiro"] },
  { subtype: "nicho", words: ["nicho"] },
  { subtype: "cristaleira", words: ["cristaleira"] },
  { subtype: "roupeiro", words: ["roupeiro", "guarda-roupa", "guarda roupa"] },
  { subtype: "closet", words: ["closet"] },
  { subtype: "painel", words: ["painel"] },
  { subtype: "ilha", words: ["ilha"] },
  { subtype: "bancada", words: ["bancada"] },
  { subtype: "tampo", words: ["tampo"] },
  { subtype: "prateleira", words: ["prateleira"] },
  { subtype: "armario", words: ["armario"] },
];

function detectSubtype(text: string): CatalogSubtype | null {
  for (const h of SUBTYPE_HINTS) if (h.words.some((w) => text.includes(w))) return h.subtype;
  return null;
}

// ─────────── dimensão ───────────
// Aceita "80", "800", "80cm", "1,20m", "2m", "1200mm".
function parseWidth(text: string): number | null {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?\b/g);
  if (!m) return null;
  for (const raw of m) {
    const mm = raw.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/);
    if (!mm) continue;
    const n = Number(mm[1].replace(",", "."));
    const unit = mm[2];
    let val: number;
    if (unit === "mm") val = n;
    else if (unit === "cm") val = n * 10;
    else if (unit === "m") val = n * 1000;
    else if (n < 10) val = n * 1000; // "1.2" => metros
    else if (n < 100) val = n * 10; // "80" => 800mm (cm)
    else val = n; // já em mm
    if (val >= 200 && val <= 4000) return Math.round(val);
  }
  return null;
}

// ─────────── frente ───────────
function detectFront(text: string): FrontType | null {
  if (/(reeded|canelad|ripad(o|a)\s*em\s*vidro)/.test(text)) return "reeded";
  if (/(porta\s+de\s+vidro|em\s+vidro|com\s+vidro|vidro)/.test(text)) return "vidro";
  if (/(sem\s+porta|aberto|prateleir[ao]s?\s+aberta)/.test(text)) return "aberto";
  if (/(porta\s+solida|frente\s+solida|solid[ao])/.test(text)) return "solid";
  return null;
}

// ─────────── cor / madeira ───────────
const COLOR_ALIASES: Array<{ label: string; words: string[] }> = [
  { label: "Louro Freijó", words: ["louro freijo", "louro freij"] },
  { label: "Freijó", words: ["freijo"] },
  { label: "Carvalho Naturale", words: ["carvalho naturale", "carvalho"] },
  { label: "Nogueira", words: ["nogueira"] },
  { label: "Amêndoa", words: ["amendoa"] },
  { label: "Off White", words: ["off white", "off-white"] },
  { label: "Branco TX", words: ["branco tx", "branco"] },
  { label: "Grafite", words: ["grafite"] },
  { label: "Preto Absoluto", words: ["preto absoluto", "preto"] },
  { label: "Cinza Cristal", words: ["cinza cristal", "cinza"] },
  { label: "Fendi", words: ["fendi"] },
  { label: "Cumaru", words: ["cumaru"] },
  { label: "Imbuia", words: ["imbuia"] },
  { label: "Ipê", words: ["ipe"] },
];

function detectColor(text: string): string | null {
  for (const c of COLOR_ALIASES) if (c.words.some((w) => text.includes(w))) return c.label;
  return null;
}

// ─────────── material ───────────
function detectMaterial(text: string): string | null {
  if (/mdp/.test(text)) return "MDP 18mm";
  if (/compensad/.test(text)) return "Compensado 18mm";
  if (/mdf\s*15/.test(text)) return "MDF 15mm";
  if (/mdf/.test(text)) return "MDF 18mm";
  return null;
}

// ─────────── seleção do item ───────────
function pickBestItem(subtype: CatalogSubtype, wantedWidth: number | null): CatalogItem | null {
  const candidates = CATALOG_ITEMS.filter((i) => i.subtype === subtype);
  if (candidates.length === 0) return null;
  if (wantedWidth == null) return candidates[0];
  // menor distância entre largura default e desejada
  let best = candidates[0];
  let bestDist = Math.abs(best.parametric.defaults.width - wantedWidth);
  for (const c of candidates.slice(1)) {
    const d = Math.abs(c.parametric.defaults.width - wantedWidth);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Casa uma descrição livre com um item real do catálogo + overrides.
 * Retorna `null` quando não é possível identificar o subtype.
 */
export function matchDescription(
  description: string,
  fallback?: { subtype?: CatalogSubtype; catalogItemId?: string },
): MatchResult | null {
  const t = norm(description);
  const subtype = detectSubtype(t) ?? fallback?.subtype ?? null;

  let item: CatalogItem | null = null;
  if (fallback?.catalogItemId) item = findCatalogItem(fallback.catalogItemId) ?? null;
  const wantedWidth = parseWidth(t);

  if (!item && subtype) item = pickBestItem(subtype, wantedWidth);
  if (!item) return null;

  const overrides: MatchResult["overrides"] = {};
  const reasons: string[] = [`item: ${item.name}`];

  if (wantedWidth != null) {
    const range = item.parametric.width;
    const clamped = Math.max(range.min, Math.min(range.max, wantedWidth));
    overrides.width = clamped;
    reasons.push(`largura ${clamped}mm`);
  }

  const params: MatchResult["params"] = {};
  const front = detectFront(t);
  if (front) {
    params.frontType = front;
    params["eng:front"] = front;
    reasons.push(`frente ${front}`);
  }
  const color = detectColor(t);
  if (color) {
    params.color = color;
    reasons.push(`acabamento ${color}`);
  }
  const material = detectMaterial(t);
  if (material) {
    params.material = material;
    reasons.push(`material ${material}`);
  }

  return { item, overrides, params, reasons };
}
