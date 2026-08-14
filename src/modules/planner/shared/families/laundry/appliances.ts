/**
 * ELETRODOMÉSTICOS DE LAVANDERIA — VOLUMES TÉCNICOS PARAMÉTRICOS.
 *
 * Um aparelho NÃO é marcenaria. O que precisa estar correto aqui é o
 * VOLUME: envelope do corpo, folgas lateral/superior/traseira, área de
 * abertura da porta (frontal ou tampa superior), área de manutenção,
 * ventilação e os pontos de água, esgoto e energia.
 *
 * O desenho realista do aparelho é outro assunto — esta etapa não modela
 * detalhe algum: modela reserva.
 *
 * Unidade canônica: milímetro.
 */

export type ApplianceKind =
  "nenhum" | "lavadora-frontal" | "lavadora-superior" | "secadora" | "lava-e-seca" | "torre";

/** Como o aparelho abre. */
export type ApplianceDoorOpening = "frontal" | "superior" | "nenhuma";

export type ApplianceHingeSide = "esquerda" | "direita";

export interface ApplianceProfileDef {
  readonly id: ApplianceKind;
  readonly label: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly doorOpening: ApplianceDoorOpening;
  /** Projeção frontal do curso da porta (mm). */
  readonly doorArcMm: number;
  /** Altura livre acima do aparelho exigida pela tampa (mm). */
  readonly topLidMm: number;
  /** Profundidade frontal de acesso à manutenção (mm). */
  readonly serviceMm: number;
  readonly ventilation: boolean;
  /** Folga de ventilação exigida atrás/acima (mm). */
  readonly ventClearanceMm: number;
  readonly sideClearanceMm: number;
  readonly topClearanceMm: number;
  readonly backClearanceMm: number;
  readonly water: boolean;
  readonly drain: boolean;
  readonly power: boolean;
}

export const APPLIANCES: Readonly<Record<ApplianceKind, ApplianceProfileDef>> = {
  nenhum: {
    id: "nenhum",
    label: "Sem aparelho",
    widthMm: 0,
    heightMm: 0,
    depthMm: 0,
    doorOpening: "nenhuma",
    doorArcMm: 0,
    topLidMm: 0,
    serviceMm: 0,
    ventilation: false,
    ventClearanceMm: 0,
    sideClearanceMm: 0,
    topClearanceMm: 0,
    backClearanceMm: 0,
    water: false,
    drain: false,
    power: false,
  },
  "lavadora-frontal": {
    id: "lavadora-frontal",
    label: "Máquina de lavar frontal",
    widthMm: 600,
    heightMm: 850,
    depthMm: 650,
    doorOpening: "frontal",
    doorArcMm: 600,
    topLidMm: 0,
    serviceMm: 700,
    ventilation: false,
    ventClearanceMm: 0,
    sideClearanceMm: 20,
    topClearanceMm: 30,
    backClearanceMm: 50,
    water: true,
    drain: true,
    power: true,
  },
  "lavadora-superior": {
    id: "lavadora-superior",
    label: "Máquina de lavar abertura superior",
    widthMm: 620,
    heightMm: 1050,
    depthMm: 680,
    doorOpening: "superior",
    doorArcMm: 0,
    topLidMm: 500,
    serviceMm: 700,
    ventilation: false,
    ventClearanceMm: 0,
    sideClearanceMm: 25,
    topClearanceMm: 40,
    backClearanceMm: 50,
    water: true,
    drain: true,
    power: true,
  },
  secadora: {
    id: "secadora",
    label: "Secadora frontal",
    widthMm: 600,
    heightMm: 850,
    depthMm: 620,
    doorOpening: "frontal",
    doorArcMm: 600,
    topLidMm: 0,
    serviceMm: 700,
    ventilation: true,
    ventClearanceMm: 100,
    sideClearanceMm: 20,
    topClearanceMm: 30,
    backClearanceMm: 80,
    water: false,
    drain: true,
    power: true,
  },
  "lava-e-seca": {
    id: "lava-e-seca",
    label: "Lava e seca",
    widthMm: 600,
    heightMm: 870,
    depthMm: 680,
    doorOpening: "frontal",
    doorArcMm: 620,
    topLidMm: 0,
    serviceMm: 700,
    ventilation: true,
    ventClearanceMm: 80,
    sideClearanceMm: 20,
    topClearanceMm: 30,
    backClearanceMm: 70,
    water: true,
    drain: true,
    power: true,
  },
  torre: {
    id: "torre",
    label: "Torre máquina + secadora",
    widthMm: 600,
    heightMm: 1750,
    depthMm: 680,
    doorOpening: "frontal",
    doorArcMm: 620,
    topLidMm: 0,
    serviceMm: 700,
    ventilation: true,
    ventClearanceMm: 100,
    sideClearanceMm: 25,
    topClearanceMm: 40,
    backClearanceMm: 80,
    water: true,
    drain: true,
    power: true,
  },
};

/** Ficha normalizada de um aparelho instalado num módulo. */
export interface LaundryAppliance {
  readonly kind: ApplianceKind;
  readonly label: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly sideClearanceMm: number;
  readonly topClearanceMm: number;
  readonly backClearanceMm: number;
  readonly doorOpening: ApplianceDoorOpening;
  readonly doorArcMm: number;
  readonly topLidMm: number;
  readonly serviceMm: number;
  readonly ventilation: boolean;
  readonly ventClearanceMm: number;
  readonly water: boolean;
  readonly drain: boolean;
  readonly power: boolean;
  readonly hingeSide: ApplianceHingeSide;
  /** Deslocamento explícito do centro do aparelho (mm a partir da esquerda). */
  readonly xMm?: number;
}

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function slug(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
}

export function normalizeApplianceKind(value: unknown): ApplianceKind {
  const k = slug(value);
  if (k in APPLIANCES) return k as ApplianceKind;
  if (/lava-?e-?seca|washer-?dryer|lavaeseca/.test(k)) return "lava-e-seca";
  if (/torre|tower|empilhad/.test(k)) return "torre";
  if (/secadora|dryer/.test(k)) return "secadora";
  if (/superior|top-?load|abertura-superior|tampa/.test(k)) return "lavadora-superior";
  if (/lavadora|lava-?roupas|maquina-de-lavar|washer|frontal/.test(k)) return "lavadora-frontal";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return "nenhum";
}

export function normalizeApplianceHinge(
  value: unknown,
  fallback: ApplianceHingeSide = "esquerda",
): ApplianceHingeSide {
  const k = slug(value);
  if (/direit|right/.test(k)) return "direita";
  if (/esquerd|left/.test(k)) return "esquerda";
  return fallback;
}

export function normalizeAppliance(
  input: Partial<LaundryAppliance> | undefined,
  enabled = true,
): LaundryAppliance {
  const kind = enabled ? normalizeApplianceKind(input?.kind) : "nenhum";
  const d = APPLIANCES[kind];
  const off = kind === "nenhum";
  return {
    kind,
    label: d.label,
    widthMm: off ? 0 : clampNum(input?.widthMm, d.widthMm, 400, 900),
    heightMm: off ? 0 : clampNum(input?.heightMm, d.heightMm, 600, 2000),
    depthMm: off ? 0 : clampNum(input?.depthMm, d.depthMm, 400, 900),
    sideClearanceMm: off ? 0 : clampNum(input?.sideClearanceMm, d.sideClearanceMm, 0, 120),
    topClearanceMm: off ? 0 : clampNum(input?.topClearanceMm, d.topClearanceMm, 0, 300),
    backClearanceMm: off ? 0 : clampNum(input?.backClearanceMm, d.backClearanceMm, 0, 300),
    doorOpening: off ? "nenhuma" : (input?.doorOpening ?? d.doorOpening),
    doorArcMm: off ? 0 : clampNum(input?.doorArcMm, d.doorArcMm, 0, 900),
    topLidMm: off ? 0 : clampNum(input?.topLidMm, d.topLidMm, 0, 900),
    serviceMm: off ? 0 : clampNum(input?.serviceMm, d.serviceMm, 0, 1200),
    ventilation: off ? false : (input?.ventilation ?? d.ventilation),
    ventClearanceMm: off ? 0 : clampNum(input?.ventClearanceMm, d.ventClearanceMm, 0, 300),
    water: off ? false : (input?.water ?? d.water),
    drain: off ? false : (input?.drain ?? d.drain),
    power: off ? false : (input?.power ?? d.power),
    hingeSide: normalizeApplianceHinge(input?.hingeSide),
    xMm:
      typeof input?.xMm === "number" && Number.isFinite(input.xMm)
        ? Math.round(input.xMm)
        : undefined,
  };
}

export function isTopLoader(a: LaundryAppliance): boolean {
  return a.kind !== "nenhum" && a.doorOpening === "superior";
}

export function isFrontLoader(a: LaundryAppliance): boolean {
  return a.kind !== "nenhum" && a.doorOpening === "frontal";
}

/** Envelope técnico: aparelho + folgas. É o nicho MÍNIMO interno. */
export interface ApplianceEnvelope {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
}

export function applianceEnvelopeMm(a: LaundryAppliance): ApplianceEnvelope {
  if (a.kind === "nenhum") return { widthMm: 0, heightMm: 0, depthMm: 0 };
  return {
    widthMm: a.widthMm + 2 * a.sideClearanceMm,
    heightMm: a.heightMm + a.topClearanceMm,
    depthMm: a.depthMm + Math.max(a.backClearanceMm, a.ventilation ? a.ventClearanceMm : 0),
  };
}

/** Largura externa mínima de um módulo que recebe este aparelho. */
export function minNicheWidthForApplianceMm(a: LaundryAppliance, thicknessMm = 18): number {
  if (a.kind === "nenhum") return 0;
  return Math.ceil(applianceEnvelopeMm(a).widthMm + 2 * thicknessMm);
}

/** Centro do aparelho dentro de um módulo. */
export function applianceCenterMm(a: LaundryAppliance, widthMm: number): number {
  if (typeof a.xMm === "number") return Math.min(widthMm, Math.max(0, a.xMm));
  return Math.round(widthMm / 2);
}

export function listAppliances(): readonly ApplianceProfileDef[] {
  return Object.values(APPLIANCES).filter((a) => a.id !== "nenhum");
}
