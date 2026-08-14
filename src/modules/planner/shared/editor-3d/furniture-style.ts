/**
 * Camada de ESPECIFICAÇÃO DE ESTILO da marcenaria (design spec).
 *
 * Antes desta camada, todo módulo era desenhado com a MESMA linguagem
 * (frente shaker + puxador tubular cromado), o que deixava cozinhas,
 * closets e painéis com aparência genérica e repetida.
 *
 * Aqui traduzimos (estilo do projeto + papel do módulo + dimensões) em uma
 * ficha técnica declarativa — do mesmo jeito que um marceneiro define a
 * "linha" do projeto antes de desenhar. O `CabinetMesh` só CONSOME a ficha.
 *
 * Performance: a ficha é um objeto puro, calculado com memo por módulo.
 * Frentes lisas geram 1 mesh no lugar de 5 (shaker), então o estilo padrão
 * moderno é mais leve que o comportamento anterior.
 */

export type CabinetStyleId =
  "moderno" | "contemporaneo" | "minimalista" | "industrial" | "classico" | "luxo";

/** Tratamento da frente (porta/gaveta). */
export type FrontStyle =
  | "liso" // painel único, junta-sombra — linha moderna/minimalista
  | "shaker" // moldura de 4 réguas protruída — linha clássica
  | "ripado" // réguas verticais — painéis, torres, linha contemporânea
  | "canelado"; // ripas finas e densas — linha luxo

/** Tipo de pega. */
export type HandleStyle =
  | "tubular" // barra cilíndrica + afastadores
  | "perfil-gola" // perfil de alumínio embutido no rasgo (gola)
  | "cava" // usinagem na frente, sem peça aparente
  | "botao" // puxador ponto (clássico)
  | "none"; // push-to-open

export type HardwareFinish = "inox" | "preto" | "latao" | "aluminio";

export interface CabinetStyleSpec {
  readonly style: CabinetStyleId;
  readonly front: FrontStyle;
  readonly handle: HandleStyle;
  readonly hardwareColor: string;
  readonly hardwareMetalness: number;
  readonly hardwareRoughness: number;
  /** Junta-sombra entre frentes (m). Linha moderna usa junta maior e uniforme. */
  readonly reveal: number;
  /** Espessura da frente (m). */
  readonly frontThickness: number;
  /** Altura do rodapé/sapata (m). 0 = módulo suspenso/aéreo. */
  readonly plinth: number;
  /** Rodapé recuado (pé-palito visual) — típico de projeto contemporâneo. */
  readonly plinthRecess: number;
  /** Cornija/arremate superior (m). 0 = sem cornija. */
  readonly cornice: number;
  /** Nº de ripas quando `front` é ripado/canelado. */
  readonly slats: number;
}

const HARDWARE: Record<HardwareFinish, { color: string; metalness: number; roughness: number }> = {
  inox: { color: "#d4d7dc", metalness: 0.95, roughness: 0.18 },
  preto: { color: "#2a2c30", metalness: 0.7, roughness: 0.38 },
  latao: { color: "#c9a227", metalness: 0.9, roughness: 0.26 },
  aluminio: { color: "#b9bec6", metalness: 0.85, roughness: 0.3 },
};

const STYLE_IDS: readonly CabinetStyleId[] = [
  "moderno",
  "contemporaneo",
  "minimalista",
  "industrial",
  "classico",
  "luxo",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function parseStyleId(input?: string | null): CabinetStyleId | undefined {
  if (!input) return undefined;
  const k = normalize(input);
  const direct = STYLE_IDS.find((s) => k === s || k.includes(s));
  if (direct) return direct;
  if (/(escandinav|clean|nordic)/.test(k)) return "minimalista";
  if (/(rustic|provencal|neoclass|classic)/.test(k)) return "classico";
  if (/(premium|sofistic|high end|alto padrao)/.test(k)) return "luxo";
  if (/(loft|urbano|concreto)/.test(k)) return "industrial";
  return undefined;
}

function parseHandle(input?: string | null): HandleStyle | undefined {
  if (!input) return undefined;
  const k = normalize(input);
  if (/(gola|perfil|j\b|puxador perfil)/.test(k)) return "perfil-gola";
  if (/(cava|usinad|embutid|integrad)/.test(k)) return "cava";
  if (/(sem puxador|push|toque|none)/.test(k)) return "none";
  if (/(botao|ponto|concha)/.test(k)) return "botao";
  if (/(tubular|barra|alca|bastao)/.test(k)) return "tubular";
  return undefined;
}

function parseFinish(input?: string | null): HardwareFinish | undefined {
  if (!input) return undefined;
  const k = normalize(input);
  if (/(preto|black|fosco escuro|grafite)/.test(k)) return "preto";
  if (/(latao|dourad|gold|brass)/.test(k)) return "latao";
  if (/(aluminio|escovad|prata)/.test(k)) return "aluminio";
  if (/(inox|cromad|niquel)/.test(k)) return "inox";
  return undefined;
}

/** Papel do módulo — dirige rodapé, cornija e densidade de ripas. */
type Role = "base" | "upper" | "tall" | "panel" | "open" | "top";

function roleOf(subtype: string): Role {
  const s = normalize(subtype);
  if (/(aereo|nicho)/.test(s)) return "upper";
  if (/(prateleira)/.test(s)) return "open";
  if (/(tampo|bancada|ilha)/.test(s)) return "top";
  if (/(painel|cristaleira)/.test(s)) return "panel";
  if (/(torre|closet|roupeiro|guarda-roupa|armario)/.test(s)) return "tall";
  return "base";
}

/** Linha base de cada estilo (a "identidade" da marcenaria). */
const STYLE_BASE: Record<
  CabinetStyleId,
  Pick<CabinetStyleSpec, "front" | "handle" | "reveal" | "frontThickness"> & {
    finish: HardwareFinish;
  }
> = {
  moderno: {
    front: "liso",
    handle: "perfil-gola",
    reveal: 0.004,
    frontThickness: 0.018,
    finish: "aluminio",
  },
  contemporaneo: {
    front: "liso",
    handle: "cava",
    reveal: 0.005,
    frontThickness: 0.018,
    finish: "preto",
  },
  minimalista: {
    front: "liso",
    handle: "none",
    reveal: 0.006,
    frontThickness: 0.018,
    finish: "aluminio",
  },
  industrial: {
    front: "liso",
    handle: "tubular",
    reveal: 0.005,
    frontThickness: 0.018,
    finish: "preto",
  },
  classico: {
    front: "shaker",
    handle: "botao",
    reveal: 0.003,
    frontThickness: 0.02,
    finish: "latao",
  },
  luxo: {
    front: "canelado",
    handle: "perfil-gola",
    reveal: 0.004,
    frontThickness: 0.02,
    finish: "latao",
  },
};

export interface ResolveStyleInput {
  readonly subtype: string;
  readonly width: number;
  readonly height: number;
  /** Estilo do projeto (params `style` / memória da IA). */
  readonly style?: string | null;
  /** Override explícito de puxador (params `mod:handle`). */
  readonly handle?: string | null;
  /** Override explícito de acabamento metálico (params `mod:hardware`). */
  readonly hardware?: string | null;
  /** Override explícito de frente (params `mod:front`). */
  readonly front?: string | null;
}

function parseFront(input?: string | null): FrontStyle | undefined {
  if (!input) return undefined;
  const k = normalize(input);
  if (/(shaker|moldura|almofad)/.test(k)) return "shaker";
  if (/(ripad|frisad)/.test(k)) return "ripado";
  if (/(canelad|reeded|fluted)/.test(k)) return "canelado";
  if (/(liso|plano|flat)/.test(k)) return "liso";
  return undefined;
}

/**
 * Resolve a ficha técnica final combinando estilo do projeto,
 * papel do módulo, proporções e overrides explícitos.
 */
export function resolveCabinetStyle(input: ResolveStyleInput): CabinetStyleSpec {
  const style = parseStyleId(input.style) ?? "moderno";
  const base = STYLE_BASE[style];
  const role = roleOf(input.subtype);

  let front = parseFront(input.front) ?? base.front;
  let handle = parseHandle(input.handle) ?? base.handle;

  // Papel do módulo ajusta a linguagem — como um projetista faria:
  // painéis/torres ganham ripado (verticalidade), tampos e prateleiras
  // não têm frente nem puxador.
  if (role === "panel") front = front === "shaker" ? "shaker" : "ripado";
  if (role === "top" || role === "open") {
    front = "liso";
    handle = "none";
  }
  // Aéreo com gola invertida não existe: gola em aéreo vira cava (pega inferior).
  if (role === "upper" && handle === "perfil-gola") handle = "cava";
  // Frente muito estreita não comporta moldura shaker legível.
  if (front === "shaker" && Math.min(input.width, input.height) < 0.24) front = "liso";

  const hw = HARDWARE[parseFinish(input.hardware) ?? base.finish];

  const plinth =
    role === "upper" || role === "open" || role === "top"
      ? 0
      : style === "classico"
        ? 0.12
        : role === "tall"
          ? 0.08
          : 0.1;

  const cornice = style === "classico" ? 0.05 : role === "upper" || role === "tall" ? 0.02 : 0;

  // Ripas: densidade proporcional à largura real (~55mm ripado, ~22mm canelado).
  const pitch = front === "canelado" ? 0.022 : 0.055;
  const slats = Math.max(3, Math.min(48, Math.round(input.width / pitch)));

  return {
    style,
    front,
    handle,
    hardwareColor: hw.color,
    hardwareMetalness: hw.metalness,
    hardwareRoughness: hw.roughness,
    reveal: base.reveal,
    frontThickness: base.frontThickness,
    plinth,
    plinthRecess: style === "classico" ? 0.02 : 0.05,
    cornice,
    slats,
  };
}
