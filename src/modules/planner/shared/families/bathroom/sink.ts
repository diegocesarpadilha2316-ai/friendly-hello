/**
 * CUBAS E VOLUMES HIDRÁULICOS — banheiro.
 *
 * A cuba não é marcenaria: ela é um VOLUME TÉCNICO. O que interessa aqui é
 * a reserva que nenhuma gaveta, prateleira, divisória ou fundo pode invadir
 * (cuba, sifão, válvula, tubulação, entrada de água e saída de esgoto).
 * O desenho realista da louça vem depois — o volume é que precisa estar certo.
 */

export type SinkType =
  | "apoio"
  | "embutir"
  | "sobrepor"
  | "esculpida"
  | "dupla"
  | "nenhuma";

export type SinkPosition = "central" | "esquerda" | "direita" | "dupla";

export interface BathroomSink {
  readonly type: SinkType;
  readonly position: SinkPosition;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  /** Deslocamento explícito do centro da cuba (mm a partir da esquerda). */
  readonly xMm?: number;
  /** Recuo da cuba em relação à frente do tampo (mm). */
  readonly zMm: number;
  /** Recorte no tampo (mm) — 0 quando a cuba é de apoio. */
  readonly cutoutWidthMm: number;
  readonly cutoutDepthMm: number;
  /** Recorte da torneira no tampo. */
  readonly faucetCutout: boolean;
  /** Diâmetro/lado da área do sifão (mm). */
  readonly siphonMm: number;
  /** Reserva hidráulica abaixo da cuba (mm de altura). */
  readonly hydraulicHeightMm: number;
}

export interface SinkProfileDef {
  readonly id: SinkType;
  readonly label: string;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  /** Quanto a cuba desce abaixo do tampo (mm). */
  readonly dropMm: number;
  readonly cutout: boolean;
}

export const SINKS: Readonly<Record<SinkType, SinkProfileDef>> = {
  apoio: { id: "apoio", label: "Cuba de apoio", widthMm: 420, depthMm: 380, heightMm: 130, dropMm: 0, cutout: false },
  embutir: { id: "embutir", label: "Cuba de embutir", widthMm: 460, depthMm: 380, heightMm: 160, dropMm: 160, cutout: true },
  sobrepor: { id: "sobrepor", label: "Cuba de sobrepor", widthMm: 500, depthMm: 400, heightMm: 150, dropMm: 60, cutout: true },
  esculpida: { id: "esculpida", label: "Cuba esculpida", widthMm: 600, depthMm: 400, heightMm: 110, dropMm: 110, cutout: true },
  dupla: { id: "dupla", label: "Cuba dupla", widthMm: 420, depthMm: 380, heightMm: 150, dropMm: 150, cutout: true },
  nenhuma: { id: "nenhuma", label: "Sem cuba", widthMm: 0, depthMm: 0, heightMm: 0, dropMm: 0, cutout: false },
};

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function normalizeSinkType(value: unknown): SinkType {
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (k in SINKS) return k as SinkType;
  if (/dupla|duas|double/.test(k)) return "dupla";
  if (/esculpid|integrad/.test(k)) return "esculpida";
  if (/sobrepor|sobrepost|bowl/.test(k)) return "sobrepor";
  if (/embutir|embutid|undermount/.test(k)) return "embutir";
  if (/apoio|apoiada/.test(k)) return "apoio";
  if (/sem|nenhum|none/.test(k)) return "nenhuma";
  return "apoio";
}

export function normalizeSinkPosition(value: unknown, type: SinkType): SinkPosition {
  if (type === "dupla") return "dupla";
  const k = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/esquerd|left/.test(k)) return "esquerda";
  if (/direit|right/.test(k)) return "direita";
  if (/dupla|double/.test(k)) return "dupla";
  return "central";
}

export function normalizeSink(
  input: Partial<BathroomSink> | undefined,
  enabled = true,
  limits?: { readonly maxWidthMm?: number; readonly maxDepthMm?: number },
): BathroomSink {
  const type = enabled ? normalizeSinkType(input?.type) : "nenhuma";
  const def = SINKS[type];
  /* O padrão da louça se adapta ao módulo; a medida EXPLÍCITA é respeitada
   * como pedida (e depois reprovada pelo validador se não couber). */
  const defW =
    typeof limits?.maxWidthMm === "number"
      ? Math.min(def.widthMm, Math.max(200, Math.floor(limits.maxWidthMm)))
      : def.widthMm;
  const defD =
    typeof limits?.maxDepthMm === "number"
      ? Math.min(def.depthMm, Math.max(200, Math.floor(limits.maxDepthMm)))
      : def.depthMm;
  const width = type === "nenhuma" ? 0 : clampNum(input?.widthMm, defW, 200, 900);
  const depth = type === "nenhuma" ? 0 : clampNum(input?.depthMm, defD, 200, 700);
  return {
    type,
    position: normalizeSinkPosition(input?.position, type),
    widthMm: width,
    depthMm: depth,
    heightMm: type === "nenhuma" ? 0 : clampNum(input?.heightMm, def.heightMm, 60, 400),
    xMm: typeof input?.xMm === "number" && Number.isFinite(input.xMm) ? Math.round(input.xMm) : undefined,
    zMm: type === "nenhuma" ? 0 : clampNum(input?.zMm, 60, 0, 400),
    cutoutWidthMm: def.cutout ? clampNum(input?.cutoutWidthMm, Math.max(120, width - 60), 100, 900) : 0,
    cutoutDepthMm: def.cutout ? clampNum(input?.cutoutDepthMm, Math.max(120, depth - 60), 100, 700) : 0,
    faucetCutout: input?.faucetCutout ?? type !== "nenhuma",
    siphonMm: type === "nenhuma" ? 0 : clampNum(input?.siphonMm, 220, 120, 400),
    hydraulicHeightMm:
      type === "nenhuma" ? 0 : clampNum(input?.hydraulicHeightMm, Math.max(260, def.dropMm + 200), 150, 800),
  };
}

/** Centros da(s) cuba(s) dentro de um módulo de largura `widthMm`. */
export function sinkCentersMm(sink: BathroomSink, widthMm: number): readonly number[] {
  if (sink.type === "nenhuma") return [];
  if (sink.position === "dupla") {
    return [Math.round(widthMm * 0.27), Math.round(widthMm * 0.73)];
  }
  if (typeof sink.xMm === "number") return [Math.min(widthMm, Math.max(0, sink.xMm))];
  if (sink.position === "esquerda") return [Math.round(widthMm * 0.3)];
  if (sink.position === "direita") return [Math.round(widthMm * 0.7)];
  return [Math.round(widthMm / 2)];
}

export function listSinks(): readonly SinkProfileDef[] {
  return Object.values(SINKS).filter((s) => s.id !== "nenhuma");
}

/* ─────────────────────── compatibilidade cuba × gabinete ─────────────────
 * A cuba NUNCA é comparada com a largura externa do gabinete e a folga
 * NUNCA é aplicada duas vezes. Tudo passa por estas quatro medidas.
 * ───────────────────────────────────────────────────────────────────────── */

/** Margem técnica mínima entre a cuba e cada lateral/divisória (mm). */
export const SINK_STRUCTURAL_CLEARANCE_MM = 20;

export interface SinkFitInput {
  readonly widthMm: number;
  readonly thicknessMm: number;
  readonly sink: BathroomSink;
  /** Balanço lateral do tampo (mm por lado). */
  readonly countertopOverhangSideMm?: number;
  readonly clearanceMm?: number;
  /** Profundidade útil do tampo (mm). */
  readonly topDepthMm?: number;
}

export interface SinkFit {
  /** Largura interna útil da caixa (externa − 2 × espessura). */
  readonly cabinetInnerWidthMm: number;
  readonly sinkCount: number;
  readonly sinkWidthMm: number;
  readonly sinkCutoutWidthMm: number;
  /** Folga exigida por lado/entre cubas (mm). */
  readonly requiredSideClearanceMm: number;
  /** Largura de cuba realmente disponível depois das folgas. */
  readonly usableSinkWidthMm: number;
  /** Largura total exigida pelas cubas + folgas. */
  readonly requiredWidthMm: number;
  /** Largura do tampo (externa + balanços). */
  readonly topWidthMm: number;
  readonly requiredCutoutWidthMm: number;
  /** A louça, sozinha, cabe na largura interna? */
  readonly sinkFitsCabinet: boolean;
  /** Cabe com as folgas técnicas? */
  readonly clearanceOk: boolean;
  /** O recorte cabe no tampo? */
  readonly cutoutFitsTop: boolean;
  readonly depthOk: boolean;
}

export function sinkFit(input: SinkFitInput): SinkFit {
  const s = input.sink;
  const clearance = Math.max(0, input.clearanceMm ?? SINK_STRUCTURAL_CLEARANCE_MM);
  const inner = Math.max(0, input.widthMm - 2 * input.thicknessMm);
  const count = s.type === "nenhuma" ? 0 : s.position === "dupla" ? 2 : 1;
  const gaps = count > 0 ? count + 1 : 0;
  const required = count * s.widthMm + gaps * clearance;
  const usable = Math.max(0, inner - gaps * clearance);
  const topWidth = input.widthMm + 2 * (input.countertopOverhangSideMm ?? 0);
  const requiredCutout = count * s.cutoutWidthMm + gaps * clearance;
  const topDepth = input.topDepthMm ?? 0;
  return {
    cabinetInnerWidthMm: inner,
    sinkCount: count,
    sinkWidthMm: s.widthMm,
    sinkCutoutWidthMm: s.cutoutWidthMm,
    requiredSideClearanceMm: clearance,
    usableSinkWidthMm: usable,
    requiredWidthMm: required,
    topWidthMm: topWidth,
    requiredCutoutWidthMm: requiredCutout,
    sinkFitsCabinet: count === 0 || count * s.widthMm <= inner,
    clearanceOk: count === 0 || required <= inner,
    cutoutFitsTop: count === 0 || s.cutoutWidthMm === 0 || requiredCutout <= topWidth,
    depthOk: count === 0 || topDepth <= 0 || s.depthMm <= topDepth,
  };
}

/** Largura interna mínima para acomodar a(s) cuba(s) desta ficha. */
export function minWidthForSinkMm(
  sink: BathroomSink,
  thicknessMm = 18,
  clearanceMm = SINK_STRUCTURAL_CLEARANCE_MM,
): number {
  if (sink.type === "nenhuma") return 0;
  const count = sink.position === "dupla" ? 2 : 1;
  return Math.ceil(count * sink.widthMm + (count + 1) * clearanceMm + 2 * thicknessMm);
}