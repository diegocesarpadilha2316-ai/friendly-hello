/**
 * PRESETS DE BANHEIRO.
 * Cada preset declara dimensões recomendadas, módulos obrigatórios e
 * flexíveis, cuba, instalação, espelheira, tampo e volumes técnicos.
 */
import type { BathroomInstall, BathroomModuleKind, MirrorKind } from "./spec";
import type { SinkType } from "./sink";

export type BathroomPresetId =
  | "lavabo-compacto"
  | "banheiro-pequeno"
  | "banheiro-padrao"
  | "banheiro-casal"
  | "bancada-cuba-dupla"
  | "gabinete-suspenso"
  | "gabinete-com-torre"
  | "gabinete-entre-paredes";

export interface BathroomPreset {
  readonly id: BathroomPresetId;
  readonly label: string;
  readonly minWidthMm: number;
  readonly maxWidthMm: number;
  readonly recommendedWidthMm: number;
  readonly counterHeightMm: number;
  readonly depthMm: number;
  readonly required: readonly BathroomModuleKind[];
  readonly flexible: readonly BathroomModuleKind[];
  readonly sink: SinkType;
  readonly install: BathroomInstall;
  readonly mirror: MirrorKind;
  readonly countertop: string;
  /** Volumes técnicos esperados (documentação do preset). */
  readonly technical: readonly string[];
  /** Fecha o vão restante com tapa-vão real. */
  readonly betweenWalls: boolean;
}

export const BATHROOM_PRESETS: Readonly<Record<BathroomPresetId, BathroomPreset>> = {
  "lavabo-compacto": {
    id: "lavabo-compacto",
    label: "Lavabo Compacto",
    minWidthMm: 400,
    maxWidthMm: 700,
    recommendedWidthMm: 600,
    counterHeightMm: 500,
    depthMm: 350,
    required: ["gabinete-1-porta"],
    flexible: ["prateleira", "nicho-aberto"],
    sink: "apoio",
    install: "suspenso",
    mirror: "fixo",
    countertop: "porcelanato",
    technical: ["cuba", "sifao", "agua", "esgoto"],
    betweenWalls: false,
  },
  "banheiro-pequeno": {
    id: "banheiro-pequeno",
    label: "Banheiro Pequeno",
    minWidthMm: 700,
    maxWidthMm: 1000,
    recommendedWidthMm: 900,
    counterHeightMm: 550,
    depthMm: 460,
    required: ["gabinete-suspenso"],
    flexible: ["espelheira", "nicho-aberto"],
    sink: "embutir",
    install: "suspenso",
    mirror: "porta",
    countertop: "granito",
    technical: ["cuba", "sifao", "valvula", "agua", "esgoto"],
    betweenWalls: false,
  },
  "banheiro-padrao": {
    id: "banheiro-padrao",
    label: "Banheiro Padrão",
    minWidthMm: 1000,
    maxWidthMm: 1400,
    recommendedWidthMm: 1200,
    counterHeightMm: 550,
    depthMm: 500,
    required: ["cuba-deslocada"],
    flexible: ["nicho-aberto", "espelheira", "torre-lateral"],
    sink: "embutir",
    install: "suspenso",
    mirror: "porta",
    countertop: "quartzo",
    technical: ["cuba", "sifao", "valvula", "agua", "esgoto"],
    betweenWalls: false,
  },
  "banheiro-casal": {
    id: "banheiro-casal",
    label: "Banheiro Casal",
    minWidthMm: 1400,
    maxWidthMm: 2200,
    recommendedWidthMm: 1600,
    counterHeightMm: 550,
    depthMm: 520,
    required: ["cuba-dupla"],
    flexible: ["torre-lateral", "espelheira", "nicho-aberto"],
    sink: "dupla",
    install: "suspenso",
    mirror: "porta",
    countertop: "marmore",
    technical: ["cuba", "sifao", "valvula", "agua", "esgoto"],
    betweenWalls: false,
  },
  "bancada-cuba-dupla": {
    id: "bancada-cuba-dupla",
    label: "Bancada com Cuba Dupla",
    minWidthMm: 1500,
    maxWidthMm: 2400,
    recommendedWidthMm: 1800,
    counterHeightMm: 560,
    depthMm: 550,
    required: ["cuba-dupla"],
    flexible: ["gabinete-gavetas", "espelheira"],
    sink: "dupla",
    install: "suspenso",
    mirror: "fixo",
    countertop: "pedra-sinterizada",
    technical: ["cuba", "sifao", "agua", "esgoto"],
    betweenWalls: false,
  },
  "gabinete-suspenso": {
    id: "gabinete-suspenso",
    label: "Gabinete Suspenso",
    minWidthMm: 600,
    maxWidthMm: 1600,
    recommendedWidthMm: 1000,
    counterHeightMm: 550,
    depthMm: 460,
    required: ["gabinete-suspenso"],
    flexible: ["espelheira", "prateleira"],
    sink: "embutir",
    install: "suspenso",
    mirror: "fixo",
    countertop: "granito",
    technical: ["cuba", "sifao", "agua", "esgoto"],
    betweenWalls: false,
  },
  "gabinete-com-torre": {
    id: "gabinete-com-torre",
    label: "Gabinete com Torre",
    minWidthMm: 1200,
    maxWidthMm: 2400,
    recommendedWidthMm: 1600,
    counterHeightMm: 550,
    depthMm: 500,
    required: ["cuba-central", "torre-lateral"],
    flexible: ["espelheira", "nicho-aberto"],
    sink: "embutir",
    install: "suspenso",
    mirror: "porta",
    countertop: "quartzo",
    technical: ["cuba", "sifao", "agua", "esgoto"],
    betweenWalls: false,
  },
  "gabinete-entre-paredes": {
    id: "gabinete-entre-paredes",
    label: "Gabinete entre Paredes",
    minWidthMm: 600,
    maxWidthMm: 2400,
    recommendedWidthMm: 1100,
    counterHeightMm: 550,
    depthMm: 480,
    required: ["cuba-central"],
    flexible: ["gabinete-gavetas", "espelheira"],
    sink: "embutir",
    install: "suspenso",
    mirror: "fixo",
    countertop: "granito",
    technical: ["cuba", "sifao", "agua", "esgoto"],
    betweenWalls: true,
  },
};

export function listBathroomPresets(): readonly BathroomPreset[] {
  return Object.values(BATHROOM_PRESETS);
}

/** Preset automático a partir da largura disponível. */
export function pickBathroomPreset(widthMm: number, betweenWalls = false): BathroomPreset {
  if (betweenWalls) return BATHROOM_PRESETS["gabinete-entre-paredes"];
  if (widthMm < 700) return BATHROOM_PRESETS["lavabo-compacto"];
  if (widthMm < 1000) return BATHROOM_PRESETS["banheiro-pequeno"];
  if (widthMm < 1400) return BATHROOM_PRESETS["banheiro-padrao"];
  if (widthMm < 1800) return BATHROOM_PRESETS["banheiro-casal"];
  return BATHROOM_PRESETS["bancada-cuba-dupla"];
}

export function normalizePresetId(value: unknown): BathroomPresetId | null {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, "-");
  return k in BATHROOM_PRESETS ? (k as BathroomPresetId) : null;
}