/**
 * FAMÍLIA BANHEIRO — ficha técnica (BathroomModuleSpec).
 *
 * Nada é desenhado aqui: a ficha só descreve o módulo. Geometria, folgas,
 * ferragens e rigs vêm da Biblioteca Construtiva, exatamente como no
 * roupeiro, no gaveteiro e na cozinha.
 *
 * Unidade canônica: milímetro.
 */
import { handleType, type ComponentHandle } from "../handles";
import {
  COUNTERTOPS,
  normalizeCountertop,
  type KitchenCountertop,
} from "../kitchen/countertop";
import { normalizePlinth, type KitchenPlinth } from "../kitchen/plinth";
import { normalizeSink, type BathroomSink } from "./sink";

/** Módulos atendidos pela família. */
export type BathroomModuleKind =
  | "gabinete-2-portas"
  | "gabinete-1-porta"
  | "gabinete-gavetas"
  | "gabinete-gavetao"
  | "gabinete-misto"
  | "gabinete-suspenso"
  | "gabinete-piso"
  | "torre-lateral"
  | "nicho-aberto"
  | "espelheira"
  | "armario-superior"
  | "prateleira"
  | "cuba-central"
  | "cuba-deslocada"
  | "cuba-dupla"
  | "tapa-vao"
  | "painel-acabamento"
  | "rodabanca";

export const BATHROOM_MODULE_KINDS: readonly BathroomModuleKind[] = [
  "gabinete-2-portas",
  "gabinete-1-porta",
  "gabinete-gavetas",
  "gabinete-gavetao",
  "gabinete-misto",
  "gabinete-suspenso",
  "gabinete-piso",
  "torre-lateral",
  "nicho-aberto",
  "espelheira",
  "armario-superior",
  "prateleira",
  "cuba-central",
  "cuba-deslocada",
  "cuba-dupla",
  "tapa-vao",
  "painel-acabamento",
  "rodabanca",
];

/** Faixa vertical que o módulo ocupa. */
export type BathroomLevel = "bancada" | "superior" | "coluna" | "acabamento";

export type BathroomOpening = "abrir" | "correr" | "gaveta" | "misto" | "aberto";

/** Tipo de instalação — recomendação técnica configurável, não norma. */
export type BathroomInstall = "suspenso" | "piso" | "pes" | "rodape";

/** Tratamento do espelho. Só a porta espelhada recebe rig. */
export type MirrorKind = "nenhum" | "fixo" | "porta" | "painel" | "fundo";

export interface BathroomModuleProfile {
  readonly level: BathroomLevel;
  readonly opening: BathroomOpening;
  readonly install: BathroomInstall;
  readonly defaultWidthMm: number;
  readonly defaultHeightMm: number;
  readonly defaultDepthMm: number;
  readonly minWidthMm: number;
  readonly maxWidthMm: number;
  readonly minDepthMm: number;
  readonly maxDepthMm: number;
  readonly doors: number;
  readonly drawers: number;
  readonly shelves: number;
  readonly countertop: boolean;
  readonly sink: boolean;
  readonly mirror: MirrorKind;
  readonly label: string;
}

const G = {
  level: "bancada",
  opening: "abrir",
  install: "suspenso",
  defaultHeightMm: 600,
  defaultDepthMm: 460,
  minWidthMm: 300,
  maxWidthMm: 2400,
  minDepthMm: 250,
  maxDepthMm: 700,
  countertop: true,
  sink: true,
  mirror: "nenhum",
} as const;

/** Perfil construtivo padrão de cada módulo — fonte única de verdade. */
export const BATHROOM_MODULE_PROFILES: Readonly<Record<BathroomModuleKind, BathroomModuleProfile>> = {
  "gabinete-2-portas": { ...G, defaultWidthMm: 900, doors: 2, drawers: 0, shelves: 1, label: "Gabinete 2 portas" },
  "gabinete-1-porta": { ...G, defaultWidthMm: 600, doors: 1, drawers: 0, shelves: 1, label: "Gabinete 1 porta" },
  "gabinete-gavetas": { ...G, opening: "gaveta", defaultWidthMm: 800, doors: 0, drawers: 3, shelves: 0, label: "Gabinete com gavetas" },
  "gabinete-gavetao": { ...G, opening: "gaveta", defaultWidthMm: 800, doors: 0, drawers: 1, shelves: 0, label: "Gabinete com gavetão" },
  "gabinete-misto": { ...G, opening: "misto", defaultWidthMm: 1200, doors: 1, drawers: 2, shelves: 1, label: "Gabinete misto" },
  "gabinete-suspenso": { ...G, install: "suspenso", defaultWidthMm: 900, doors: 2, drawers: 0, shelves: 1, label: "Gabinete suspenso" },
  "gabinete-piso": { ...G, install: "rodape", defaultWidthMm: 900, doors: 2, drawers: 0, shelves: 1, label: "Gabinete apoiado no piso" },
  "torre-lateral": { ...G, level: "coluna", install: "piso", defaultWidthMm: 400, defaultHeightMm: 1800, defaultDepthMm: 350, doors: 1, drawers: 1, shelves: 3, countertop: false, sink: false, label: "Torre lateral" },
  "nicho-aberto": { ...G, opening: "aberto", defaultWidthMm: 400, defaultHeightMm: 600, defaultDepthMm: 250, doors: 0, drawers: 0, shelves: 2, countertop: false, sink: false, label: "Nicho aberto" },
  espelheira: { ...G, level: "superior", defaultWidthMm: 900, defaultHeightMm: 700, defaultDepthMm: 150, doors: 2, drawers: 0, shelves: 2, countertop: false, sink: false, mirror: "porta", label: "Armário espelheira" },
  "armario-superior": { ...G, level: "superior", defaultWidthMm: 700, defaultHeightMm: 650, defaultDepthMm: 200, doors: 2, drawers: 0, shelves: 1, countertop: false, sink: false, label: "Armário superior" },
  prateleira: { ...G, level: "superior", opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 40, defaultDepthMm: 200, doors: 0, drawers: 0, shelves: 1, countertop: false, sink: false, label: "Prateleira decorativa" },
  "cuba-central": { ...G, defaultWidthMm: 900, doors: 2, drawers: 0, shelves: 0, label: "Módulo cuba central" },
  "cuba-deslocada": { ...G, opening: "misto", defaultWidthMm: 1200, doors: 1, drawers: 2, shelves: 0, label: "Módulo cuba deslocada" },
  "cuba-dupla": { ...G, defaultWidthMm: 1600, doors: 2, drawers: 2, shelves: 0, label: "Módulo cuba dupla" },
  "tapa-vao": { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 60, defaultHeightMm: 600, defaultDepthMm: 460, minWidthMm: 10, maxWidthMm: 400, doors: 0, drawers: 0, shelves: 0, countertop: false, sink: false, label: "Tapa-vão lateral" },
  "painel-acabamento": { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 460, defaultHeightMm: 600, defaultDepthMm: 18, minWidthMm: 50, maxWidthMm: 2400, doors: 0, drawers: 0, shelves: 0, countertop: false, sink: false, label: "Painel de acabamento" },
  rodabanca: { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 900, defaultHeightMm: 100, defaultDepthMm: 20, minWidthMm: 100, maxWidthMm: 3000, doors: 0, drawers: 0, shelves: 0, countertop: false, sink: false, label: "Rodabanca" },
};

/** Tampo do banheiro: reaproveita o tampo da cozinha e acrescenta saia/frontão. */
export interface BathroomCountertop extends KitchenCountertop {
  /** Saia (testeira) sob o tampo, em mm. */
  readonly apronMm: number;
  /** Frontão frontal elevado, em mm. */
  readonly frontonMm: number;
  /** Recorte de torneira no tampo. */
  readonly faucetCutout: boolean;
}

export interface BathroomModuleSpec {
  readonly kind: BathroomModuleKind;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly doors: number;
  readonly drawers: number;
  readonly shelves: number;
  readonly opening: BathroomOpening;
  readonly handle: string;
  readonly install: BathroomInstall;
  /** Altura do fundo do módulo em relação ao piso (suspenso/pés). */
  readonly floorGapMm: number;
  /** Altura do pé quando `install = "pes"`. */
  readonly feetHeightMm: number;
  /** Recuo do módulo em relação à frente da bancada. */
  readonly recessMm: number;
  readonly plinth: KitchenPlinth;
  readonly countertop: BathroomCountertop;
  readonly sink: BathroomSink;
  readonly mirror: MirrorKind;
  readonly led: boolean;
  readonly style: string;
  readonly finishId: string;
  readonly thicknessMm: number;
  readonly backThicknessMm: number;
  /** Fundo fechado (false = fundo aberto na área hidráulica). */
  readonly closedBack: boolean;
  /** Permitir gaveta em U sob a cuba. */
  readonly allowUDrawer: boolean;
}

export type BathroomModuleInput = Partial<
  Omit<BathroomModuleSpec, "countertop" | "plinth" | "sink">
> & {
  readonly countertop?: Partial<BathroomCountertop>;
  readonly plinth?: Partial<KitchenPlinth>;
  readonly sink?: Partial<BathroomSink>;
};

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function int(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function defined<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Normaliza o `kind` vindo de texto livre (IA, catálogo, projeto antigo). */
export function normalizeBathroomKind(value: string | undefined | null): BathroomModuleKind {
  const k = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
  if (BATHROOM_MODULE_KINDS.includes(k as BathroomModuleKind)) return k as BathroomModuleKind;
  if (/rodabanca|frontao/.test(k)) return "rodabanca";
  if (/tapa-?vao|filler/.test(k)) return "tapa-vao";
  if (/painel|acabamento/.test(k)) return "painel-acabamento";
  if (/prateleira|shelf/.test(k)) return "prateleira";
  if (/espelheira|espelho/.test(k)) return "espelheira";
  if (/superior|aereo/.test(k)) return "armario-superior";
  if (/torre|coluna/.test(k)) return "torre-lateral";
  if (/nicho/.test(k)) return "nicho-aberto";
  if (/dupla|duas-cubas/.test(k)) return "cuba-dupla";
  if (/deslocad|lateral-cuba/.test(k)) return "cuba-deslocada";
  if (/cuba|vanity/.test(k)) return "cuba-central";
  if (/misto/.test(k)) return "gabinete-misto";
  if (/gavetao/.test(k)) return "gabinete-gavetao";
  if (/gaveta/.test(k)) return "gabinete-gavetas";
  if (/suspens|flutuant/.test(k)) return "gabinete-suspenso";
  if (/piso|apoiad|rodape|pes/.test(k)) return "gabinete-piso";
  if (/1-porta|uma-porta/.test(k)) return "gabinete-1-porta";
  return "gabinete-2-portas";
}

export function normalizeInstall(value: unknown, fallback: BathroomInstall): BathroomInstall {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/suspens|flutuant|parede/.test(k)) return "suspenso";
  if (/\bpes?\b|pe-regulavel|pezinho/.test(k)) return "pes";
  if (/rodape/.test(k)) return "rodape";
  if (/piso|apoiad|chao/.test(k)) return "piso";
  return fallback;
}

export function normalizeMirror(value: unknown, fallback: MirrorKind): MirrorKind {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/porta/.test(k)) return "porta";
  if (/painel/.test(k)) return "painel";
  if (/fundo/.test(k)) return "fundo";
  if (/fixo|simples|espelho/.test(k)) return "fixo";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return fallback;
}

function normalizeBathroomTop(
  input: Partial<BathroomCountertop> | undefined,
  enabled: boolean,
  sinkCutout: boolean,
): BathroomCountertop {
  const base = normalizeCountertop(
    { cutout: sinkCutout ? "cuba" : "nenhum", ...defined(input) },
    enabled,
  );
  const off = base.material === "nenhum";
  return {
    ...base,
    apronMm: off ? 0 : int(input?.apronMm, 0, 0, 300),
    frontonMm: off ? 0 : int(input?.frontonMm, 0, 0, 200),
    faucetCutout: input?.faucetCutout ?? (!off && sinkCutout),
  };
}

/** Preenche a ficha a partir do perfil do módulo. Nunca lança. */
export function normalizeBathroomModule(input: BathroomModuleInput = {}): BathroomModuleSpec {
  const kind = normalizeBathroomKind(input.kind);
  const p = BATHROOM_MODULE_PROFILES[kind];

  const widthMm = num(input.widthMm, p.defaultWidthMm, p.minWidthMm, p.maxWidthMm);
  const heightMm = num(input.heightMm, p.defaultHeightMm, 40, 2400);
  const depthMm = num(input.depthMm, p.defaultDepthMm, p.minDepthMm, p.maxDepthMm);

  const opening = (input.opening ?? p.opening) as BathroomOpening;
  const install = normalizeInstall(input.install, p.install);
  const wantsSink = p.sink && (input.sink?.type ?? "apoio") !== "nenhuma";
  const sink = normalizeSink(
    {
      position: kind === "cuba-deslocada" ? "esquerda" : kind === "cuba-dupla" ? "dupla" : "central",
      type: kind === "cuba-dupla" ? "dupla" : undefined,
      ...defined(input.sink),
    },
    wantsSink,
  );

  const doors = int(input.doors, p.doors, 0, 6);
  const drawers = int(input.drawers, p.drawers, 0, 8);

  return {
    kind,
    widthMm,
    heightMm,
    depthMm,
    doors: opening === "gaveta" || opening === "aberto" ? 0 : doors,
    drawers: opening === "abrir" || opening === "aberto" ? 0 : drawers,
    shelves: int(input.shelves, p.shelves, 0, 8),
    opening,
    handle: input.handle ?? "perfil-gola",
    install,
    floorGapMm:
      install === "suspenso"
        ? int(input.floorGapMm, 300, 0, 1200)
        : install === "pes"
          ? int(input.feetHeightMm, 120, 40, 300)
          : 0,
    feetHeightMm: int(input.feetHeightMm, install === "pes" ? 120 : 0, 0, 300),
    recessMm: int(input.recessMm, 0, 0, 300),
    plinth: normalizePlinth(defined(input.plinth), install === "rodape"),
    countertop: normalizeBathroomTop(
      defined(input.countertop) as Partial<BathroomCountertop>,
      (input.countertop?.material ?? "") !== "nenhum" && p.countertop,
      sink.type !== "nenhuma" && sink.type !== "apoio",
    ),
    sink,
    mirror: normalizeMirror(input.mirror, p.mirror),
    led: input.led ?? false,
    style: input.style ?? "moderno",
    finishId: input.finishId ?? "branco-tx",
    thicknessMm: num(input.thicknessMm, 18, 9, 30),
    backThicknessMm: num(input.backThicknessMm, 6, 3, 18),
    closedBack: input.closedBack ?? true,
    allowUDrawer: input.allowUDrawer ?? true,
  };
}

export function bathroomHandle(spec: BathroomModuleSpec): ComponentHandle {
  return handleType(spec.handle);
}

export function bathroomLevel(kind: BathroomModuleKind): BathroomLevel {
  return BATHROOM_MODULE_PROFILES[kind].level;
}

export { COUNTERTOPS };