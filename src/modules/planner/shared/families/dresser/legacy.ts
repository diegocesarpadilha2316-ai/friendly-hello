/**
 * COMPATIBILIDADE — gaveteiros antigos continuam abrindo.
 *
 * Gaveteiros salvos antes desta família guardam dimensões + `params`
 * soltos (`mod:drawers`, `eng:front`, `drawersCount`…). Aqui esse formato
 * é convertido EM MEMÓRIA para `DresserSpec`. Nada é regravado.
 */
import { normalizeDresserSpec, type DresserSpec } from "./spec";

type ParamValue = string | number | boolean | null | undefined;
export type LegacyDresserParams = Readonly<Record<string, ParamValue>>;

function pick(params: LegacyDresserParams, ...keys: string[]): ParamValue {
  for (const k of keys) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asNumber(v: ParamValue): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function asText(v: ParamValue): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export interface LegacyDresser {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly params?: LegacyDresserParams;
}

/** Subtipos do editor atendidos pela família gaveteiro. */
export const DRESSER_SUBTYPES = ["gaveteiro"] as const;

/** Converte o formato antigo na ficha nova. Nunca lança. */
export function dresserSpecFromLegacy(f: LegacyDresser): DresserSpec {
  const p = f.params ?? {};
  return normalizeDresserSpec({
    widthMm: f.widthMm,
    heightMm: f.heightMm,
    depthMm: f.depthMm,
    drawers: asNumber(pick(p, "mod:drawers", "drawers", "eng:drawers", "gavetas", "drawersCount")),
    distribution: asText(pick(p, "mod:drawerDistribution", "drawerDistribution")) as
      | DresserSpec["distribution"]
      | undefined,
    front: asText(pick(p, "mod:frontMount", "frontMount", "eng:front", "frontType")) as
      | DresserSpec["front"]
      | undefined,
    handle: asText(pick(p, "mod:handle", "handle", "puxador")),
    slide: asText(pick(p, "eng:slide", "slide", "corredica")) as DresserSpec["slide"] | undefined,
    opening: asText(pick(p, "mod:opening", "opening", "abertura")) as
      | DresserSpec["opening"]
      | undefined,
    base: asText(pick(p, "mod:base", "base", "apoio")) as DresserSpec["base"] | undefined,
    plinthHeightMm: asNumber(pick(p, "eng:plinthHeightMm", "plinthHeightMm")),
    topOverhangMm: asNumber(pick(p, "eng:topOverhangMm", "topOverhangMm")),
    style: asText(pick(p, "mod:style", "style", "estilo", "design:style")),
    finishId: asText(pick(p, "eng:finishId", "finishId", "color", "cor")),
    thicknessMm: asNumber(pick(p, "eng:thicknessMm", "thicknessMm")),
    backThicknessMm: asNumber(pick(p, "eng:backThicknessMm", "backThicknessMm")),
  });
}

/** Alteração cirúrgica: só os campos citados mudam. */
export function applyDresserPatch(current: DresserSpec, patch: Partial<DresserSpec>): DresserSpec {
  return normalizeDresserSpec({ ...current, ...patch });
}