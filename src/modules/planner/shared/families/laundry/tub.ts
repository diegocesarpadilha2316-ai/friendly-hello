/**
 * TANQUE (LAVANDERIA) — VOLUMES HIDRÁULICOS.
 *
 * A infraestrutura hidráulica do BANHEIRO é reaproveitada integralmente:
 * as contas de folga, ajuste e largura mínima vêm de `bathroom/sink` através
 * de um adaptador. Nada é reimplementado — o tanque apenas declara suas
 * medidas típicas.
 */
import {
  minWidthForSinkMm,
  sinkCentersMm,
  sinkFit,
  SINK_STRUCTURAL_CLEARANCE_MM,
  type BathroomSink,
  type SinkFit,
} from "../bathroom/sink";

export type TubType =
  "nenhum" | "embutido" | "sobrepor" | "esculpido" | "independente" | "com-gabinete" | "compacto";

export type TubPosition = "central" | "esquerda" | "direita";

export interface TubProfileDef {
  readonly id: TubType;
  readonly label: string;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  /** Quanto o tanque desce abaixo do tampo (mm). */
  readonly dropMm: number;
  readonly cutout: boolean;
  readonly capacityL: number;
}

export const TUBS: Readonly<Record<TubType, TubProfileDef>> = {
  nenhum: {
    id: "nenhum",
    label: "Sem tanque",
    widthMm: 0,
    depthMm: 0,
    heightMm: 0,
    dropMm: 0,
    cutout: false,
    capacityL: 0,
  },
  embutido: {
    id: "embutido",
    label: "Tanque embutido",
    widthMm: 520,
    depthMm: 460,
    heightMm: 300,
    dropMm: 300,
    cutout: true,
    capacityL: 22,
  },
  sobrepor: {
    id: "sobrepor",
    label: "Tanque de sobrepor",
    widthMm: 550,
    depthMm: 470,
    heightMm: 300,
    dropMm: 120,
    cutout: true,
    capacityL: 24,
  },
  esculpido: {
    id: "esculpido",
    label: "Tanque esculpido",
    widthMm: 600,
    depthMm: 500,
    heightMm: 250,
    dropMm: 250,
    cutout: true,
    capacityL: 26,
  },
  independente: {
    id: "independente",
    label: "Tanque independente",
    widthMm: 550,
    depthMm: 500,
    heightMm: 900,
    dropMm: 0,
    cutout: false,
    capacityL: 22,
  },
  "com-gabinete": {
    id: "com-gabinete",
    label: "Tanque com gabinete",
    widthMm: 560,
    depthMm: 480,
    heightMm: 320,
    dropMm: 320,
    cutout: true,
    capacityL: 24,
  },
  compacto: {
    id: "compacto",
    label: "Tanque compacto",
    widthMm: 400,
    depthMm: 380,
    heightMm: 240,
    dropMm: 240,
    cutout: true,
    capacityL: 14,
  },
};

export interface LaundryTub {
  readonly type: TubType;
  readonly position: TubPosition;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  /** Deslocamento explícito do centro do tanque (mm da esquerda). */
  readonly xMm?: number;
  /** Recuo em relação à frente do tampo (mm). */
  readonly zMm: number;
  readonly cutoutWidthMm: number;
  readonly cutoutDepthMm: number;
  readonly faucetCutout: boolean;
  /** Lado da área reservada ao sifão (mm). */
  readonly siphonMm: number;
  /** Altura da reserva hidráulica abaixo do tanque (mm). */
  readonly hydraulicHeightMm: number;
  readonly capacityL: number;
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

export function normalizeTubType(value: unknown): TubType {
  const k = slug(value);
  if (k in TUBS) return k as TubType;
  if (/compact|pequeno|mini/.test(k)) return "compacto";
  if (/gabinete|com-armario/.test(k)) return "com-gabinete";
  if (/independent|avulso|coluna|com-pe/.test(k)) return "independente";
  if (/esculpid|integrad/.test(k)) return "esculpido";
  if (/sobrepor|sobrepost/.test(k)) return "sobrepor";
  if (/embutid|embutir|undermount|tanque/.test(k)) return "embutido";
  if (/sem|nenhum|none/.test(k)) return "nenhum";
  return "nenhum";
}

export function normalizeTubPosition(value: unknown): TubPosition {
  const k = slug(value);
  if (/esquerd|left/.test(k)) return "esquerda";
  if (/direit|right/.test(k)) return "direita";
  return "central";
}

export function normalizeTub(
  input: Partial<LaundryTub> | undefined,
  enabled = true,
  limits?: { readonly maxWidthMm?: number; readonly maxDepthMm?: number },
): LaundryTub {
  const type = enabled ? normalizeTubType(input?.type) : "nenhum";
  const def = TUBS[type];
  const off = type === "nenhum";
  /* O tanque padrão se adapta ao módulo; a medida EXPLÍCITA é preservada
   * como pedida (e reprovada depois pelo validador, se não couber). */
  const defW =
    typeof limits?.maxWidthMm === "number"
      ? Math.min(def.widthMm, Math.max(300, Math.floor(limits.maxWidthMm)))
      : def.widthMm;
  const defD =
    typeof limits?.maxDepthMm === "number"
      ? Math.min(def.depthMm, Math.max(300, Math.floor(limits.maxDepthMm)))
      : def.depthMm;
  const width = off ? 0 : clampNum(input?.widthMm, defW, 300, 900);
  const depth = off ? 0 : clampNum(input?.depthMm, defD, 300, 700);
  return {
    type,
    position: normalizeTubPosition(input?.position),
    widthMm: width,
    depthMm: depth,
    heightMm: off ? 0 : clampNum(input?.heightMm, def.heightMm, 120, 1000),
    xMm:
      typeof input?.xMm === "number" && Number.isFinite(input.xMm)
        ? Math.round(input.xMm)
        : undefined,
    zMm: off ? 0 : clampNum(input?.zMm, 60, 0, 400),
    cutoutWidthMm: def.cutout
      ? clampNum(input?.cutoutWidthMm, Math.max(200, width - 60), 150, 900)
      : 0,
    cutoutDepthMm: def.cutout
      ? clampNum(input?.cutoutDepthMm, Math.max(200, depth - 60), 150, 700)
      : 0,
    faucetCutout: input?.faucetCutout ?? !off,
    siphonMm: off ? 0 : clampNum(input?.siphonMm, 240, 120, 400),
    hydraulicHeightMm: off
      ? 0
      : clampNum(input?.hydraulicHeightMm, Math.max(300, def.dropMm + 180), 150, 900),
    capacityL: off ? 0 : clampNum(input?.capacityL, def.capacityL, 0, 80),
  };
}

/**
 * ADAPTADOR: o tanque visto como cuba de banheiro. É assim que toda a
 * infraestrutura hidráulica já validada é reaproveitada sem duplicação.
 */
export function tubAsSink(tub: LaundryTub): BathroomSink {
  const type =
    tub.type === "nenhum"
      ? "nenhuma"
      : tub.type === "sobrepor"
        ? "sobrepor"
        : tub.type === "esculpido"
          ? "esculpida"
          : tub.type === "independente" || tub.type === "compacto"
            ? "apoio"
            : "embutir";
  return {
    type,
    position: tub.position === "central" ? "central" : tub.position,
    widthMm: tub.widthMm,
    depthMm: tub.depthMm,
    heightMm: tub.heightMm,
    xMm: tub.xMm,
    zMm: tub.zMm,
    cutoutWidthMm: tub.cutoutWidthMm,
    cutoutDepthMm: tub.cutoutDepthMm,
    faucetCutout: tub.faucetCutout,
    siphonMm: tub.siphonMm,
    hydraulicHeightMm: tub.hydraulicHeightMm,
  };
}

/** Quanto o tanque desce abaixo do tampo (mm). */
export function tubDropMm(tub: LaundryTub): number {
  return TUBS[tub.type].dropMm;
}

export function tubCentersMm(tub: LaundryTub, widthMm: number): readonly number[] {
  return sinkCentersMm(tubAsSink(tub), widthMm);
}

export function tubFit(input: {
  readonly widthMm: number;
  readonly thicknessMm: number;
  readonly tub: LaundryTub;
  readonly countertopOverhangSideMm?: number;
  readonly clearanceMm?: number;
  readonly topDepthMm?: number;
}): SinkFit {
  return sinkFit({
    widthMm: input.widthMm,
    thicknessMm: input.thicknessMm,
    sink: tubAsSink(input.tub),
    countertopOverhangSideMm: input.countertopOverhangSideMm,
    clearanceMm: input.clearanceMm,
    topDepthMm: input.topDepthMm,
  });
}

export function minWidthForTubMm(
  tub: LaundryTub,
  thicknessMm = 18,
  clearanceMm = SINK_STRUCTURAL_CLEARANCE_MM,
): number {
  return minWidthForSinkMm(tubAsSink(tub), thicknessMm, clearanceMm);
}

export function listTubs(): readonly TubProfileDef[] {
  return Object.values(TUBS).filter((t) => t.id !== "nenhum");
}

export const TUB_STRUCTURAL_CLEARANCE_MM = SINK_STRUCTURAL_CLEARANCE_MM;
