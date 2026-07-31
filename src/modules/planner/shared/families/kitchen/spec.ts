/**
 * FAMÍLIA COZINHA — ficha técnica (KitchenSpec).
 *
 * Esta camada NÃO desenha nada e NÃO conhece three.js. Ela apenas descreve
 * o que o módulo é. Toda geometria vem da Biblioteca Construtiva
 * (`../../construction`), exatamente como no roupeiro e no gaveteiro.
 *
 * Unidade canônica: milímetro.
 */
import { handleType, type ComponentHandle } from "../handles";
import { COUNTERTOPS, normalizeCountertop, type KitchenCountertop } from "./countertop";
import { normalizePlinth, type KitchenPlinth } from "./plinth";

/** Módulos atendidos pela família (todos montados por composição). */
export type KitchenModuleKind =
  | "balcao"
  | "balcao-pia"
  | "balcao-cooktop"
  | "gaveteiro"
  | "gavetao"
  | "aereo"
  | "aereo-basculante"
  | "aereo-vidro"
  | "torre-quente"
  | "torre-geladeira"
  | "canto-reto"
  | "canto-diagonal"
  | "canto-magico"
  | "cristaleira"
  | "adega"
  | "nicho-aberto";

export const KITCHEN_MODULE_KINDS: readonly KitchenModuleKind[] = [
  "balcao",
  "balcao-pia",
  "balcao-cooktop",
  "gaveteiro",
  "gavetao",
  "aereo",
  "aereo-basculante",
  "aereo-vidro",
  "torre-quente",
  "torre-geladeira",
  "canto-reto",
  "canto-diagonal",
  "canto-magico",
  "cristaleira",
  "adega",
  "nicho-aberto",
];

/** Faixa vertical que o módulo ocupa na cozinha. */
export type KitchenLevel = "inferior" | "superior" | "coluna";

export type KitchenOpening = "abrir" | "correr" | "basculante" | "gaveta" | "aberto";

export interface KitchenModuleProfile {
  readonly level: KitchenLevel;
  readonly opening: KitchenOpening;
  readonly defaultWidthMm: number;
  readonly defaultHeightMm: number;
  readonly defaultDepthMm: number;
  readonly doors: number;
  readonly drawers: number;
  readonly shelves: number;
  /** Recebe tampo por padrão. */
  readonly countertop: boolean;
  /** Recebe rodapé por padrão. */
  readonly plinth: boolean;
  readonly label: string;
}

/** Perfil construtivo padrão de cada módulo — fonte única de verdade. */
export const KITCHEN_MODULE_PROFILES: Readonly<Record<KitchenModuleKind, KitchenModuleProfile>> = {
  balcao: { level: "inferior", opening: "abrir", defaultWidthMm: 600, defaultHeightMm: 900, defaultDepthMm: 600, doors: 1, drawers: 0, shelves: 1, countertop: true, plinth: true, label: "Balcão" },
  "balcao-pia": { level: "inferior", opening: "abrir", defaultWidthMm: 1200, defaultHeightMm: 900, defaultDepthMm: 600, doors: 2, drawers: 0, shelves: 0, countertop: true, plinth: true, label: "Balcão de pia" },
  "balcao-cooktop": { level: "inferior", opening: "gaveta", defaultWidthMm: 800, defaultHeightMm: 900, defaultDepthMm: 600, doors: 0, drawers: 2, shelves: 0, countertop: true, plinth: true, label: "Balcão de cooktop" },
  gaveteiro: { level: "inferior", opening: "gaveta", defaultWidthMm: 500, defaultHeightMm: 900, defaultDepthMm: 600, doors: 0, drawers: 4, shelves: 0, countertop: true, plinth: true, label: "Gaveteiro" },
  gavetao: { level: "inferior", opening: "gaveta", defaultWidthMm: 800, defaultHeightMm: 900, defaultDepthMm: 600, doors: 0, drawers: 2, shelves: 0, countertop: true, plinth: true, label: "Gavetão" },
  aereo: { level: "superior", opening: "abrir", defaultWidthMm: 600, defaultHeightMm: 700, defaultDepthMm: 350, doors: 1, drawers: 0, shelves: 1, countertop: false, plinth: false, label: "Aéreo" },
  "aereo-basculante": { level: "superior", opening: "basculante", defaultWidthMm: 800, defaultHeightMm: 400, defaultDepthMm: 350, doors: 1, drawers: 0, shelves: 0, countertop: false, plinth: false, label: "Aéreo basculante" },
  "aereo-vidro": { level: "superior", opening: "abrir", defaultWidthMm: 600, defaultHeightMm: 700, defaultDepthMm: 350, doors: 1, drawers: 0, shelves: 1, countertop: false, plinth: false, label: "Aéreo com vidro" },
  "torre-quente": { level: "coluna", opening: "abrir", defaultWidthMm: 600, defaultHeightMm: 2200, defaultDepthMm: 600, doors: 1, drawers: 1, shelves: 1, countertop: false, plinth: true, label: "Torre quente" },
  "torre-geladeira": { level: "coluna", opening: "aberto", defaultWidthMm: 800, defaultHeightMm: 2200, defaultDepthMm: 700, doors: 0, drawers: 0, shelves: 0, countertop: false, plinth: true, label: "Torre da geladeira" },
  "canto-reto": { level: "inferior", opening: "abrir", defaultWidthMm: 900, defaultHeightMm: 900, defaultDepthMm: 600, doors: 1, drawers: 0, shelves: 1, countertop: true, plinth: true, label: "Canto reto" },
  "canto-diagonal": { level: "inferior", opening: "abrir", defaultWidthMm: 900, defaultHeightMm: 900, defaultDepthMm: 600, doors: 1, drawers: 0, shelves: 1, countertop: true, plinth: true, label: "Canto diagonal" },
  "canto-magico": { level: "inferior", opening: "abrir", defaultWidthMm: 900, defaultHeightMm: 900, defaultDepthMm: 600, doors: 1, drawers: 0, shelves: 0, countertop: true, plinth: true, label: "Canto mágico" },
  cristaleira: { level: "superior", opening: "abrir", defaultWidthMm: 800, defaultHeightMm: 900, defaultDepthMm: 350, doors: 2, drawers: 0, shelves: 2, countertop: false, plinth: false, label: "Cristaleira" },
  adega: { level: "inferior", opening: "aberto", defaultWidthMm: 400, defaultHeightMm: 900, defaultDepthMm: 600, doors: 0, drawers: 0, shelves: 4, countertop: true, plinth: true, label: "Adega" },
  "nicho-aberto": { level: "superior", opening: "aberto", defaultWidthMm: 600, defaultHeightMm: 700, defaultDepthMm: 350, doors: 0, drawers: 0, shelves: 2, countertop: false, plinth: false, label: "Nicho aberto" },
};

/** Ficha de UM módulo de cozinha. */
export interface KitchenModuleSpec {
  readonly kind: KitchenModuleKind;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly doors: number;
  readonly drawers: number;
  readonly shelves: number;
  readonly opening: KitchenOpening;
  readonly handle: string;
  readonly countertop: KitchenCountertop;
  readonly plinth: KitchenPlinth;
  /** Frente em vidro (cristaleira, aéreo com vidro). */
  readonly glassFront: boolean;
  /** Fita de LED sob o aéreo / dentro do nicho. */
  readonly led: boolean;
  readonly style: string;
  readonly finishId: string;
  readonly thicknessMm: number;
  readonly backThicknessMm: number;
  /** Folga lateral do eletrodoméstico dentro do nicho (mm). */
  readonly applianceGapSideMm: number;
  /** Folga superior do eletrodoméstico dentro do nicho (mm). */
  readonly applianceGapTopMm: number;
  /** Folga/ventilação traseira do eletrodoméstico (mm). */
  readonly applianceGapBackMm: number;
}

/** Entrada tolerante: tampo e rodapé podem vir parciais (IA, catálogo, UI). */
export type KitchenModuleInput = Partial<Omit<KitchenModuleSpec, "countertop" | "plinth">> & {
  readonly countertop?: Partial<KitchenCountertop>;
  readonly plinth?: Partial<KitchenPlinth>;
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

/** Remove chaves `undefined` para o spread não apagar um padrão calculado. */
function defined<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Normaliza o `kind` vindo de texto livre (IA, catálogo, projeto antigo). */
export function normalizeKitchenKind(value: string | undefined | null): KitchenModuleKind {
  const k = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
  if (KITCHEN_MODULE_KINDS.includes(k as KitchenModuleKind)) return k as KitchenModuleKind;
  if (/pia|cuba|lava-loucas/.test(k)) return "balcao-pia";
  if (/cooktop|fogao/.test(k)) return "balcao-cooktop";
  if (/gavetao/.test(k)) return "gavetao";
  if (/gaveteiro|gavetas/.test(k)) return "gaveteiro";
  if (/basculante/.test(k)) return "aereo-basculante";
  if (/cristaleira|vitrine/.test(k)) return "cristaleira";
  if (/adega|garrafeir/.test(k)) return "adega";
  if (/nicho/.test(k)) return "nicho-aberto";
  if (/geladeira|refrigerador/.test(k)) return "torre-geladeira";
  if (/torre|forno|micro/.test(k)) return "torre-quente";
  if (/magic/.test(k)) return "canto-magico";
  if (/diagonal/.test(k)) return "canto-diagonal";
  if (/canto|quina/.test(k)) return "canto-reto";
  if (/aereo|superior|suspenso/.test(k)) return "aereo";
  return "balcao";
}

/** Preenche a ficha a partir do perfil do módulo. Nunca lança. */
export function normalizeKitchenModule(input: KitchenModuleInput = {}): KitchenModuleSpec {
  const kind = normalizeKitchenKind(input.kind);
  const p = KITCHEN_MODULE_PROFILES[kind];
  const widthMm = num(input.widthMm, p.defaultWidthMm, 200, 2000);
  const heightMm = num(input.heightMm, p.defaultHeightMm, 200, 2900);
  const depthMm = num(input.depthMm, p.defaultDepthMm, 150, 900);
  const opening = input.opening ?? p.opening;

  // Duas folhas a partir de 700 mm: porta única larga demais empena e bate.
  const autoDoors = p.doors > 0 ? (widthMm >= 700 ? 2 : 1) : 0;
  const doors = opening === "aberto" || opening === "gaveta" ? 0 : int(input.doors, autoDoors, 0, 6);

  const glassFront = input.glassFront ?? (kind === "aereo-vidro" || kind === "cristaleira");
  const wantsCountertop = p.countertop && (input.countertop?.material ?? "granito") !== "nenhum";

  // Sob a cuba não existe gaveta: o sifão e a área hidráulica ocupam o vão.
  const drawers =
    kind === "balcao-pia"
      ? 0
      : opening === "abrir" && p.drawers === 0
        ? int(input.drawers, 0, 0, 6)
        : int(input.drawers, p.drawers, 0, 6);

  return {
    kind,
    widthMm,
    heightMm,
    depthMm,
    doors,
    drawers,
    shelves: int(input.shelves, p.shelves, 0, 8),
    opening,
    handle: input.handle ?? "perfil-gola",
    countertop: normalizeCountertop(
      {
        // O recorte é uma consequência do módulo, não uma escolha solta:
        // pia sempre tem cuba, cooktop sempre tem recorte de cooktop.
        cutout: kind === "balcao-pia" ? "cuba" : kind === "balcao-cooktop" ? "cooktop" : "nenhum",
        ...defined(input.countertop),
      },
      wantsCountertop && p.countertop,
    ),
    plinth: normalizePlinth(defined(input.plinth), p.plinth),
    glassFront,
    led: input.led ?? false,
    style: input.style ?? "moderno",
    finishId: input.finishId ?? "branco-tx",
    thicknessMm: num(input.thicknessMm, 18, 9, 30),
    backThicknessMm: num(input.backThicknessMm, 6, 3, 18),
    applianceGapSideMm: int(input.applianceGapSideMm, 30, 0, 200),
    applianceGapTopMm: int(input.applianceGapTopMm, 50, 0, 300),
    applianceGapBackMm: int(input.applianceGapBackMm, 50, 0, 200),
  };
}

/** Puxador traduzido para o vocabulário dos componentes. */
export function kitchenHandle(spec: KitchenModuleSpec): ComponentHandle {
  return handleType(spec.handle);
}

export function kitchenLevel(kind: KitchenModuleKind): KitchenLevel {
  return KITCHEN_MODULE_PROFILES[kind].level;
}

export { COUNTERTOPS };