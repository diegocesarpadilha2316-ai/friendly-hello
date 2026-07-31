/**
 * FICHA TÉCNICA DO GAVETEIRO (DresserSpec).
 *
 * Mesma filosofia da ficha do roupeiro: estrutura canônica em milímetros,
 * normalização que nunca lança e regras de marcenaria concentradas aqui.
 * Nenhuma geometria vive neste arquivo.
 */
export type DresserFront = "sobreposta" | "embutida";
export type DresserBase = "rodape" | "pes" | "suspenso";
export type DresserSlide = "telescopica" | "oculta-softclose" | "tandem" | "roldana";
export type DresserOpening = "softclose" | "push-to-open" | "simples";
export type DresserDistribution = "iguais" | "progressiva";

export interface DresserSpec {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  /** 1 a N gavetas empilhadas. */
  readonly drawers: number;
  /** Como as alturas das gavetas são distribuídas. */
  readonly distribution: DresserDistribution;
  /** Frente sobreposta (cobre a caixa) ou embutida (entre as laterais). */
  readonly front: DresserFront;
  readonly handle: string;
  readonly slide: DresserSlide;
  readonly opening: DresserOpening;
  /** Apoio do móvel: rodapé (batente recuado), pés ou suspenso. */
  readonly base: DresserBase;
  /** Altura do rodapé/batente. 0 quando suspenso. */
  readonly plinthHeightMm: number;
  /** Recuo do batente em relação à frente. */
  readonly plinthRecessMm: number;
  /** Tampo saliente (0 = alinhado com a caixa). */
  readonly topOverhangMm: number;
  readonly style: string;
  readonly finishId: string;
  readonly thicknessMm: number;
  readonly backThicknessMm: number;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  return Math.round(Math.min(max, Math.max(min, num(v, fallback))));
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, num(v, fallback)));
}

function text(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

export const DRESSER_DEFAULTS: DresserSpec = {
  widthMm: 600,
  heightMm: 900,
  depthMm: 500,
  drawers: 4,
  distribution: "iguais",
  front: "sobreposta",
  handle: "perfil-gola",
  slide: "oculta-softclose",
  opening: "softclose",
  base: "rodape",
  plinthHeightMm: 100,
  plinthRecessMm: 40,
  topOverhangMm: 0,
  style: "moderno",
  finishId: "branco-tx",
  thicknessMm: 18,
  backThicknessMm: 6,
};

function parseFront(v: unknown): DresserFront {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("embut") || k.includes("interna") || k.includes("inset")) return "embutida";
  return "sobreposta";
}

function parseBase(v: unknown, plinth: number | undefined): DresserBase {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("susp") || k.includes("flutu")) return "suspenso";
  if (k.includes("pe") && !k.includes("perfil")) return "pes";
  if (k.includes("rodap") || k.includes("batente")) return "rodape";
  return plinth === 0 ? "suspenso" : DRESSER_DEFAULTS.base;
}

function parseSlide(v: unknown): DresserSlide {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("tandem") || k.includes("legra")) return "tandem";
  if (k.includes("roldana")) return "roldana";
  if (k.includes("telesc")) return "telescopica";
  if (k.includes("oculta") || k.includes("soft")) return "oculta-softclose";
  return DRESSER_DEFAULTS.slide;
}

function parseOpening(v: unknown): DresserOpening {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("push") || k.includes("toque") || k.includes("tip")) return "push-to-open";
  if (k.includes("simples") || k.includes("comum")) return "simples";
  return DRESSER_DEFAULTS.opening;
}

function parseDistribution(v: unknown): DresserDistribution {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("progress") || k.includes("cresc") || k.includes("escalon")) return "progressiva";
  return "iguais";
}

/**
 * Normaliza a ficha do gaveteiro. Regras de marcenaria aplicadas aqui:
 *  - sempre existe pelo menos 1 gaveta (é o que define a família);
 *  - gaveteiro suspenso não tem rodapé;
 *  - o rodapé nunca passa de 1/4 da altura total.
 */
export function normalizeDresserSpec(input: Partial<DresserSpec> = {}): DresserSpec {
  const d = DRESSER_DEFAULTS;
  const widthMm = clampNum(input.widthMm, 200, 3000, d.widthMm);
  const heightMm = clampNum(input.heightMm, 200, 2600, d.heightMm);
  const depthMm = clampNum(input.depthMm, 200, 900, d.depthMm);

  const base = parseBase(input.base, input.plinthHeightMm);
  const plinthHeightMm =
    base === "rodape" ? clampNum(input.plinthHeightMm, 40, heightMm / 4, d.plinthHeightMm) : 0;

  // Cada gaveta precisa de ~90 mm úteis; o limite acompanha a altura real.
  const maxDrawers = Math.max(1, Math.min(12, Math.floor((heightMm - plinthHeightMm) / 90)));

  return {
    widthMm,
    heightMm,
    depthMm,
    drawers: clampInt(input.drawers, 1, maxDrawers, Math.min(d.drawers, maxDrawers)),
    distribution: parseDistribution(input.distribution),
    front: parseFront(input.front),
    handle: text(input.handle, d.handle),
    slide: parseSlide(input.slide),
    opening: parseOpening(input.opening),
    base,
    plinthHeightMm,
    plinthRecessMm: clampNum(input.plinthRecessMm, 0, 120, d.plinthRecessMm),
    topOverhangMm: clampNum(input.topOverhangMm, 0, 80, d.topOverhangMm),
    style: text(input.style, d.style),
    finishId: text(input.finishId, d.finishId),
    thicknessMm: clampNum(input.thicknessMm, 9, 30, d.thicknessMm),
    backThicknessMm: clampNum(input.backThicknessMm, 3, 18, d.backThicknessMm),
  };
}

/** Resumo humano da ficha (chat/auditoria). */
export function describeDresser(s: DresserSpec): string {
  const bits = [
    `${s.widthMm}×${s.heightMm}×${s.depthMm} mm`,
    `${s.drawers} gavetas`,
    `frente ${s.front}`,
    `corrediça ${s.slide}`,
  ];
  if (s.base === "rodape") bits.push(`batente ${s.plinthHeightMm} mm`);
  else bits.push(s.base === "pes" ? "sobre pés" : "suspenso");
  return bits.join(" · ");
}