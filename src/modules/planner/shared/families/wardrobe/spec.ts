/**
 * FICHA TÉCNICA DO ROUPEIRO (WardrobeSpec).
 *
 * Estrutura canônica em milímetros. Toda entrada — IA, inspetor, projeto
 * antigo — é convertida para esta ficha ANTES de qualquer montagem.
 * A normalização nunca lança: corrige e registra a suposição.
 */
import type { InteriorPlan } from "../../interior";

export type WardrobeOpening = "abrir" | "correr" | "sem-porta";
export type WardrobeMirrorPosition = "central" | "todas" | "lateral" | "interna";

/**
 * Configuração do interior paramétrico. Tudo é OPCIONAL: projetos antigos
 * continuam sem este campo e seguem pela conversão dos params legados.
 */
export interface WardrobeInteriorConfig {
  /** Layout interno explícito (edição manual / IA). Prioridade máxima. */
  readonly plan?: InteriorPlan;
  /** Preset escolhido pelo usuário. */
  readonly presetId?: string;
  /** "preset" força o preset mesmo havendo params legados. */
  readonly mode?: "auto" | "legado" | "preset";
}

export interface WardrobeSpec {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  /** 0 quando `opening` é "sem-porta". */
  readonly doors: number;
  readonly opening: WardrobeOpening;
  /** Colunas internas (divisórias verticais = colunas - 1). */
  readonly columns: number;
  /** Gavetas internas (empilhadas na coluna designada). */
  readonly drawers: number;
  /** Índice (0-based) da coluna que recebe o gaveteiro. */
  readonly drawerColumn: number;
  /** Prateleiras por coluna (fora da coluna do gaveteiro). */
  readonly shelvesPerColumn: number;
  /** Nº de cabideiros no móvel inteiro. */
  readonly hangers: number;
  /** Nº de nichos abertos. */
  readonly niches: number;
  readonly maleiro: boolean;
  readonly maleiroHeightMm: number;
  readonly mirror: { readonly has: boolean; readonly position: WardrobeMirrorPosition };
  readonly handle: string;
  readonly style: string;
  readonly finishId: string;
  readonly plinthHeightMm: number;
  readonly thicknessMm: number;
  readonly backThicknessMm: number;
  /** Interior paramétrico (opcional). */
  readonly interior?: WardrobeInteriorConfig;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = num(v, fallback);
  return Math.round(Math.min(max, Math.max(min, n)));
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = num(v, fallback);
  return Math.min(max, Math.max(min, n));
}

function text(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

export const WARDROBE_DEFAULTS: WardrobeSpec = {
  widthMm: 1800,
  heightMm: 2400,
  depthMm: 600,
  doors: 3,
  opening: "abrir",
  columns: 0, // 0 = derivar da largura/portas
  drawers: 0,
  drawerColumn: -1, // -1 = coluna central
  shelvesPerColumn: 2,
  hangers: 1,
  niches: 0,
  maleiro: false,
  maleiroHeightMm: 400,
  mirror: { has: false, position: "central" },
  handle: "perfil-gola",
  style: "moderno",
  finishId: "branco-tx",
  plinthHeightMm: 100,
  thicknessMm: 18,
  backThicknessMm: 6,
};

function parseOpening(v: unknown, doors: number): WardrobeOpening {
  const k = typeof v === "string" ? v.toLowerCase() : "";
  if (k.includes("correr") || k.includes("desliz")) return "correr";
  if (k.includes("sem") || k.includes("aberto") || k.includes("closet")) return "sem-porta";
  if (k.includes("abrir") || k.includes("batente")) return "abrir";
  return doors === 0 ? "sem-porta" : WARDROBE_DEFAULTS.opening;
}

function parseMirror(v: Partial<WardrobeSpec>["mirror"]): WardrobeSpec["mirror"] {
  if (!v || typeof v !== "object" || v.has !== true) return { has: false, position: "central" };
  const p = v.position;
  const ok: WardrobeMirrorPosition[] = ["central", "todas", "lateral", "interna"];
  return { has: true, position: ok.includes(p as WardrobeMirrorPosition) ? p! : "central" };
}

/**
 * Normaliza a ficha. Regras de marcenaria aplicadas aqui (e só aqui):
 *  - porta de correr exige no mínimo 2 folhas;
 *  - roupeiro sem portas zera a contagem de folhas;
 *  - colunas derivam das portas (abrir) ou de ~900 mm de vão (correr/aberto);
 *  - maleiro nunca consome mais do que 1/3 da altura total.
 */
export function normalizeWardrobeSpec(input: Partial<WardrobeSpec> = {}): WardrobeSpec {
  const d = WARDROBE_DEFAULTS;
  const widthMm = clampNum(input.widthMm, 600, 6000, d.widthMm);
  const heightMm = clampNum(input.heightMm, 1200, 3000, d.heightMm);
  const depthMm = clampNum(input.depthMm, 300, 900, d.depthMm);

  let doors = clampInt(input.doors, 0, 6, d.doors);
  const opening = parseOpening(input.opening, doors);
  if (opening === "sem-porta") doors = 0;
  else if (doors < 2 && opening === "correr") doors = 2;
  else if (doors < 1) doors = 1;

  const autoColumns =
    opening === "abrir" ? Math.max(1, doors) : Math.min(6, Math.max(1, Math.round(widthMm / 900)));
  const columns = input.columns && input.columns > 0 ? clampInt(input.columns, 1, 8, autoColumns) : autoColumns;

  const drawers = clampInt(input.drawers, 0, 8, d.drawers);
  const rawDrawerColumn = num(input.drawerColumn, d.drawerColumn);
  const drawerColumn =
    rawDrawerColumn >= 0 ? Math.min(columns - 1, Math.round(rawDrawerColumn)) : Math.floor((columns - 1) / 2);

  const maleiro = input.maleiro === true;
  const maleiroHeightMm = maleiro
    ? clampNum(input.maleiroHeightMm, 250, heightMm / 3, d.maleiroHeightMm)
    : 0;

  return {
    widthMm,
    heightMm,
    depthMm,
    doors,
    opening,
    columns,
    drawers,
    drawerColumn,
    shelvesPerColumn: clampInt(input.shelvesPerColumn, 0, 10, d.shelvesPerColumn),
    hangers: clampInt(input.hangers, 0, 8, d.hangers),
    niches: clampInt(input.niches, 0, 6, d.niches),
    maleiro,
    maleiroHeightMm,
    mirror: parseMirror(input.mirror),
    handle: text(input.handle, d.handle),
    style: text(input.style, d.style),
    finishId: text(input.finishId, d.finishId),
    plinthHeightMm: clampNum(input.plinthHeightMm, 0, 250, d.plinthHeightMm),
    thicknessMm: clampNum(input.thicknessMm, 9, 30, d.thicknessMm),
    backThicknessMm: clampNum(input.backThicknessMm, 3, 18, d.backThicknessMm),
  };
}

/** Resumo humano da ficha (chat/auditoria). */
export function describeWardrobe(s: WardrobeSpec): string {
  const bits = [
    `${s.widthMm}×${s.heightMm}×${s.depthMm} mm`,
    s.opening === "sem-porta" ? "sem portas" : `${s.doors} portas de ${s.opening}`,
    `${s.columns} colunas`,
  ];
  if (s.maleiro) bits.push("maleiro");
  if (s.drawers > 0) bits.push(`${s.drawers} gavetas`);
  if (s.hangers > 0) bits.push(`${s.hangers} cabideiros`);
  if (s.niches > 0) bits.push(`${s.niches} nichos`);
  if (s.mirror.has) bits.push(`espelho ${s.mirror.position}`);
  return bits.join(" · ");
}
