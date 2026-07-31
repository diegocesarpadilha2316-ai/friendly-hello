/**
 * COMPATIBILIDADE — projetos antigos continuam abrindo.
 *
 * Roupeiros salvos antes desta família guardam apenas dimensões +
 * `params` soltos (`mod:doors`, `mod:opening`, `eng:front`, `doors`…).
 * Aqui esse formato é convertido EM MEMÓRIA para `WardrobeSpec`.
 * Nada é regravado no projeto e nenhuma migração é necessária.
 */
import { normalizeWardrobeSpec, type WardrobeSpec } from "./spec";

type ParamValue = string | number | boolean | null | undefined;
export type LegacyParams = Readonly<Record<string, ParamValue>>;

function pick(params: LegacyParams, ...keys: string[]): ParamValue {
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

function asBool(v: ParamValue): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1 || v === "1") return true;
  if (v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

function asText(v: ParamValue): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export interface LegacyFurniture {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly params?: LegacyParams;
}

/** Subtipos do editor atendidos pela família roupeiro. */
export const WARDROBE_SUBTYPES = ["roupeiro", "guarda-roupa"] as const;

// A identificação do subtipo vive em `detect.ts` (normaliza nomes antigos).

/**
 * Converte o formato antigo (dimensões + params soltos) na ficha nova.
 * Sempre devolve uma ficha válida — nunca lança.
 */
export function wardrobeSpecFromLegacy(f: LegacyFurniture): WardrobeSpec {
  const p = f.params ?? {};
  const front = asText(pick(p, "eng:front", "frontType"));
  const openingRaw = asText(pick(p, "mod:opening", "opening", "abertura"));
  const opening = front === "aberto" ? "sem-porta" : openingRaw;

  const mirrorHas = asBool(pick(p, "mod:mirror", "mirror", "espelho"));

  return normalizeWardrobeSpec({
    widthMm: f.widthMm,
    heightMm: f.heightMm,
    depthMm: f.depthMm,
    doors: asNumber(pick(p, "mod:doors", "doors", "eng:doors", "portas")),
    opening: opening as WardrobeSpec["opening"] | undefined,
    columns: asNumber(pick(p, "mod:divisions", "divisions", "colunas")),
    drawers: asNumber(pick(p, "mod:drawers", "drawers", "eng:drawers", "gavetas")),
    shelvesPerColumn: asNumber(pick(p, "mod:shelves", "shelves", "eng:shelves", "prateleiras")),
    hangers: asNumber(pick(p, "mod:cabideiros", "cabideiros", "hangers")),
    niches: asNumber(pick(p, "mod:nichos", "nichos", "niches")),
    maleiro: asBool(pick(p, "mod:maleiro", "maleiro")),
    maleiroHeightMm: asNumber(pick(p, "mod:maleiroHeight", "maleiroHeight")),
    mirror: mirrorHas
      ? {
          has: true,
          position:
            (asText(pick(p, "mod:mirrorPosition", "mirrorPosition")) as
              | WardrobeSpec["mirror"]["position"]
              | undefined) ?? "central",
        }
      : undefined,
    handle: asText(pick(p, "mod:handle", "handle", "puxador")),
    style: asText(pick(p, "mod:style", "style", "estilo", "design:style")),
    finishId: asText(pick(p, "eng:finishId", "finishId", "color", "cor")),
    thicknessMm: asNumber(pick(p, "eng:thicknessMm", "thicknessMm")),
    backThicknessMm: asNumber(pick(p, "eng:backThicknessMm", "backThicknessMm")),
    plinthHeightMm: asNumber(pick(p, "eng:plinthHeightMm", "plinthHeightMm")),
  });
}

/**
 * Aplica uma alteração cirúrgica sobre a ficha: só os campos citados mudam,
 * todo o restante do roupeiro é preservado.
 */
export function applyWardrobePatch(
  current: WardrobeSpec,
  patch: Partial<WardrobeSpec>,
): WardrobeSpec {
  const merged: { -readonly [K in keyof WardrobeSpec]?: WardrobeSpec[K] } = {
    ...current,
    ...patch,
  };
  // Colunas derivadas: se o usuário mudou o nº de portas de abrir sem falar
  // de colunas, as colunas acompanham as portas (comportamento de marcenaria).
  if (
    patch.doors !== undefined &&
    patch.columns === undefined &&
    (merged.opening ?? current.opening) === "abrir" &&
    current.columns === current.doors
  ) {
    merged.columns = 0;
  }
  return normalizeWardrobeSpec(merged);
}
