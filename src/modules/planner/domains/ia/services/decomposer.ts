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
  { id: "aereo", label: "Aéreo", re: /aereo/, descBase: "aéreo", wall: "bottom" },
  { id: "balcao-pia", label: "Balcão da pia", re: /balcao\s+(?:da\s+)?pia|balcao\s+pia|pia/, descBase: "balcão da pia", wall: "bottom" },
  { id: "balcao", label: "Balcão", re: /balcao/, descBase: "balcão", wall: "bottom" },
  { id: "gaveteiro", label: "Gaveteiro", re: /gaveteir/, descBase: "gaveteiro", wall: "bottom" },
  { id: "porta-condimentos", label: "Porta-condimentos", re: /porta[-\s]?condiment|porta[-\s]?tempero|especiari/, descBase: "gaveteiro 300mm porta-temperos", wall: "bottom" },
  { id: "torre", label: "Torre", re: /torre/, descBase: "torre forno microondas", wall: "right" },
  { id: "cristaleira", label: "Cristaleira", re: /cristaleir/, descBase: "cristaleira vidro", wall: "bottom" },
  { id: "roupeiro", label: "Roupeiro", re: /roupeir|guarda[-\s]?roupa/, descBase: "roupeiro", wall: "bottom" },
  { id: "closet-mod", label: "Módulo closet", re: /closet/, descBase: "closet cabideiro", wall: "bottom" },
  { id: "nicho", label: "Nicho", re: /nicho/, descBase: "nicho", wall: "bottom" },
  { id: "painel", label: "Painel", re: /painel/, descBase: "painel ripado", wall: "bottom" },
  { id: "ilha", label: "Ilha", re: /ilha/, descBase: "ilha", wall: "top" },
  { id: "prateleira", label: "Prateleira", re: /prateleir/, descBase: "prateleira", wall: "bottom" },
  { id: "espelho", label: "Espelho", re: /espelho/, descBase: "espelho", wall: "bottom" },
  { id: "bancada", label: "Bancada", re: /bancada|tampo/, descBase: "bancada Quartzo", wall: "bottom" },
  { id: "cooktop", label: "Cooktop", re: /cooktop/, descBase: "cooktop 600mm inox", wall: "bottom" },
  { id: "coifa", label: "Coifa", re: /coifa|depurador|exaustor/, descBase: "coifa 600mm inox", wall: "bottom" },
  { id: "forno", label: "Forno", re: /forno/, descBase: "forno inox", wall: "right" },
  { id: "microondas", label: "Micro-ondas", re: /microond|micro-ond/, descBase: "microondas inox", wall: "right" },
  { id: "geladeira", label: "Geladeira", re: /geladeira|refrigerador|frigobar/, descBase: "geladeira 700mm inox", wall: "right" },
  { id: "lava-loucas", label: "Lava-louças", re: /lava[-\s]?louc/, descBase: "lava-louças 600mm inox", wall: "bottom" },
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
  "quero","queria","gostaria","preciso","cria","crie","criar","faca","faz",
  "monta","montar","gera","gerar","projeto","ambiente","um","uma","o","a",
  "novo","nova","modelo","design","estilo","por","favor","de","do","da",
  "para","pra","planejad","planejada","planejado","completo","completa","simples",
  "pequen","pequena","pequeno","moderna","moderno","classic","classica","classico",
  "luxo","luxuoso","luxuosa","industrial","minimalista",
]);
// Nomes de ambiente que também são só declaração de intenção quando aparecem sozinhos.
const ENV_WORDS = new Set([
  "cozinha","closet","dormitorio","quarto","sala","estar","living","escritorio",
  "home","office","banheiro","lavabo","lavanderia",
]);

function chunkIsOnlyPreamble(chunk: string): boolean {
  const words = chunk.replace(/[.,;:!?]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  return words.every((w) => PREAMBLE_WORDS.has(w) || ENV_WORDS.has(w));
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

  // Só decompõe pedaços após conectores — evita capturar palavras avulsas
  // do preamble ("quero uma cozinha com..." → "cozinha" fica no preamble).
  const chunks = t
    .replace(/^.*?\bcom\b/, "") // corta preamble até "com"
    .split(CONNECTORS)
    .map((c) => c.trim())
    .filter(Boolean);

  const modules: DecomposedModule[] = [];
  const unresolved: string[] = [];

  for (const chunk of chunks) {
    if (!chunk) continue;
    // Encontra o token cuja regex casa mais cedo (mais específico primeiro).
    let matched: ModuleToken | null = null;
    let earliest = Infinity;
    for (const tok of TOKENS) {
      const m = chunk.match(tok.re);
      if (m && m.index != null && m.index < earliest) {
        matched = tok;
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
      if (chunk.length > 2) unresolved.push(chunk);
      continue;
    }
    const count = extractCount(chunk);
    const doors = extractNumber(chunk, "porta");
    const drawers = extractNumber(chunk, "gaveta");
    const bits: string[] = [matched.descBase];
    if (doors) bits.push(`${doors} portas`);
    if (drawers) bits.push(`${drawers} gavetas`);
    modules.push({
      raw: chunk,
      label: matched.label,
      description: bits.join(" "),
      wall: matched.wall,
      count,
      doors,
      drawers,
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
    const found = placedLabels.filter((l) => l.toLowerCase().includes(m.label.toLowerCase())).length;
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