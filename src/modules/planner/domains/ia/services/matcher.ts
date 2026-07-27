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
import { resolvePaint } from "./resolvePaint";

export type FrontType = "vidro" | "reeded" | "solid" | "aberto";

export interface MatchResult {
  item: CatalogItem;
  overrides: { width?: number; depth?: number; height?: number };
  params: Record<string, string | number | boolean>;
  reasons: string[];
  /** Material PBR resolvido (via resolvePaint). Callers propagam ao primitive. */
  materialId?: string;
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
  { subtype: "closet", words: ["closet", "cabideiro", "sapateira", "vestidor", "porta-gravata", "porta gravata", "bijoux"] },
  { subtype: "painel", words: ["painel"] },
  { subtype: "ilha", words: ["ilha"] },
  { subtype: "bancada", words: ["bancada"] },
  { subtype: "tampo", words: ["tampo"] },
  { subtype: "prateleira", words: ["prateleira"] },
  { subtype: "armario", words: ["armario"] },
];

// Decor / arquitetura / eletros / iluminação — permite ao matcher reconhecer
// pedidos como "pendente na ilha", "porcelanato no piso" ou "geladeira Brastemp".
const DECOR_HINTS: Array<{ subtype: CatalogSubtype; words: string[] }> = [
  { subtype: "iluminacao", words: ["pendente", "lustre", "luminaria", "spot", "fita led", "led", "arandela", "plafon"] },
  { subtype: "piso", words: ["piso", "porcelanato", "laminado", "vinilico", "ceramica", "assoalho"] },
  { subtype: "revestimento", words: ["revestimento", "azulejo", "pastilha", "cimenticio"] },
  { subtype: "geladeira", words: ["geladeira", "frigobar", "refrigerador"] },
  { subtype: "fogao", words: ["fogao"] },
  { subtype: "cooktop", words: ["cooktop"] },
  { subtype: "coifa", words: ["coifa", "depurador", "exaustor"] },
  { subtype: "forno", words: ["forno"] },
  { subtype: "microondas", words: ["microondas", "micro-ondas"] },
  { subtype: "lava-loucas", words: ["lava loucas", "lava-loucas", "lava-louça", "lavaloucas"] },
  { subtype: "lava-roupas", words: ["lava roupas", "lava-roupas", "lavadora"] },
  { subtype: "janela", words: ["janela"] },
  { subtype: "porta-ambiente", words: ["porta de ambiente", "porta ambiente"] },
  { subtype: "porta-correr", words: ["porta de correr", "porta correr"] },
  { subtype: "espelho", words: ["espelho"] },
];

function detectSubtype(text: string): CatalogSubtype | null {
  for (const h of SUBTYPE_HINTS) if (h.words.some((w) => text.includes(w))) return h.subtype;
  for (const h of DECOR_HINTS) if (h.words.some((w) => text.includes(w))) return h.subtype;
  return null;
}

// ─────────── dimensão ───────────
// Aceita "80", "800", "80cm", "1,20m", "2m", "1200mm".
function toMillimeters(value: number, unit?: string): number {
  if (unit === "mm") return Math.round(value);
  if (unit === "cm") return Math.round(value * 10);
  if (unit === "m") return Math.round(value * 1000);
  if (value < 10 && !Number.isInteger(value)) return Math.round(value * 1000);
  if (value < 100) return Math.round(value * 10);
  return Math.round(value);
}

function parseDimensionByLabel(text: string, labels: readonly string[]): number | null {
  const label = labels.join("|");
  const before = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?\\s*(?:de\\s*)?(?:${label})`, "i");
  const after = new RegExp(`(?:${label})\\s*(?:de\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?`, "i");
  const m = text.match(before) ?? text.match(after);
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return null;
  const mm = toMillimeters(value, m[2]);
  return mm >= 30 && mm <= 5000 ? mm : null;
}

function parseWidth(text: string): number | null {
  const labeled = parseDimensionByLabel(text, ["largura", "larg", "comprimento"]);
  if (labeled != null) return labeled;
  // Ignora números que qualificam contagem (portas/gavetas/prateleiras) para
  // não confundir "3 portas" com 3m ou "4 gavetas" com 4m.
  const sanitized = text
    .replace(/\b(\d+(?:[.,]\d+)?)\s*(porta|gaveta|prateleir)/g, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?\s*(?:de\s*)?(?:altura|alto|profundidade|prof|fundo)\b/g, "")
    .replace(/\b(?:altura|alto|profundidade|prof|fundo)\s*(?:de\s*)?\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?\b/g, "");
  const m = sanitized.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?\b/g);
  if (!m) return null;
  for (const raw of m) {
    const mm = raw.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/);
    if (!mm) continue;
    const rawNum = mm[1];
    const n = Number(rawNum.replace(",", "."));
    const unit = mm[2];
    const val = toMillimeters(n, unit);
    if (val >= 200 && val <= 4000) return Math.round(val);
  }
  return null;
}

function parseHeight(text: string): number | null {
  return parseDimensionByLabel(text, ["altura", "alto", "ate o teto", "até o teto"]);
}

function parseDepth(text: string): number | null {
  return parseDimensionByLabel(text, ["profundidade", "prof", "fundo"]);
}

function clampParam(value: number, range: { min: number; max: number }): number {
  // Range permissivo: quando o usuário pede uma medida explícita, aceitamos
  // até 3× fora do range paramétrico do catálogo. O motor de layout ainda
  // valida colisão/parede, mas a intenção do usuário nunca é silenciosamente
  // reduzida.
  const lo = Math.min(range.min, Math.round(range.min * 0.4));
  const hi = Math.max(range.max, Math.round(range.max * 3));
  return Math.max(lo, Math.min(hi, value));
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

// ─────────── contagem de portas / gavetas ───────────
// Reconhece "3 portas", "porta tripla", "2 gavetas", "gaveteiro de 4 gavetas".
function detectDoorCount(text: string): number | null {
  const m = text.match(/(\d+)\s*porta/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 8) return n;
  }
  if (/porta\s*(simples|unica|single)/.test(text)) return 1;
  if (/porta\s*dupla/.test(text) || /duas\s*portas/.test(text)) return 2;
  if (/tres\s*portas|porta\s*tripla/.test(text)) return 3;
  if (/quatro\s*portas/.test(text)) return 4;
  return null;
}
function detectDrawerCount(text: string): number | null {
  const m = text.match(/(\d+)\s*gaveta/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 8) return n;
  }
  if (/duas\s*gavetas/.test(text)) return 2;
  if (/tres\s*gavetas/.test(text)) return 3;
  if (/quatro\s*gavetas/.test(text)) return 4;
  if (/cinco\s*gavetas/.test(text)) return 5;
  if (/seis\s*gavetas/.test(text)) return 6;
  return null;
}

// ─────────── seleção do item ───────────
// Palavras-chave que devem privilegiar variantes específicas do catálogo
// quando aparecem no pedido (ex.: "sapateira" → item cujo nome contém
// "sapateira"; "pia" → "Balcão com Cuba"; "forno" → "Torre Quente Forno").
const NAME_HINTS: readonly string[] = [
  "cabideiro", "sapateira", "gravata", "bijoux", "vestidor", "espelho",
  "pia", "cuba", "gourmet", "forno", "micro-ondas", "microondas",
  "correr", "vidro", "reeded", "canelad",
];

function pickBestItem(
  subtype: CatalogSubtype,
  wantedWidth: number | null,
  text: string,
  wantedDoors: number | null,
  wantedDrawers: number | null,
): CatalogItem | null {
  const candidates = CATALOG_ITEMS.filter((i) => i.subtype === subtype);
  if (candidates.length === 0) return null;

  const nameHits = NAME_HINTS.filter((w) => text.includes(w));
  const score = (c: CatalogItem): number => {
    const nameLc = c.name.toLowerCase();
    let s = 0;
    // fidelidade de largura: peso alto (a diferença já entra invertida)
    if (wantedWidth != null) {
      const dist = Math.abs(c.parametric.defaults.width - wantedWidth);
      s -= dist / 10; // 1 pt penal / 10 mm
    }
    // portas / gavetas: bônus quando o nome cita a mesma contagem
    if (wantedDoors != null) {
      const rx = new RegExp(`\\b${wantedDoors}\\s*porta`);
      if (rx.test(nameLc)) s += 500;
    }
    if (wantedDrawers != null) {
      const rx = new RegExp(`\\b${wantedDrawers}\\s*gavet`);
      if (rx.test(nameLc)) s += 500;
    }
    // dicas semânticas: cada palavra-chave presente e refletida no nome
    for (const w of nameHits) if (nameLc.includes(w)) s += 120;
    return s;
  };
  let best = candidates[0];
  let bestScore = score(best);
  for (const c of candidates.slice(1)) {
    const sc = score(c);
    if (sc > bestScore) { best = c; bestScore = sc; }
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
  const wantedHeight = parseHeight(t);
  const wantedDepth = parseDepth(t);
  const wantedDoors = detectDoorCount(t);
  const wantedDrawers = detectDrawerCount(t);

  if (!item && subtype) item = pickBestItem(subtype, wantedWidth, t, wantedDoors, wantedDrawers);
  if (!item) return null;

  const overrides: MatchResult["overrides"] = {};
  const reasons: string[] = [`item: ${item.name}`];

  if (wantedWidth != null) {
    const clamped = clampParam(wantedWidth, item.parametric.width);
    overrides.width = clamped;
    reasons.push(`largura ${clamped}mm`);
  }
  if (wantedHeight != null) {
    const clamped = clampParam(wantedHeight, item.parametric.height);
    overrides.height = clamped;
    reasons.push(`altura ${clamped}mm`);
  }
  if (wantedDepth != null) {
    const clamped = clampParam(wantedDepth, item.parametric.depth);
    overrides.depth = clamped;
    reasons.push(`profundidade ${clamped}mm`);
  }

  const params: MatchResult["params"] = {};
  const front = detectFront(t);
  if (front) {
    params.frontType = front;
    params["eng:front"] = front;
    reasons.push(`frente ${front}`);
  }
  const color = detectColor(t);
  let matchedMaterialId: string | undefined;
  if (color) {
    params.color = color;
    reasons.push(`acabamento ${color}`);
    const paint = resolvePaint(color);
    if (paint) {
      matchedMaterialId = paint.materialId;
      // Fallback visual: extrusion lê params.__color quando não há
      // material da biblioteca casado.
      params["__color"] = paint.colorHex;
    }
  }
  const material = detectMaterial(t);
  if (material) {
    params.material = material;
    reasons.push(`material ${material}`);
  }
  if (wantedDoors != null) {
    params["mod:doors"] = wantedDoors;
    reasons.push(`${wantedDoors} porta(s)`);
  }
  if (wantedDrawers != null) {
    params["mod:drawers"] = wantedDrawers;
    reasons.push(`${wantedDrawers} gaveta(s)`);
  }

  return { item, overrides, params, reasons, materialId: matchedMaterialId };
}
