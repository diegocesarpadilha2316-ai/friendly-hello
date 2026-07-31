/**
 * PRESETS DE LAVANDERIA.
 *
 * Cada preset declara dimensões recomendadas, módulos obrigatórios e
 * flexíveis, aparelhos, tanque, instalação, prioridade de redução, tampo,
 * aéreos, hidráulica e ventilação. Nenhum preset desenha nada: ele apenas
 * descreve a intenção que o Layout Engine traduz em módulos reais.
 */
import type { ApplianceKind } from "./appliances";
import type { LaundryInstall, LaundryModuleKind } from "./spec";
import type { TubType } from "./tub";

export type LaundryPresetId =
  | "lavanderia-compacta"
  | "maquina-tanque"
  | "maquina-sob-bancada"
  | "torre-maquinas"
  | "maquinas-lado-a-lado"
  | "lavanderia-em-l"
  | "entre-paredes"
  | "lavanderia-integrada"
  | "vassoureiro"
  | "area-servico-completa";

export interface LaundryPreset {
  readonly id: LaundryPresetId;
  readonly label: string;
  readonly minWidthMm: number;
  readonly maxWidthMm: number;
  readonly recommendedWidthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  /** Módulos que o preset nunca abre mão. */
  readonly required: readonly LaundryModuleKind[];
  /** Módulos usados para preencher a sobra, na ordem de preferência. */
  readonly flexible: readonly LaundryModuleKind[];
  /** Ordem de REDUÇÃO quando falta largura (primeiro sai primeiro). */
  readonly reductionOrder: readonly LaundryModuleKind[];
  readonly appliances: readonly ApplianceKind[];
  readonly tub: TubType;
  readonly install: LaundryInstall;
  readonly countertop: string;
  /** Emitir armários aéreos automaticamente. */
  readonly uppers: boolean;
  readonly hydraulic: boolean;
  readonly ventilation: boolean;
  readonly technical: readonly string[];
  readonly betweenWalls: boolean;
  /** Composição em L (duas paredes) — reparte a largura em dois trechos. */
  readonly corner: boolean;
}

const BASE = {
  heightMm: 850,
  depthMm: 600,
  install: "piso" as LaundryInstall,
  countertop: "granito",
  uppers: false,
  hydraulic: true,
  ventilation: true,
  betweenWalls: false,
  corner: false,
} as const;

export const LAUNDRY_PRESETS: Readonly<Record<LaundryPresetId, LaundryPreset>> = {
  "lavanderia-compacta": {
    ...BASE,
    id: "lavanderia-compacta",
    label: "Lavanderia Compacta",
    minWidthMm: 700,
    maxWidthMm: 1300,
    recommendedWidthMm: 1200,
    required: ["modulo-lavadora"],
    flexible: ["gabinete-tanque", "aereo-portas", "prateleira"],
    reductionOrder: ["prateleira", "aereo-portas", "gabinete-tanque"],
    appliances: ["lavadora-frontal"],
    tub: "compacto",
    uppers: true,
    technical: ["aparelho", "abertura-porta", "ventilacao", "agua", "esgoto", "eletrico"],
  },
  "maquina-tanque": {
    ...BASE,
    id: "maquina-tanque",
    label: "Máquina + Tanque",
    minWidthMm: 1100,
    maxWidthMm: 1800,
    recommendedWidthMm: 1600,
    required: ["modulo-lavadora", "gabinete-tanque"],
    flexible: ["aereo-portas", "modulo-produtos", "prateleira"],
    reductionOrder: ["prateleira", "modulo-produtos", "aereo-portas"],
    appliances: ["lavadora-frontal"],
    tub: "embutido",
    uppers: true,
    technical: ["aparelho", "cuba", "sifao", "valvula", "agua", "esgoto", "ventilacao"],
  },
  "maquina-sob-bancada": {
    ...BASE,
    id: "maquina-sob-bancada",
    label: "Máquina sob Bancada",
    minWidthMm: 1200,
    maxWidthMm: 2400,
    recommendedWidthMm: 1800,
    heightMm: 900,
    depthMm: 650,
    required: ["bancada-sobre-maquina", "gabinete-tanque"],
    flexible: ["gabinete-gavetas", "aereo-portas", "modulo-produtos"],
    reductionOrder: ["modulo-produtos", "gabinete-gavetas", "aereo-portas"],
    appliances: ["lavadora-frontal"],
    tub: "embutido",
    countertop: "quartzo",
    uppers: true,
    technical: ["aparelho", "abertura-porta", "manutencao", "cuba", "sifao", "agua", "esgoto"],
  },
  "torre-maquinas": {
    ...BASE,
    id: "torre-maquinas",
    label: "Torre de Máquinas",
    minWidthMm: 700,
    maxWidthMm: 2400,
    recommendedWidthMm: 1400,
    heightMm: 2100,
    depthMm: 750,
    required: ["torre-maquinas"],
    flexible: ["gabinete-tanque", "vassoureiro", "armario-limpeza"],
    reductionOrder: ["armario-limpeza", "vassoureiro", "gabinete-tanque"],
    appliances: ["torre"],
    tub: "embutido",
    technical: ["aparelho", "ventilacao", "manutencao", "eletrico", "agua", "esgoto"],
  },
  "maquinas-lado-a-lado": {
    ...BASE,
    id: "maquinas-lado-a-lado",
    label: "Máquinas lado a lado",
    minWidthMm: 1400,
    maxWidthMm: 3000,
    recommendedWidthMm: 2000,
    heightMm: 1050,
    depthMm: 750,
    required: ["modulo-lavadora", "modulo-secadora"],
    flexible: ["tampo-continuo", "aereo-portas", "gabinete-tanque"],
    reductionOrder: ["gabinete-tanque", "aereo-portas", "tampo-continuo"],
    appliances: ["lavadora-frontal", "secadora"],
    tub: "nenhum",
    countertop: "pedra-sinterizada",
    uppers: true,
    hydraulic: true,
    technical: ["aparelho", "abertura-porta", "ventilacao", "manutencao", "eletrico"],
  },
  "lavanderia-em-l": {
    ...BASE,
    id: "lavanderia-em-l",
    label: "Lavanderia em L",
    minWidthMm: 1600,
    maxWidthMm: 4000,
    recommendedWidthMm: 2600,
    required: ["modulo-lavadora", "gabinete-tanque", "gabinete-2-portas"],
    flexible: ["aereo-portas", "vassoureiro", "modulo-cestos", "prateleira"],
    reductionOrder: ["prateleira", "modulo-cestos", "vassoureiro", "aereo-portas"],
    appliances: ["lavadora-frontal"],
    tub: "embutido",
    uppers: true,
    corner: true,
    technical: ["aparelho", "cuba", "sifao", "agua", "esgoto", "ventilacao"],
  },
  "entre-paredes": {
    ...BASE,
    id: "entre-paredes",
    label: "Lavanderia entre Paredes",
    minWidthMm: 900,
    maxWidthMm: 3000,
    recommendedWidthMm: 1700,
    required: ["modulo-lavadora", "gabinete-tanque"],
    flexible: ["gabinete-inferior", "aereo-portas"],
    reductionOrder: ["aereo-portas", "gabinete-inferior"],
    appliances: ["lavadora-frontal"],
    tub: "embutido",
    uppers: true,
    betweenWalls: true,
    technical: ["aparelho", "cuba", "sifao", "agua", "esgoto", "ventilacao", "manutencao"],
  },
  "lavanderia-integrada": {
    ...BASE,
    id: "lavanderia-integrada",
    label: "Lavanderia Integrada",
    minWidthMm: 1200,
    maxWidthMm: 3000,
    recommendedWidthMm: 2000,
    heightMm: 900,
    depthMm: 650,
    required: ["torre-tecnica", "gabinete-tanque"],
    flexible: ["gabinete-gavetas", "aereo-portas", "modulo-produtos", "prateleira"],
    reductionOrder: ["prateleira", "modulo-produtos", "gabinete-gavetas", "aereo-portas"],
    appliances: ["torre"],
    tub: "esculpido",
    countertop: "pedra-sinterizada",
    uppers: true,
    technical: ["aparelho", "ventilacao", "manutencao", "cuba", "sifao", "agua", "esgoto"],
  },
  vassoureiro: {
    ...BASE,
    id: "vassoureiro",
    label: "Vassoureiro",
    minWidthMm: 400,
    maxWidthMm: 1400,
    recommendedWidthMm: 900,
    heightMm: 2100,
    depthMm: 500,
    required: ["vassoureiro"],
    flexible: ["armario-limpeza", "modulo-produtos", "prateleira"],
    reductionOrder: ["prateleira", "modulo-produtos", "armario-limpeza"],
    appliances: [],
    tub: "nenhum",
    hydraulic: false,
    ventilation: false,
    technical: ["vassoura"],
  },
  "area-servico-completa": {
    ...BASE,
    id: "area-servico-completa",
    label: "Área de Serviço Completa",
    minWidthMm: 2200,
    maxWidthMm: 5000,
    recommendedWidthMm: 3200,
    heightMm: 900,
    depthMm: 650,
    required: ["torre-maquinas", "gabinete-tanque", "vassoureiro"],
    flexible: [
      "gabinete-2-portas",
      "modulo-cestos",
      "modulo-tabua",
      "aereo-portas",
      "modulo-produtos",
      "prateleira",
    ],
    reductionOrder: [
      "prateleira",
      "modulo-produtos",
      "aereo-portas",
      "modulo-tabua",
      "modulo-cestos",
      "gabinete-2-portas",
    ],
    appliances: ["torre"],
    tub: "embutido",
    countertop: "quartzo",
    uppers: true,
    technical: [
      "aparelho",
      "ventilacao",
      "manutencao",
      "cuba",
      "sifao",
      "valvula",
      "agua",
      "esgoto",
      "vassoura",
      "cesto",
      "tabua",
    ],
  },
};

export function listLaundryPresets(): readonly LaundryPreset[] {
  return Object.values(LAUNDRY_PRESETS);
}

/** Preset automático a partir da largura disponível. */
export function pickLaundryPreset(widthMm: number, betweenWalls = false): LaundryPreset {
  if (betweenWalls) return LAUNDRY_PRESETS["entre-paredes"];
  if (widthMm < 700) return LAUNDRY_PRESETS.vassoureiro;
  if (widthMm < 1300) return LAUNDRY_PRESETS["lavanderia-compacta"];
  if (widthMm < 1800) return LAUNDRY_PRESETS["maquina-tanque"];
  if (widthMm < 2200) return LAUNDRY_PRESETS["maquinas-lado-a-lado"];
  return LAUNDRY_PRESETS["area-servico-completa"];
}

export function normalizeLaundryPresetId(value: unknown): LaundryPresetId | null {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
  return k in LAUNDRY_PRESETS ? (k as LaundryPresetId) : null;
}
