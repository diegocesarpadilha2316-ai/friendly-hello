/**
 * FAMÍLIA LAVANDERIA — ficha técnica (LaundryModuleSpec).
 *
 * Nada é desenhado aqui: a ficha só descreve o módulo. Geometria, folgas,
 * ferragens e rigs vêm da Biblioteca Construtiva, exatamente como no
 * roupeiro, gaveteiro, cozinha e banheiro. Tampo/rodapé vêm da cozinha e
 * a hidráulica vem do banheiro — nenhum motor paralelo.
 *
 * Unidade canônica: milímetro.
 */
import { handleType, type ComponentHandle } from "../handles";
import type { BathroomCountertop, BathroomInstall } from "../bathroom/spec";
import { normalizeInstall } from "../bathroom/spec";
import { COUNTERTOPS, normalizeCountertop } from "../kitchen/countertop";
import { normalizePlinth, type KitchenPlinth } from "../kitchen/plinth";
import {
  APPLIANCES,
  applianceEnvelopeMm,
  minNicheWidthForApplianceMm,
  normalizeAppliance,
  type ApplianceKind,
  type LaundryAppliance,
} from "./appliances";
import { minWidthForTubMm, normalizeTub, TUB_STRUCTURAL_CLEARANCE_MM, type LaundryTub, type TubType } from "./tub";

/** Instalação: mesma taxonomia do banheiro (suspenso/piso/pés/rodapé). */
export type LaundryInstall = BathroomInstall;

/** Tampo da lavanderia: o mesmo contrato do banheiro (tampo da cozinha + saia/frontão). */
export type LaundryCountertop = BathroomCountertop;

/** Módulos atendidos pela família. */
export type LaundryModuleKind =
  | "gabinete-tanque"
  | "gabinete-inferior"
  | "gabinete-2-portas"
  | "gabinete-gavetas"
  | "gabinete-cesto-basculante"
  | "modulo-lavadora"
  | "modulo-secadora"
  | "modulo-lava-e-seca"
  | "torre-maquinas"
  | "torre-tecnica"
  | "vassoureiro"
  | "armario-limpeza"
  | "aereo-simples"
  | "aereo-portas"
  | "nicho-aberto"
  | "prateleira"
  | "modulo-produtos"
  | "modulo-tabua"
  | "modulo-cestos"
  | "tapa-vao"
  | "painel-acabamento"
  | "rodabanca"
  | "tampo-continuo"
  | "bancada-sobre-maquina";

export const LAUNDRY_MODULE_KINDS: readonly LaundryModuleKind[] = [
  "gabinete-tanque",
  "gabinete-inferior",
  "gabinete-2-portas",
  "gabinete-gavetas",
  "gabinete-cesto-basculante",
  "modulo-lavadora",
  "modulo-secadora",
  "modulo-lava-e-seca",
  "torre-maquinas",
  "torre-tecnica",
  "vassoureiro",
  "armario-limpeza",
  "aereo-simples",
  "aereo-portas",
  "nicho-aberto",
  "prateleira",
  "modulo-produtos",
  "modulo-tabua",
  "modulo-cestos",
  "tapa-vao",
  "painel-acabamento",
  "rodabanca",
  "tampo-continuo",
  "bancada-sobre-maquina",
];

/** Faixa vertical ocupada pelo módulo. */
export type LaundryLevel = "bancada" | "superior" | "coluna" | "acabamento" | "tampo";

export type LaundryOpening = "abrir" | "correr" | "gaveta" | "misto" | "aberto" | "cesto";

/** Cestos: peça estrutural, frente móvel, cesto técnico e volume reservado. */
export type BasketKind = "nenhum" | "basculante" | "deslizante" | "removivel" | "nicho";

/** Tábua de passar. */
export type BoardKind = "nenhum" | "nicho" | "gaveta" | "vertical";

export interface LaundryModuleProfile {
  readonly level: LaundryLevel;
  readonly opening: LaundryOpening;
  readonly install: LaundryInstall;
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
  readonly tub: TubType;
  readonly appliance: ApplianceKind;
  readonly basket: BasketKind;
  readonly board: BoardKind;
  /** Reserva vertical de vassouras. */
  readonly broomZone: boolean;
  readonly label: string;
}

const G = {
  level: "bancada",
  opening: "abrir",
  install: "piso",
  defaultHeightMm: 850,
  defaultDepthMm: 550,
  minWidthMm: 300,
  maxWidthMm: 2400,
  minDepthMm: 250,
  maxDepthMm: 900,
  countertop: false,
  tub: "nenhum",
  appliance: "nenhum",
  basket: "nenhum",
  board: "nenhum",
  broomZone: false,
} as const;

/** Perfil construtivo de cada módulo — fonte única de verdade. */
export const LAUNDRY_MODULE_PROFILES: Readonly<Record<LaundryModuleKind, LaundryModuleProfile>> = {
  "gabinete-tanque": { ...G, defaultWidthMm: 700, defaultDepthMm: 600, countertop: true, tub: "embutido", doors: 2, drawers: 0, shelves: 0, label: "Gabinete para tanque" },
  "gabinete-inferior": { ...G, defaultWidthMm: 600, countertop: true, doors: 1, drawers: 0, shelves: 1, label: "Gabinete inferior simples" },
  "gabinete-2-portas": { ...G, defaultWidthMm: 900, countertop: true, doors: 2, drawers: 0, shelves: 1, label: "Gabinete com duas portas" },
  "gabinete-gavetas": { ...G, opening: "gaveta", defaultWidthMm: 600, countertop: true, doors: 0, drawers: 3, shelves: 0, label: "Gabinete com gavetas" },
  "gabinete-cesto-basculante": { ...G, opening: "cesto", defaultWidthMm: 500, countertop: true, basket: "basculante", doors: 0, drawers: 0, shelves: 0, label: "Gabinete com cesto basculante" },
  "modulo-lavadora": { ...G, opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 1000, defaultDepthMm: 750, minWidthMm: 600, appliance: "lavadora-frontal", doors: 0, drawers: 0, shelves: 0, label: "Módulo para máquina de lavar" },
  "modulo-secadora": { ...G, opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 1000, defaultDepthMm: 750, minWidthMm: 600, appliance: "secadora", doors: 0, drawers: 0, shelves: 0, label: "Módulo para secadora" },
  "modulo-lava-e-seca": { ...G, opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 1020, defaultDepthMm: 780, minWidthMm: 600, appliance: "lava-e-seca", doors: 0, drawers: 0, shelves: 0, label: "Módulo para lava e seca" },
  "torre-maquinas": { ...G, level: "coluna", opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 2000, defaultDepthMm: 750, minWidthMm: 600, appliance: "torre", doors: 0, drawers: 0, shelves: 0, label: "Torre máquina + secadora" },
  "torre-tecnica": { ...G, level: "coluna", defaultWidthMm: 750, defaultHeightMm: 2100, defaultDepthMm: 750, minWidthMm: 620, appliance: "torre", doors: 2, drawers: 0, shelves: 0, label: "Torre técnica fechada" },
  vassoureiro: { ...G, level: "coluna", defaultWidthMm: 450, defaultHeightMm: 2100, defaultDepthMm: 500, minWidthMm: 350, maxWidthMm: 800, broomZone: true, doors: 1, drawers: 0, shelves: 1, label: "Vassoureiro" },
  "armario-limpeza": { ...G, level: "coluna", defaultWidthMm: 600, defaultHeightMm: 2100, defaultDepthMm: 500, doors: 2, drawers: 0, shelves: 4, label: "Armário alto de limpeza" },
  "aereo-simples": { ...G, level: "superior", opening: "aberto", install: "suspenso", defaultWidthMm: 800, defaultHeightMm: 700, defaultDepthMm: 350, minDepthMm: 150, doors: 0, drawers: 0, shelves: 2, label: "Armário aéreo simples" },
  "aereo-portas": { ...G, level: "superior", install: "suspenso", defaultWidthMm: 800, defaultHeightMm: 700, defaultDepthMm: 350, minDepthMm: 150, doors: 2, drawers: 0, shelves: 1, label: "Armário aéreo com portas" },
  "nicho-aberto": { ...G, level: "superior", opening: "aberto", install: "suspenso", defaultWidthMm: 400, defaultHeightMm: 600, defaultDepthMm: 300, minDepthMm: 150, doors: 0, drawers: 0, shelves: 2, label: "Nicho aberto" },
  prateleira: { ...G, level: "superior", opening: "aberto", install: "suspenso", defaultWidthMm: 800, defaultHeightMm: 40, defaultDepthMm: 300, minDepthMm: 100, doors: 0, drawers: 0, shelves: 1, label: "Prateleira" },
  "modulo-produtos": { ...G, defaultWidthMm: 400, countertop: true, doors: 1, drawers: 0, shelves: 3, label: "Módulo para produtos de limpeza" },
  "modulo-tabua": { ...G, level: "coluna", defaultWidthMm: 350, defaultHeightMm: 1400, defaultDepthMm: 550, minWidthMm: 200, board: "nicho", doors: 0, drawers: 0, shelves: 0, label: "Módulo para tábua de passar" },
  "modulo-cestos": { ...G, opening: "aberto", defaultWidthMm: 600, countertop: true, basket: "removivel", doors: 0, drawers: 0, shelves: 2, label: "Módulo para cestos removíveis" },
  "tapa-vao": { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 60, defaultDepthMm: 550, minWidthMm: 10, maxWidthMm: 400, minDepthMm: 10, doors: 0, drawers: 0, shelves: 0, label: "Tapa-vão lateral" },
  "painel-acabamento": { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 550, defaultDepthMm: 18, minWidthMm: 50, minDepthMm: 10, doors: 0, drawers: 0, shelves: 0, label: "Painel de acabamento" },
  rodabanca: { ...G, level: "acabamento", opening: "aberto", defaultWidthMm: 900, defaultHeightMm: 100, defaultDepthMm: 20, minWidthMm: 100, maxWidthMm: 3000, minDepthMm: 10, doors: 0, drawers: 0, shelves: 0, label: "Rodabanca" },
  "tampo-continuo": { ...G, level: "tampo", opening: "aberto", defaultWidthMm: 2000, defaultHeightMm: 40, defaultDepthMm: 600, minWidthMm: 300, maxWidthMm: 4000, minDepthMm: 200, countertop: true, doors: 0, drawers: 0, shelves: 0, label: "Tampo contínuo" },
  "bancada-sobre-maquina": { ...G, opening: "aberto", defaultWidthMm: 700, defaultHeightMm: 1050, defaultDepthMm: 750, minWidthMm: 600, countertop: true, appliance: "lavadora-frontal", doors: 0, drawers: 0, shelves: 0, label: "Bancada sobre máquina frontal" },
};

export interface LaundryModuleSpec {
  readonly kind: LaundryModuleKind;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly doors: number;
  readonly drawers: number;
  readonly shelves: number;
  readonly opening: LaundryOpening;
  readonly handle: string;
  readonly install: LaundryInstall;
  /** Altura do fundo do módulo em relação ao piso (suspenso/pés). */
  readonly floorGapMm: number;
  readonly feetHeightMm: number;
  readonly recessMm: number;
  readonly plinth: KitchenPlinth;
  readonly countertop: LaundryCountertop;
  readonly tub: LaundryTub;
  readonly appliance: LaundryAppliance;
  readonly basket: BasketKind;
  readonly baskets: number;
  readonly board: BoardKind;
  /** Reserva vertical para vassouras (mm) — 0 quando não há vassoureiro. */
  readonly broomZoneMm: number;
  /** Divisória opcional no vassoureiro. */
  readonly broomDivider: boolean;
  /** Kit de empilhamento na torre. */
  readonly stackingKit: boolean;
  /** Porta externa fechando a torre. */
  readonly outerDoor: boolean;
  /** Painel lateral vista. */
  readonly sidePanel: boolean;
  readonly style: string;
  readonly finishId: string;
  readonly thicknessMm: number;
  readonly backThicknessMm: number;
  readonly closedBack: boolean;
  readonly allowUDrawer: boolean;
  readonly minUDrawerLegMm: number;
  readonly led: boolean;
}

export type LaundryModuleInput = Partial<
  Omit<LaundryModuleSpec, "countertop" | "plinth" | "tub" | "appliance">
> & {
  readonly countertop?: Partial<LaundryCountertop>;
  readonly plinth?: Partial<KitchenPlinth>;
  readonly tub?: Partial<LaundryTub>;
  readonly appliance?: Partial<LaundryAppliance>;
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
export function normalizeLaundryKind(value: string | undefined | null): LaundryModuleKind {
  const k = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
  if (LAUNDRY_MODULE_KINDS.includes(k as LaundryModuleKind)) return k as LaundryModuleKind;
  if (/rodabanca|frontao/.test(k)) return "rodabanca";
  if (/tapa-?vao|filler/.test(k)) return "tapa-vao";
  if (/painel|acabamento/.test(k)) return "painel-acabamento";
  if (/tampo|bancada-continua/.test(k) && !/maquina/.test(k)) return "tampo-continuo";
  if (/bancada.*maquina|maquina.*bancada|sob-bancada/.test(k)) return "bancada-sobre-maquina";
  if (/torre-tecnica|armario-tecnico|torre-fechada/.test(k)) return "torre-tecnica";
  if (/torre/.test(k)) return "torre-maquinas";
  if (/lava-?e-?seca/.test(k)) return "modulo-lava-e-seca";
  if (/secadora|dryer/.test(k)) return "modulo-secadora";
  if (/lavadora|maquina-de-lavar|washer/.test(k)) return "modulo-lavadora";
  if (/vassoureiro|vassoura|broom/.test(k)) return "vassoureiro";
  if (/limpeza|utilitario|multiuso-alto/.test(k)) return "armario-limpeza";
  if (/tabua|passar|ironing/.test(k)) return "modulo-tabua";
  if (/cesto.*bascul|bascul/.test(k)) return "gabinete-cesto-basculante";
  if (/cesto/.test(k)) return "modulo-cestos";
  if (/produto|detergente/.test(k)) return "modulo-produtos";
  if (/prateleira|shelf/.test(k)) return "prateleira";
  if (/nicho/.test(k)) return "nicho-aberto";
  if (/aereo.*porta|aereo-fechado/.test(k)) return "aereo-portas";
  if (/aereo|superior|suspenso-alto/.test(k)) return "aereo-simples";
  if (/tanque|tank/.test(k)) return "gabinete-tanque";
  if (/gaveta/.test(k)) return "gabinete-gavetas";
  if (/2-portas|duas-portas/.test(k)) return "gabinete-2-portas";
  if (/gabinete|balcao|inferior/.test(k)) return "gabinete-inferior";
  return "gabinete-inferior";
}

export function normalizeBasket(value: unknown, fallback: BasketKind): BasketKind {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/bascul/.test(k)) return "basculante";
  if (/desliz|corredic|extraiv/.test(k)) return "deslizante";
  if (/remov|solto|avulso/.test(k)) return "removivel";
  if (/nicho/.test(k)) return "nicho";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return fallback;
}

export function normalizeBoard(value: unknown, fallback: BoardKind): BoardKind {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/gaveta|retrat/.test(k)) return "gaveta";
  if (/vertical|solta/.test(k)) return "vertical";
  if (/nicho|dobrav/.test(k)) return "nicho";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return fallback;
}

function normalizeLaundryTop(
  input: Partial<LaundryCountertop> | undefined,
  enabled: boolean,
  tubCutout: boolean,
): LaundryCountertop {
  const base = normalizeCountertop(
    { cutout: tubCutout ? "cuba" : "nenhum", ...defined(input) },
    enabled,
  );
  const off = base.material === "nenhum";
  return {
    ...base,
    apronMm: off ? 0 : int(input?.apronMm, 0, 0, 300),
    frontonMm: off ? 0 : int(input?.frontonMm, 0, 0, 200),
    faucetCutout: input?.faucetCutout ?? (!off && tubCutout),
  };
}

/** Preenche a ficha a partir do perfil do módulo. Nunca lança. */
export function normalizeLaundryModule(input: LaundryModuleInput = {}): LaundryModuleSpec {
  const kind = normalizeLaundryKind(input.kind);
  const p = LAUNDRY_MODULE_PROFILES[kind];

  const thicknessMm = num(input.thicknessMm, 18, 9, 30);

  const requestedDrawers = int(input.drawers, p.drawers, 0, 8);
  const declaredOpening = (input.opening ?? p.opening) as LaundryOpening;
  /* Gaveta pedida num módulo de abrir NÃO é apagada em silêncio: o módulo
   * passa a operar como misto (gavetas + portas). */
  const opening: LaundryOpening =
    declaredOpening === "abrir" && requestedDrawers > 0 ? "misto" : declaredOpening;
  const install = normalizeInstall(input.install, p.install);

  /* Aparelho: só existe onde o perfil prevê, ou quando pedido explicitamente. */
  const applianceRequested = input.appliance?.kind !== undefined;
  const appliance = normalizeAppliance(
    { kind: p.appliance, ...defined(input.appliance) },
    p.appliance !== "nenhum" || applianceRequested,
  );

  /* O aparelho é um volume TÉCNICO: o nicho nunca pode ser menor que o
   * envelope declarado no catálogo (aparelho + folgas). As dimensões pedidas
   * só sobem — nunca encolhem por conta do aparelho. */
  const envelope = appliance.kind === "nenhum" ? null : applianceEnvelopeMm(appliance);
  const plinthPre = normalizePlinth(defined(input.plinth), install === "rodape");
  const topPre = input.countertop?.material === "nenhum" ? 0 : 40;
  const widthMm = Math.max(
    num(input.widthMm, p.defaultWidthMm, p.minWidthMm, p.maxWidthMm),
    envelope ? envelope.widthMm + 2 * thicknessMm : 0,
  );
  const heightMm = Math.max(
    num(input.heightMm, p.defaultHeightMm, 40, 2600),
    envelope
      ? envelope.heightMm +
        2 * thicknessMm +
        (install === "rodape" ? plinthPre.heightMm : 0) +
        (p.countertop && appliance.doorOpening !== "superior" ? topPre : 0)
      : 0,
  );
  /* A frente (porta/tapa) e o recuo consomem profundidade útil: o envelope do
   * aparelho é medido DENTRO da caixa. */
  const openingPre = opening;
  const frontReservePre =
    openingPre === "correr" ? thicknessMm + 12 : openingPre === "aberto" ? 0 : thicknessMm;
  const recessPre = int(input.recessMm, 0, 0, 300);
  const depthMm = Math.max(
    num(input.depthMm, p.defaultDepthMm, p.minDepthMm, p.maxDepthMm),
    envelope ? envelope.depthMm + frontReservePre + recessPre : 0,
  );

  const wantsTub = (input.tub?.type ?? p.tub) !== "nenhum";
  const innerWidthMm = Math.max(0, widthMm - 2 * thicknessMm);
  const tub = normalizeTub(
    { type: p.tub, ...defined(input.tub) },
    wantsTub,
    {
      maxWidthMm: Math.floor(innerWidthMm - 2 * TUB_STRUCTURAL_CLEARANCE_MM),
      maxDepthMm: depthMm - 40,
    },
  );

  const doors = int(input.doors, p.doors, 0, 6);
  const basket = normalizeBasket(input.basket, p.basket);
  const board = normalizeBoard(input.board, p.board);
  /* Máquina de abertura superior nunca recebe tampo: a tampa precisa subir. */
  const topLoader = appliance.doorOpening === "superior";
  const countertopEnabled =
    p.countertop && !topLoader && (input.countertop?.material ?? "") !== "nenhum";

  return {
    kind,
    widthMm,
    heightMm,
    depthMm,
    doors: opening === "gaveta" || opening === "aberto" || opening === "cesto" ? 0 : doors,
    drawers: opening === "abrir" || opening === "aberto" || opening === "cesto" ? 0 : requestedDrawers,
    shelves: int(input.shelves, p.shelves, 0, 8),
    opening,
    handle: input.handle ?? "perfil-gola",
    install,
    floorGapMm:
      install === "suspenso"
        ? int(input.floorGapMm, 400, 0, 2200)
        : install === "pes"
          ? int(input.feetHeightMm, 120, 40, 300)
          : 0,
    feetHeightMm: int(input.feetHeightMm, install === "pes" ? 120 : 0, 0, 300),
    recessMm: recessPre,
    plinth: plinthPre,
    countertop: normalizeLaundryTop(
      defined(input.countertop) as Partial<LaundryCountertop>,
      countertopEnabled,
      tub.type !== "nenhum" && tub.type !== "independente" && tub.type !== "compacto",
    ),
    tub,
    appliance,
    basket,
    baskets: int(input.baskets, basket === "nenhum" ? 0 : basket === "removivel" ? 2 : 1, 0, 6),
    board,
    broomZoneMm: p.broomZone ? int(input.broomZoneMm, 1400, 600, 2400) : int(input.broomZoneMm, 0, 0, 2400),
    broomDivider: input.broomDivider ?? false,
    stackingKit: input.stackingKit ?? (kind === "torre-maquinas" || kind === "torre-tecnica"),
    outerDoor: input.outerDoor ?? (kind === "torre-tecnica" ? true : false),
    sidePanel: input.sidePanel ?? (kind === "torre-maquinas" || kind === "torre-tecnica"),
    style: input.style ?? "moderno",
    finishId: input.finishId ?? "branco-tx",
    thicknessMm,
    backThicknessMm: num(input.backThicknessMm, 6, 3, 18),
    /* Aparelho ventilado nunca fecha o fundo por completo. */
    closedBack: input.closedBack ?? !appliance.ventilation,
    allowUDrawer: input.allowUDrawer ?? true,
    minUDrawerLegMm: int(input.minUDrawerLegMm, 150, 60, 600),
    led: input.led ?? false,
  };
}

/**
 * Largura mínima REAL de um módulo: o mínimo do perfil OU o que o tanque /
 * o aparelho exigem. Usado pelo Layout Engine para nunca encolher um nicho
 * de máquina até uma medida impossível.
 */
export function laundryMinWidthMm(input: LaundryModuleInput = {}): number {
  const kind = normalizeLaundryKind(input.kind);
  const p = LAUNDRY_MODULE_PROFILES[kind];
  const spec = normalizeLaundryModule(input);
  let min = p.minWidthMm;
  if (spec.tub.type !== "nenhum") {
    min = Math.max(min, minWidthForTubMm(spec.tub, spec.thicknessMm));
  }
  if (spec.appliance.kind !== "nenhum") {
    min = Math.max(min, minNicheWidthForApplianceMm(spec.appliance, spec.thicknessMm));
  }
  return min;
}

/** Altura mínima interna exigida pelo aparelho deste módulo. */
export function laundryMinInnerHeightMm(spec: LaundryModuleSpec): number {
  if (spec.appliance.kind === "nenhum") return 0;
  return applianceEnvelopeMm(spec.appliance).heightMm;
}

export function laundryHandle(spec: LaundryModuleSpec): ComponentHandle {
  return handleType(spec.handle);
}

export function laundryLevel(kind: LaundryModuleKind): LaundryLevel {
  return LAUNDRY_MODULE_PROFILES[kind].level;
}

export function laundryModuleLabel(spec: LaundryModuleSpec): string {
  return LAUNDRY_MODULE_PROFILES[spec.kind].label;
}

export { APPLIANCES, COUNTERTOPS };