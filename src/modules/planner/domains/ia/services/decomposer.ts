/**
 * Decompositor determinístico — regra máxima do Dioris Planner.
 *
 * Converte uma frase livre em pt-BR ("cozinha com aéreo de 3 portas, balcão
 * com 2 portas, porta-condimentos e 4 gavetas") em uma composição TÉCNICA
 * exata: preset de ambiente + lista de módulos com quantidades explícitas
 * de portas/gavetas.
 *
 * Nunca inventa itens. Se um pedaço da frase não casar com um subtipo
 * conhecido, ele vai para `unresolved` para a IA questionar o usuário.
 */
import type { LayoutPieceSpec, LayoutWall } from "./layout";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const PRESETS: Array<{ preset: string; words: string[] }> = [
  { preset: "cozinha", words: ["cozinha"] },
  { preset: "closet", words: ["closet"] },
  { preset: "dormitorio", words: ["dormitorio", "quarto"] },
  { preset: "sala", words: ["sala", "estar", "living"] },
  { preset: "escritorio", words: ["escritorio", "home office"] },
  { preset: "banheiro", words: ["banheiro", "lavabo"] },
  { preset: "lavanderia", words: ["lavanderia", "area de servico"] },
];

/**
 * Vocabulário de módulos reconhecidos. `re` é aplicado ao trecho da frase.
 * `wall` sugere onde encostar por padrão. `desc` é a descrição que será
 * passada ao matcher (o matcher ainda extrai portas/gavetas/cor daí).
 */
interface ModuleToken {
  id: string;
  label: string;
  re: RegExp;
  descBase: string;
  wall?: LayoutWall;
}

const TOKENS: ModuleToken[] = [
  { id: "armario", label: "Armário", re: /armari/, descBase: "armário", wall: "bottom" },
  { id: "aereo", label: "Aéreo", re: /aereo/, descBase: "aéreo", wall: "bottom" },
  {
    id: "balcao-pia",
    label: "Balcão da pia",
    re: /balcao\s+(?:d[ea]\s+)?pia|balcao\s+pia|\bpia\b|cuba/,
    descBase: "balcão da pia com cuba inox",
    wall: "bottom",
  },
  { id: "balcao", label: "Balcão", re: /balcao/, descBase: "balcão", wall: "bottom" },
  { id: "gaveteiro", label: "Gaveteiro", re: /gaveteir/, descBase: "gaveteiro", wall: "bottom" },
  {
    id: "porta-condimentos",
    label: "Porta-condimentos",
    re: /porta[-\s]?condiment|porta[-\s]?tempero|especiari/,
    descBase: "gaveteiro 300mm porta-temperos",
    wall: "bottom",
  },
  { id: "torre", label: "Torre", re: /torre/, descBase: "torre forno microondas", wall: "right" },
  {
    id: "cristaleira",
    label: "Cristaleira",
    re: /cristaleir/,
    descBase: "cristaleira vidro",
    wall: "bottom",
  },
  {
    id: "roupeiro",
    label: "Roupeiro",
    re: /roupeir|guarda[-\s]?roupa/,
    descBase: "roupeiro",
    wall: "bottom",
  },
  {
    id: "closet-mod",
    label: "Módulo closet",
    re: /closet/,
    descBase: "closet cabideiro",
    wall: "bottom",
  },
  { id: "nicho", label: "Nicho", re: /nicho/, descBase: "nicho", wall: "bottom" },
  { id: "painel", label: "Painel", re: /painel/, descBase: "painel ripado", wall: "bottom" },
  { id: "ilha", label: "Ilha", re: /ilha/, descBase: "ilha", wall: "top" },
  {
    id: "prateleira",
    label: "Prateleira",
    re: /prateleir/,
    descBase: "prateleira",
    wall: "bottom",
  },
  { id: "espelho", label: "Espelho", re: /espelho/, descBase: "espelho", wall: "bottom" },
  {
    id: "bancada",
    label: "Bancada",
    re: /bancada|tampo/,
    descBase: "bancada Quartzo",
    wall: "bottom",
  },
  {
    id: "cooktop",
    label: "Cooktop",
    re: /cooktop/,
    descBase: "cooktop 600mm inox",
    wall: "bottom",
  },
  {
    id: "coifa",
    label: "Coifa",
    re: /coifa|depurador|exaustor/,
    descBase: "coifa 600mm inox",
    wall: "bottom",
  },
  { id: "forno", label: "Forno", re: /forno/, descBase: "forno inox", wall: "right" },
  {
    id: "microondas",
    label: "Micro-ondas",
    re: /microond|micro-ond/,
    descBase: "microondas inox",
    wall: "right",
  },
  {
    id: "geladeira",
    label: "Geladeira",
    re: /geladeira|refrigerador|frigobar/,
    descBase: "geladeira 700mm inox",
    wall: "right",
  },
  {
    id: "lava-loucas",
    label: "Lava-louças",
    re: /lava[-\s]?louc/,
    descBase: "lava-louças 600mm inox",
    wall: "bottom",
  },
  {
    id: "gabinete-banheiro",
    label: "Gabinete suspenso",
    re: /gabinete(?:\s+de\s+banheiro)?|gabinete\s+suspenso/,
    descBase: "gabinete de banheiro suspenso",
    wall: "bottom",
  },
  {
    id: "maquina-lavar",
    label: "Máquina de lavar",
    re: /maquina(?:\s+de)?\s+lavar|lavadora/,
    descBase: "máquina de lavar frontal 700mm",
    wall: "bottom",
  },
  {
    id: "tanque",
    label: "Tanque",
    re: /\btanque\b/,
    descBase: "balcão com tanque 800mm",
    wall: "bottom",
  },
];

export interface DecomposedModule {
  /** Trecho original da frase que originou este módulo. */
  raw: string;
  /** Rótulo humano do módulo detectado (aéreo, balcão, gaveteiro…). */
  label: string;
  /** Descrição enriquecida a ser passada ao matcher/layout. */
  description: string;
  /** Parede sugerida (o matcher pode ignorar quando o layout for U/L). */
  wall?: LayoutWall;
  /** Quantidade de módulos deste tipo. */
  count: number;
  /** Portas explícitas (`3 portas`). */
  doors?: number;
  /** Gavetas explícitas (`4 gavetas`). */
  drawers?: number;
  /** Largura explícita em mm. */
  width?: number;
  /** Altura explícita em mm. */
  height?: number;
  /** Profundidade explícita em mm. */
  depth?: number;
}

export interface Decomposition {
  preset: string | null;
  style?: string;
  modules: DecomposedModule[];
  /** Trechos que a IA não conseguiu casar — devem virar perguntas. */
  unresolved: string[];
}

const CONNECTORS = /,|;| e | mais | \+ | com | contendo /gi;

// Palavras de preamble/ambiente que NÃO devem virar "unresolved".
// Elas apenas anunciam a intenção ("quero uma cozinha", "faz um closet")
// e o blueprint padrão do ambiente cobre o resto.
const PREAMBLE_WORDS = new Set([
  "quero",
  "queria",
  "gostaria",
  "preciso",
  "cria",
  "crie",
  "criar",
  "faca",
  "faco",
  "faz",
  "fazer",
  "feito",
  "monta",
  "montar",
  "gera",
  "gerar",
  "mande",
  "mandei",
  "pedi",
  "projeto",
  "ambiente",
  "um",
  "uma",
  "o",
  "a",
  "novo",
  "nova",
  "modelo",
  "design",
  "estilo",
  "por",
  "favor",
  "de",
  "do",
  "da",
  "para",
  "pra",
  "planejad",
  "planejada",
  "planejado",
  "completo",
  "completa",
  "simples",
  "pequen",
  "pequena",
  "pequeno",
  "moderna",
  "moderno",
  "classic",
  "classica",
  "classico",
  "luxo",
  "luxuoso",
  "luxuosa",
  "industrial",
  "minimalista",
  "em",
  "com",
  "no",
  "na",
  // materiais/acabamentos: aparecem no preamble, não são módulos.
  "freijo",
  "louro",
  "nogueira",
  "carvalho",
  "branco",
  "branca",
  "fosco",
  "tx",
  "grafite",
  "chumbo",
  "quartzo",
  "cumaru",
  "mdf",
  "mdp",
  "laca",
  "laqueado",
  "vidro",
  "reeded",
  "canelado",
  "canelada",
  "off",
  "white",
]);
// Nomes de ambiente que também são só declaração de intenção quando aparecem sozinhos.
const ENV_WORDS = new Set([
  "cozinha",
  "closet",
  "dormitorio",
  "quarto",
  "sala",
  "estar",
  "living",
  "escritorio",
  "home",
  "office",
  "banheiro",
  "lavabo",
  "lavanderia",
]);

function chunkIsOnlyPreamble(chunk: string): boolean {
  const words = chunk
    .replace(/[.,;:!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return true;
  return words.every((w) => PREAMBLE_WORDS.has(w) || ENV_WORDS.has(w));
}

function toMillimeters(value: number, unit?: string): number {
  if (unit === "m") return Math.round(value * 1000);
  if (unit === "cm") return Math.round(value * 10);
  if (unit === "mm") return Math.round(value);
  if (value < 10 && !Number.isInteger(value)) return Math.round(value * 1000);
  if (value < 100) return Math.round(value * 10);
  return Math.round(value);
}

function parseDimensionByLabel(text: string, labels: readonly string[]): number | undefined {
  const label = labels.join("|");
  const before = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?\\s*(?:de\\s*)?(?:${label})`, "i");
  const after = new RegExp(`(?:${label})\\s*(?:de\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?`, "i");
  const m = text.match(before) ?? text.match(after);
  if (!m) return undefined;
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  const mm = toMillimeters(value, m[2]);
  return mm >= 40 && mm <= 5000 ? mm : undefined;
}

function extractDimensions(text: string): { width?: number; height?: number; depth?: number } {
  const seq = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:mm|cm|m)?\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\s*(?:mm|cm|m)?\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i,
  );
  if (seq) {
    const unit = seq[4];
    const width = toMillimeters(Number(seq[1].replace(",", ".")), unit);
    const height = toMillimeters(Number(seq[2].replace(",", ".")), unit);
    const depth = toMillimeters(Number(seq[3].replace(",", ".")), unit);
    return { width, height, depth };
  }
  return {
    width: parseDimensionByLabel(text, ["largura", "larg", "comprimento"]),
    height: parseDimensionByLabel(text, ["altura", "alto", "ate o teto", "até o teto"]),
    depth: parseDimensionByLabel(text, ["profundidade", "prof", "fundo"]),
  };
}

function extractWall(text: string): LayoutWall | undefined {
  if (/parede\s+(?:da\s+)?esquerda|lado\s+esquerdo|a\s+esquerda/.test(text)) return "left";
  if (/parede\s+(?:da\s+)?direita|lado\s+direito|a\s+direita/.test(text)) return "right";
  if (/parede\s+(?:do\s+)?fundo|ao\s+fundo|no\s+fundo/.test(text)) return "top";
  if (/parede\s+(?:frontal|da\s+frente)|na\s+frente|frontal/.test(text)) return "bottom";
  return undefined;
}

function extractFinish(text: string): string | undefined {
  if (/louro\s+freijo|louro-freijo/.test(text)) return "Louro Freijó";
  if (/freijo/.test(text)) return "Freijó";
  if (/preto\s+absoluto|preto|preta/.test(text)) return "Preto Absoluto";
  if (/branco\s+tx|branco|branca/.test(text)) return "Branco TX";
  if (/off\s+white|off-white/.test(text)) return "Off White";
  if (/nogueira/.test(text)) return "Nogueira";
  if (/carvalho/.test(text)) return "Carvalho";
  if (/grafite|chumbo/.test(text)) return "Grafite";
  return undefined;
}

function chunkIsOnlyQualifier(chunk: string): boolean {
  if (chunkIsOnlyPreamble(chunk)) return true;
  const cleaned = chunk
    .replace(/\d+(?:[.,]\d+)?\s*(mm|cm|m)?/g, " ")
    .replace(
      /\b(largura|larg|altura|alto|profundidade|prof|fundo|parede|esquerda|direita|frente|frontal|preto|preta|absoluto|freijo|louro|branco|branca|tx|off|white|nogueira|carvalho|grafite|chumbo|cor|na|no|da|do|de|com|coloque|coloca|encoste|encosta|encostad[ao]|ele|ela|lado)\b/g,
      " ",
    )
    .replace(/[.,;:!?]/g, " ")
    .trim();
  return cleaned.length === 0;
}

function extractNumber(chunk: string, kind: "porta" | "gaveta"): number | undefined {
  const re = new RegExp(`(\\d+)\\s*${kind}`, "i");
  const m = chunk.match(re);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 8) return n;
  }
  if (kind === "porta") {
    if (/porta\s*dupla|duas\s*portas/i.test(chunk)) return 2;
    if (/tres\s*portas|porta\s*tripla/i.test(chunk)) return 3;
    if (/quatro\s*portas/i.test(chunk)) return 4;
  } else {
    if (/duas\s*gavetas/i.test(chunk)) return 2;
    if (/tres\s*gavetas/i.test(chunk)) return 3;
    if (/quatro\s*gavetas/i.test(chunk)) return 4;
    if (/cinco\s*gavetas/i.test(chunk)) return 5;
    if (/seis\s*gavetas/i.test(chunk)) return 6;
  }
  return undefined;
}

function extractCount(chunk: string): number {
  // "2 armários", "3x aéreos" — número no início do trecho.
  const m = chunk.match(/^\s*(\d+)\s*(?:x|×)?\s+/i);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 20) return n;
  }
  return 1;
}

/** Decompõe a frase em um plano técnico. */
export function decompose(input: string): Decomposition {
  const t = norm(input);
  const preset = PRESETS.find((p) => p.words.some((w) => t.includes(w)))?.preset ?? null;
  const globalDimensions = extractDimensions(t);
  const globalWall = extractWall(t);
  const globalFinish = extractFinish(t);

  const chunks = t
    .split(CONNECTORS)
    .map((c) => c.trim())
    .filter(Boolean);

  const modules: DecomposedModule[] = [];
  const unresolved: string[] = [];

  for (const chunk of chunks) {
    if (!chunk) continue;
    // Escolhe o token cuja regex casa o MAIOR trecho da frase (mais
    // específico vence). Isso garante que "balcão de pia" case com
    // `balcao-pia` (12 chars) e não com `balcao` (6 chars) — mesmo que
    // `balcao` apareça primeiro no chunk.
    let matched: ModuleToken | null = null;
    let bestLen = 0;
    let earliest = Infinity;
    for (const tok of TOKENS) {
      const m = chunk.match(tok.re);
      if (!m || m.index == null) continue;
      const len = m[0].length;
      // Prefere maior match; empates ficam com o que aparece mais cedo.
      if (len > bestLen || (len === bestLen && m.index < earliest)) {
        matched = tok;
        bestLen = len;
        earliest = m.index;
      }
    }
    if (!matched) {
      // Trechos que só mencionam contagem ("4 gavetas") sem tipo → assumir
      // gaveteiro (o exemplo canônico do prompt). Portas soltas idem: aéreo.
      if (/gaveta/.test(chunk)) matched = TOKENS.find((x) => x.id === "gaveteiro") ?? null;
      else if (/porta/.test(chunk)) matched = TOKENS.find((x) => x.id === "aereo") ?? null;
    }
    if (!matched) {
      if (chunk.length > 2 && !chunkIsOnlyQualifier(chunk)) unresolved.push(chunk);
      continue;
    }
    const count = extractCount(chunk);
    const doors = extractNumber(chunk, "porta");
    const drawers = extractNumber(chunk, "gaveta");
    const localDimensions = extractDimensions(chunk);
    const width = localDimensions.width ?? globalDimensions.width;
    const height = localDimensions.height ?? globalDimensions.height;
    const depth = localDimensions.depth ?? globalDimensions.depth;
    const wall = extractWall(chunk) ?? globalWall ?? matched.wall;
    const bits: string[] = [matched.descBase];
    if (width) bits.push(`${width}mm largura`);
    if (height) bits.push(`${height}mm altura`);
    if (depth) bits.push(`${depth}mm profundidade`);
    if (doors) bits.push(`${doors} portas`);
    if (drawers) bits.push(`${drawers} gavetas`);
    if (globalFinish) bits.push(globalFinish);
    modules.push({
      raw: chunk,
      label: matched.label,
      description: bits.join(" "),
      wall,
      count,
      doors,
      drawers,
      width,
      height,
      depth,
    });
  }

  return { preset, modules, unresolved };
}

/** Converte a decomposição em pieces para o motor de layout. */
export function toLayoutPieces(dec: Decomposition): LayoutPieceSpec[] {
  return dec.modules.map((m) => ({
    description: m.description,
    count: m.count,
    wall: m.wall,
    width: m.width,
    height: m.height,
    depth: m.depth,
  }));
}

/**
 * Valida a saída do projeto — Modo Engenharia. Retorna a lista de
 * discrepâncias entre o pedido decomposto e o inserido.
 */
export interface CompositionCheck {
  ok: boolean;
  requested: number;
  placed: number;
  missing: string[];
  notes: string[];
}

export function validateComposition(
  dec: Decomposition,
  placedLabels: readonly string[],
): CompositionCheck {
  const requested = dec.modules.reduce((acc, m) => acc + m.count, 0);
  const missing: string[] = [];
  const notes: string[] = [];
  for (const m of dec.modules) {
    const found = placedLabels.filter((l) =>
      l.toLowerCase().includes(m.label.toLowerCase()),
    ).length;
    if (found < m.count) missing.push(`${m.label} (${found}/${m.count})`);
    if (m.doors) notes.push(`${m.label}: ${m.doors} porta(s) solicitadas`);
    if (m.drawers) notes.push(`${m.label}: ${m.drawers} gaveta(s) solicitadas`);
  }
  return {
    ok: missing.length === 0,
    requested,
    placed: placedLabels.length,
    missing,
    notes,
  };
}
