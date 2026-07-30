/**
 * Ficha Técnica do Móvel (FurnitureSpec).
 *
 * Camada de PRECISÃO da interpretação: antes de qualquer criação, o pedido
 * do usuário em pt-BR é convertido numa ficha estruturada e auditável com
 * TODOS os atributos que definem um móvel de marcenaria — tipo, ambiente,
 * medidas, portas, tipo de abertura, gavetas, divisões internas, maleiro,
 * cabideiros, nichos, espelhos, material, cor, puxador, estilo, acessórios
 * e posição no ambiente.
 *
 * Regras:
 *   - Nunca inventa silenciosamente: todo valor assumido entra em
 *     `assumptions` para a IA informar no chat.
 *   - Só marca `missing` (pergunta obrigatória) quando o dado é realmente
 *     indispensável — hoje, apenas o TIPO do móvel.
 *   - A ficha não gera geometria: ela é traduzida em descrição canônica +
 *     params do módulo, consumidos pelo Planner Engine (matcher/tools).
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export type FurnitureTypeId =
  | "roupeiro"
  | "closet"
  | "armario"
  | "aereo"
  | "balcao"
  | "gaveteiro"
  | "torre"
  | "cristaleira"
  | "painel"
  | "nicho"
  | "prateleira"
  | "bancada"
  | "ilha";

export type OpeningId = "abrir" | "correr" | "sanfonada" | "basculante" | "sem-porta";

export type MirrorPosition = "central" | "todas" | "lateral" | "interna";

export interface FurnitureSpec {
  /** Tipo canônico do móvel (indispensável). */
  type: FurnitureTypeId | null;
  /** Ambiente inferido ou declarado. */
  environment: string;
  width: number;
  height: number;
  depth: number;
  doors: number;
  opening: OpeningId;
  drawers: number;
  /** Divisões internas verticais (montantes) — 0 = automático. */
  divisions: number;
  /** Prateleiras internas. */
  shelves: number;
  maleiro: boolean;
  cabideiros: number;
  nichos: number;
  mirror: { has: boolean; position: MirrorPosition } | null;
  material: string;
  color: string;
  handle: string;
  style: string;
  accessories: string[];
  /** Parede/posição no ambiente. */
  position: "left" | "right" | "top" | "bottom" | "centro";
  /** Suposições aplicadas (texto humano para o chat). */
  assumptions: string[];
  /** Dados indispensáveis ausentes — a IA deve perguntar. */
  missing: string[];
  /** Campos declarados explicitamente pelo usuário (não assumidos). */
  explicit: Set<keyof FurnitureSpec>;
}

// ───────────────────────── vocabulário ─────────────────────────

const TYPE_WORDS: Array<{ id: FurnitureTypeId; re: RegExp; env: string }> = [
  { id: "roupeiro", re: /roupeir|guarda[-\s]?roupa/, env: "dormitorio" },
  { id: "closet", re: /closet|vestidor/, env: "closet" },
  { id: "cristaleira", re: /cristaleir/, env: "cozinha" },
  { id: "gaveteiro", re: /gaveteir/, env: "cozinha" },
  { id: "torre", re: /torre/, env: "cozinha" },
  { id: "aereo", re: /aereo/, env: "cozinha" },
  { id: "balcao", re: /balcao/, env: "cozinha" },
  { id: "painel", re: /painel/, env: "sala" },
  { id: "nicho", re: /nicho/, env: "sala" },
  { id: "prateleira", re: /prateleir/, env: "sala" },
  { id: "bancada", re: /bancada|tampo/, env: "cozinha" },
  { id: "ilha", re: /ilha/, env: "cozinha" },
  { id: "armario", re: /armari/, env: "cozinha" },
];

const ENV_WORDS: Array<{ env: string; re: RegExp }> = [
  { env: "cozinha", re: /cozinha/ },
  { env: "closet", re: /closet/ },
  { env: "dormitorio", re: /dormitori|quarto|suite/ },
  { env: "sala", re: /sala|living|estar|home theater/ },
  { env: "escritorio", re: /escritori|home office/ },
  { env: "banheiro", re: /banheir|lavabo/ },
];

const STYLE_WORDS: Array<{ style: string; re: RegExp }> = [
  { style: "minimalista", re: /minimalista|minimal|clean/ },
  { style: "classico", re: /classic|provencal/ },
  { style: "industrial", re: /industrial|loft/ },
  { style: "luxo", re: /luxo|luxuos|premium|sofisticad/ },
  { style: "moderno", re: /moderno|moderna|contemporane/ },
];

const COLOR_WORDS: Array<{ color: string; re: RegExp }> = [
  { color: "Louro Freijó", re: /louro\s*freijo/ },
  { color: "Freijó", re: /freijo/ },
  { color: "Nogueira", re: /nogueira/ },
  { color: "Carvalho", re: /carvalho/ },
  { color: "Cumaru", re: /cumaru/ },
  { color: "Imbuia", re: /imbuia/ },
  { color: "Off White", re: /off\s*-?\s*white/ },
  { color: "Branco Fosco", re: /branco\s*fosco/ },
  { color: "Branco TX", re: /branco|branca/ },
  { color: "Preto Fosco", re: /preto\s*fosco|preta\s*fosca/ },
  { color: "Preto Absoluto", re: /preto|preta/ },
  { color: "Grafite", re: /grafite|chumbo/ },
  { color: "Cinza Cristal", re: /cinza/ },
  { color: "Fendi", re: /fendi/ },
];

const MATERIAL_WORDS: Array<{ material: string; re: RegExp }> = [
  { material: "MDP 18mm", re: /\bmdp\b/ },
  { material: "Compensado 18mm", re: /compensad/ },
  { material: "MDF 15mm", re: /mdf\s*15/ },
  { material: "MDF 18mm", re: /\bmdf\b/ },
  { material: "Madeira maciça", re: /madeira\s*macic/ },
  { material: "Quartzo", re: /quartzo/ },
];

const HANDLE_WORDS: Array<{ handle: string; re: RegExp }> = [
  { handle: "perfil-gola", re: /perfil\s*gola|\bgola\b|perfil\s*linha/ },
  { handle: "cava", re: /\bcava\b|usinad[oa]/ },
  { handle: "tubular", re: /tubular|barra|alca|alça/ },
  { handle: "botao", re: /botao|puxador\s*redondo/ },
  { handle: "none", re: /push|toque|sem\s*puxador|toque\s*magnetico/ },
];

const OPENING_WORDS: Array<{ opening: OpeningId; re: RegExp }> = [
  { opening: "correr", re: /de\s*correr|correr|deslizante/ },
  { opening: "sanfonada", re: /sanfonad|dobravel|dobrável/ },
  { opening: "basculante", re: /basculante|abertura\s*(?:pra|para)\s*cima|aventos/ },
  { opening: "sem-porta", re: /sem\s*porta|aberto|nicho\s*aberto/ },
  { opening: "abrir", re: /de\s*abrir|abrir|batente|conven?cional/ },
];

const ACCESSORY_WORDS: Array<{ label: string; re: RegExp }> = [
  { label: "Fita LED", re: /\bled\b|fita\s*led|ilumina[cç]/ },
  { label: "Sapateira", re: /sapateir/ },
  { label: "Porta-gravatas", re: /gravata/ },
  { label: "Porta-bijoux", re: /bijou/ },
  { label: "Cesto aramado", re: /cesto|aramad/ },
  { label: "Porta-calças", re: /porta[-\s]?calc/ },
  { label: "Divisor de gavetas", re: /divisor/ },
  { label: "Espelho", re: /espelho/ },
];

// ───────────────────────── medidas ─────────────────────────

function toMm(value: number, unit?: string): number {
  if (unit === "mm") return Math.round(value);
  if (unit === "cm") return Math.round(value * 10);
  if (unit === "m") return Math.round(value * 1000);
  if (value < 10) return Math.round(value * 1000); // 2,70 → 2700
  if (value < 100) return Math.round(value * 10); // 60 → 600
  return Math.round(value);
}

function dimByLabel(t: string, labels: readonly string[]): number | null {
  const label = labels.join("|");
  const before = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?\\s*(?:de\\s*)?(?:${label})`);
  const after = new RegExp(`(?:${label})\\s*(?:de\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?`);
  const m = t.match(before) ?? t.match(after);
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return null;
  const mm = toMm(value, m[2]);
  return mm >= 40 && mm <= 6000 ? mm : null;
}

const WORD_NUMBERS: Record<string, number> = {
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
};

/** Conta ocorrências do tipo "3 portas", "duas gavetas", "quatro nichos". */
export function countOf(t: string, kind: string): number | null {
  const digit = t.match(new RegExp(`(\\d+)\\s*${kind}`));
  if (digit) {
    const n = Number(digit[1]);
    if (n >= 0 && n <= 20) return n;
  }
  const word = t.match(new RegExp(`(${Object.keys(WORD_NUMBERS).join("|")})\\s*${kind}`));
  if (word) return WORD_NUMBERS[word[1]] ?? null;
  return null;
}

// ───────────────────────── defaults por tipo ─────────────────────────

interface TypeDefaults {
  width: number;
  height: number;
  depth: number;
  doors: number;
  drawers: number;
  shelves: number;
  opening: OpeningId;
  maleiro: boolean;
  cabideiros: number;
}

const DEFAULTS: Record<FurnitureTypeId, TypeDefaults> = {
  roupeiro:    { width: 2400, height: 2400, depth: 600, doors: 4, drawers: 3, shelves: 6, opening: "abrir", maleiro: false, cabideiros: 2 },
  closet:      { width: 2400, height: 2400, depth: 550, doors: 0, drawers: 4, shelves: 8, opening: "sem-porta", maleiro: false, cabideiros: 3 },
  armario:     { width: 800,  height: 700,  depth: 350, doors: 2, drawers: 0, shelves: 2, opening: "abrir", maleiro: false, cabideiros: 0 },
  aereo:       { width: 800,  height: 700,  depth: 350, doors: 2, drawers: 0, shelves: 2, opening: "abrir", maleiro: false, cabideiros: 0 },
  balcao:      { width: 800,  height: 870,  depth: 600, doors: 2, drawers: 0, shelves: 1, opening: "abrir", maleiro: false, cabideiros: 0 },
  gaveteiro:   { width: 600,  height: 870,  depth: 600, doors: 0, drawers: 4, shelves: 0, opening: "sem-porta", maleiro: false, cabideiros: 0 },
  torre:       { width: 600,  height: 2200, depth: 600, doors: 2, drawers: 1, shelves: 2, opening: "abrir", maleiro: false, cabideiros: 0 },
  cristaleira: { width: 900,  height: 1400, depth: 400, doors: 2, drawers: 0, shelves: 3, opening: "abrir", maleiro: false, cabideiros: 0 },
  painel:      { width: 2000, height: 1200, depth: 60,  doors: 0, drawers: 0, shelves: 0, opening: "sem-porta", maleiro: false, cabideiros: 0 },
  nicho:       { width: 600,  height: 400,  depth: 300, doors: 0, drawers: 0, shelves: 1, opening: "sem-porta", maleiro: false, cabideiros: 0 },
  prateleira:  { width: 1000, height: 40,   depth: 300, doors: 0, drawers: 0, shelves: 1, opening: "sem-porta", maleiro: false, cabideiros: 0 },
  bancada:     { width: 2000, height: 40,   depth: 600, doors: 0, drawers: 0, shelves: 0, opening: "sem-porta", maleiro: false, cabideiros: 0 },
  ilha:        { width: 1800, height: 900,  depth: 900, doors: 2, drawers: 3, shelves: 1, opening: "abrir", maleiro: false, cabideiros: 0 },
};

const TYPE_LABEL: Record<FurnitureTypeId, string> = {
  roupeiro: "roupeiro",
  closet: "closet",
  armario: "armário",
  aereo: "aéreo",
  balcao: "balcão",
  gaveteiro: "gaveteiro",
  torre: "torre",
  cristaleira: "cristaleira",
  painel: "painel",
  nicho: "nicho",
  prateleira: "prateleira",
  bancada: "bancada",
  ilha: "ilha",
};

export function furnitureLabel(type: FurnitureTypeId): string {
  return TYPE_LABEL[type];
}

// ───────────────────────── construção da ficha ─────────────────────────

export function buildFurnitureSpec(input: string, hint?: { environment?: string }): FurnitureSpec {
  const t = norm(input);
  const explicit = new Set<keyof FurnitureSpec>();
  const assumptions: string[] = [];
  const missing: string[] = [];

  // 1) tipo
  let type: FurnitureTypeId | null = null;
  let bestLen = 0;
  for (const cand of TYPE_WORDS) {
    const m = t.match(cand.re);
    if (m && m[0].length > bestLen) {
      type = cand.id;
      bestLen = m[0].length;
    }
  }
  if (type) explicit.add("type");
  else missing.push("tipo de móvel");

  const base = type ? DEFAULTS[type] : DEFAULTS.armario;

  // 2) ambiente
  const envMatch = ENV_WORDS.find((e) => e.re.test(t));
  let environment = hint?.environment ?? envMatch?.env ?? "";
  if (envMatch || hint?.environment) explicit.add("environment");
  if (!environment) {
    environment = type ? (TYPE_WORDS.find((x) => x.id === type)?.env ?? "cozinha") : "cozinha";
    assumptions.push(`ambiente ${environment}`);
  }

  // 3) medidas
  const seq = t.match(
    /(\d+(?:[.,]\d+)?)\s*(?:mm|cm|m)?\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\s*(?:mm|cm|m)?(?:\s*(?:x|×)\s*(\d+(?:[.,]\d+)?))?\s*(mm|cm|m)?/,
  );
  let width = dimByLabel(t, ["largura", "larg", "comprimento"]);
  let height = dimByLabel(t, ["altura", "alto", "ate o teto"]);
  let depth = dimByLabel(t, ["profundidade", "prof", "fundo"]);
  if (seq && width == null && height == null) {
    const unit = seq[4];
    width = toMm(Number(seq[1].replace(",", ".")), unit);
    height = toMm(Number(seq[2].replace(",", ".")), unit);
    if (seq[3]) depth = toMm(Number(seq[3].replace(",", ".")), unit);
  }
  if (width != null) explicit.add("width");
  else assumptions.push(`largura ${base.width} mm`);
  if (height != null) explicit.add("height");
  else assumptions.push(`altura ${base.height} mm`);
  if (depth != null) explicit.add("depth");
  else assumptions.push(`profundidade ${base.depth} mm`);

  // 4) portas / abertura
  let doors = countOf(t, "porta");
  if (/porta\s*dupla/.test(t)) doors = doors ?? 2;
  if (/porta\s*(simples|unica)/.test(t)) doors = doors ?? 1;
  if (doors != null) explicit.add("doors");

  const openingMatch = OPENING_WORDS.find((o) => o.re.test(t));
  let opening: OpeningId = openingMatch?.opening ?? base.opening;
  if (openingMatch) explicit.add("opening");
  if ((doors ?? base.doors) === 0) opening = "sem-porta";

  // 5) gavetas / divisões / prateleiras
  const drawers = countOf(t, "gaveta");
  if (drawers != null) explicit.add("drawers");
  const shelves = countOf(t, "prateleir");
  if (shelves != null) explicit.add("shelves");
  const divisions = countOf(t, "(?:divis|modul)");
  if (divisions != null) explicit.add("divisions");

  // 6) maleiro / cabideiros / nichos / espelho
  const maleiroMentioned = /maleir/.test(t);
  const maleiro = maleiroMentioned ? !/sem\s*maleir/.test(t) : base.maleiro;
  if (maleiroMentioned) explicit.add("maleiro");

  const cabideiros = /cabideir|\bcabide\b/.test(t)
    ? (countOf(t, "cabideir") ?? 1)
    : base.cabideiros;
  if (/cabideir/.test(t)) explicit.add("cabideiros");

  const nichos = /nicho/.test(t) && type !== "nicho" ? (countOf(t, "nicho") ?? 1) : 0;
  if (nichos > 0) explicit.add("nichos");

  let mirror: FurnitureSpec["mirror"] = null;
  if (/espelho|espelhad/.test(t)) {
    const position: MirrorPosition = /central|do\s*meio|central\b/.test(t)
      ? "central"
      : /todas\s*as\s*portas|todas/.test(t)
        ? "todas"
        : /interna|por\s*dentro/.test(t)
          ? "interna"
          : "lateral";
    mirror = { has: true, position };
    explicit.add("mirror");
  }

  // 7) material / cor / puxador / estilo
  const materialMatch = MATERIAL_WORDS.find((m) => m.re.test(t));
  const colorMatch = COLOR_WORDS.find((c) => c.re.test(t));
  const handleMatch = HANDLE_WORDS.find((h) => h.re.test(t));
  const styleMatch = STYLE_WORDS.find((s) => s.re.test(t));

  const material = materialMatch?.material ?? "MDF 18mm";
  if (materialMatch) explicit.add("material");
  else assumptions.push("chapa MDF 18 mm");

  const color = colorMatch?.color ?? "Louro Freijó";
  if (colorMatch) explicit.add("color");
  else assumptions.push("acabamento Louro Freijó");

  const style = styleMatch?.style ?? "moderno";
  if (styleMatch) explicit.add("style");
  else assumptions.push("estilo moderno");

  const handle = handleMatch?.handle ?? (style === "classico" ? "botao" : "perfil-gola");
  if (handleMatch) explicit.add("handle");
  else assumptions.push(handle === "botao" ? "puxador botão" : "puxador perfil gola");

  // 8) acessórios
  const accessories = ACCESSORY_WORDS.filter((a) => a.re.test(t)).map((a) => a.label);
  if (accessories.length > 0) explicit.add("accessories");

  // 9) posição
  let position: FurnitureSpec["position"] = "bottom";
  if (/parede\s*(?:da\s*)?esquerda|lado\s*esquerdo|a\s*esquerda/.test(t)) position = "left";
  else if (/parede\s*(?:da\s*)?direita|lado\s*direito|a\s*direita/.test(t)) position = "right";
  else if (/parede\s*(?:do\s*)?fundo|ao\s*fundo|no\s*fundo/.test(t)) position = "top";
  else if (/no\s*centro|centraliz/.test(t)) position = "centro";
  if (position !== "bottom") explicit.add("position");

  return {
    type,
    environment,
    width: width ?? base.width,
    height: height ?? base.height,
    depth: depth ?? base.depth,
    doors: doors ?? base.doors,
    opening,
    drawers: drawers ?? base.drawers,
    divisions: divisions ?? 0,
    shelves: shelves ?? base.shelves,
    maleiro,
    cabideiros,
    nichos,
    mirror,
    material,
    color,
    handle,
    style,
    accessories,
    position,
    assumptions,
    missing,
    explicit,
  };
}

// ───────────────────────── saída para o Engine ─────────────────────────

const OPENING_LABEL: Record<OpeningId, string> = {
  abrir: "portas de abrir",
  correr: "portas de correr",
  sanfonada: "portas sanfonadas",
  basculante: "portas basculantes",
  "sem-porta": "sem porta",
};

/**
 * Descrição canônica consumida pelo matcher paramétrico (escolha da família
 * e da variante no catálogo). Determinística — mesma ficha, mesma string.
 */
export function specToDescription(spec: FurnitureSpec): string {
  const bits: string[] = [];
  if (spec.type) bits.push(TYPE_LABEL[spec.type]);
  if (spec.doors > 0) bits.push(`${spec.doors} portas`);
  if (spec.opening === "correr") bits.push("de correr");
  if (spec.drawers > 0) bits.push(`${spec.drawers} gavetas`);
  if (spec.mirror?.has) bits.push("espelho");
  if (spec.cabideiros > 0) bits.push("cabideiro");
  if (spec.accessories.includes("Sapateira")) bits.push("sapateira");
  bits.push(`${spec.width}mm largura`);
  bits.push(`${spec.height}mm altura`);
  bits.push(`${spec.depth}mm profundidade`);
  bits.push(spec.color);
  return bits.join(" ");
}

/** Params do módulo (lidos pelo motor de extrusão / CabinetMesh). */
export function specToParams(spec: FurnitureSpec): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    "mod:doors": spec.doors,
    "mod:drawers": spec.drawers,
    "mod:shelves": spec.shelves,
    "mod:opening": spec.opening,
    "mod:handle": spec.handle,
    "mod:style": spec.style,
    style: spec.style,
    color: spec.color,
    material: spec.material,
  };
  if (spec.divisions > 0) params["mod:divisions"] = spec.divisions;
  if (spec.maleiro) params["mod:maleiro"] = true;
  if (spec.cabideiros > 0) params["mod:cabideiros"] = spec.cabideiros;
  if (spec.nichos > 0) params["mod:nichos"] = spec.nichos;
  if (spec.mirror?.has) {
    params["mod:mirror"] = true;
    params["mod:mirrorPosition"] = spec.mirror.position;
  }
  if (spec.opening === "sem-porta") params["eng:front"] = "aberto";
  if (spec.accessories.length > 0) params["mod:accessories"] = spec.accessories.join(", ");
  return params;
}

/** Resumo humano da ficha (auditoria / debug). */
export function describeSpec(spec: FurnitureSpec): string {
  if (!spec.type) return "ficha incompleta (tipo ausente)";
  const parts = [
    TYPE_LABEL[spec.type],
    `${spec.width}×${spec.height}×${spec.depth} mm`,
    `${spec.doors} ${OPENING_LABEL[spec.opening]}`,
    `${spec.drawers} gaveta(s)`,
  ];
  if (spec.maleiro) parts.push("maleiro");
  if (spec.cabideiros > 0) parts.push(`${spec.cabideiros} cabideiro(s)`);
  if (spec.nichos > 0) parts.push(`${spec.nichos} nicho(s)`);
  if (spec.mirror?.has) parts.push(`espelho (${spec.mirror.position})`);
  parts.push(spec.color, spec.material, spec.style);
  return parts.join(" · ");
}

/** Frase curta com as suposições, para a IA informar no chat. */
export function assumptionsSentence(spec: FurnitureSpec): string | null {
  if (spec.assumptions.length === 0) return null;
  return `Assumi ${spec.assumptions.join(", ")}.`;
}
