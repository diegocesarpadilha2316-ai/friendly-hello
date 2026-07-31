/**
 * LAYOUT ENGINE — BANHEIRO.
 *
 * Distribui os módulos numa bancada respeitando prioridade:
 *   1. configuração explícita (modules[]);
 *   2. configuração manual legada;
 *   3. preset selecionado;
 *   4. composição entre paredes;
 *   5. preset automático;
 *   6. fallback mínimo seguro.
 *
 * Nunca sobrescreve configuração manual existente. Sobra só vira tapa-vão
 * real quando o vão é entre paredes ou quando pedido explicitamente.
 */
import { makeFiller, type FillerPiece } from "../filler";
import {
  BATHROOM_PRESETS,
  normalizePresetId,
  pickBathroomPreset,
  type BathroomPreset,
  type BathroomPresetId,
} from "./presets";
import {
  BATHROOM_MODULE_PROFILES,
  bathroomMinWidthMm,
  normalizeBathroomKind,
  type BathroomModuleInput,
  type BathroomModuleKind,
} from "./spec";

export type BathroomLayoutSource =
  | "explicito"
  | "legado"
  | "preset"
  | "entre-paredes"
  | "preset-automatico"
  | "fallback";

export interface BathroomPlacement {
  readonly id: string;
  readonly kind: BathroomModuleKind;
  /** Posição X (mm) a partir da esquerda da composição. */
  readonly xMm: number;
  readonly widthMm: number;
  readonly module: BathroomModuleInput;
}

export interface BathroomLayoutInput {
  /** Largura total disponível na parede (mm). */
  readonly widthMm: number;
  readonly heightMm?: number;
  readonly depthMm?: number;
  /** Configuração explícita — vence tudo. */
  readonly modules?: readonly BathroomModuleInput[];
  /** Configuração manual legada já persistida no projeto. */
  readonly legacyModules?: readonly BathroomModuleInput[];
  readonly preset?: string;
  readonly betweenWalls?: boolean;
  /** Emitir tapa-vão real para a sobra. */
  readonly fillGaps?: boolean;
  readonly finishId?: string;
  readonly install?: string;
}

export interface BathroomLayoutResult {
  readonly source: BathroomLayoutSource;
  readonly preset: BathroomPreset | null;
  readonly widthMm: number;
  readonly placements: readonly BathroomPlacement[];
  /** Peças reais de tapa-vão (nunca "sobra virou número"). */
  readonly fillers: readonly FillerPiece[];
  readonly leftoverMm: number;
  readonly warnings: readonly string[];
}

const MIN_MODULE_MM = 300;
/** Vão técnico reservado por parede quando a composição é entre paredes. */
const WALL_GAP_MM = 18;

function place(
  modules: readonly BathroomModuleInput[],
  totalWidth: number,
  defaults: { heightMm?: number; depthMm?: number; finishId?: string; install?: string },
): { placements: BathroomPlacement[]; leftover: number; warnings: string[] } {
  const placements: BathroomPlacement[] = [];
  const warnings: string[] = [];
  let x = 0;

  modules.forEach((m, i) => {
    const kind = normalizeBathroomKind(m.kind);
    const p = BATHROOM_MODULE_PROFILES[kind];
    const wanted = m.widthMm ?? p.defaultWidthMm;
    const available = totalWidth - x;
    // Mínimo REAL: perfil e, quando há cuba, a largura que a louça exige.
    const minWidthMm = bathroomMinWidthMm({ ...m, kind });
    if (available < Math.min(minWidthMm, MIN_MODULE_MM)) {
      warnings.push(`módulo ${kind} descartado: sem espaço restante`);
      return;
    }
    const widthMm = Math.min(wanted, available);
    if (widthMm < minWidthMm) {
      warnings.push(
        `módulo ${kind} descartado: ${Math.round(widthMm)} mm < mínimo ${minWidthMm} mm`,
      );
      return;
    }
    placements.push({
      id: `${kind}-${i + 1}`,
      kind,
      xMm: Math.round(x),
      widthMm: Math.round(widthMm),
      module: {
        heightMm: defaults.heightMm,
        depthMm: defaults.depthMm,
        finishId: defaults.finishId,
        install: defaults.install as BathroomModuleInput["install"],
        ...m,
        kind,
        widthMm: Math.round(widthMm),
      },
    });
    x += widthMm;
  });

  return { placements, leftover: Math.max(0, Math.round(totalWidth - x)), warnings };
}

function modulesFromPreset(preset: BathroomPreset, widthMm: number): BathroomModuleInput[] {
  const required = preset.required;
  const out: BathroomModuleInput[] = [];
  // A torre, quando exigida, tem largura fixa e o restante vai para a bancada.
  const towerWidth = required.includes("torre-lateral")
    ? BATHROOM_MODULE_PROFILES["torre-lateral"].defaultWidthMm
    : 0;
  /* A bancada nunca passa do máximo do preset nem do máximo do perfil do
   * módulo: a sobra real fica para o tapa-vão, em vez de virar um módulo
   * gigante fora de fabricação. */
  const benchKind = required.find((k) => k !== "torre-lateral");
  const profileMax = benchKind ? BATHROOM_MODULE_PROFILES[benchKind].maxWidthMm : Infinity;
  const benchWidth = Math.max(
    MIN_MODULE_MM,
    Math.min(widthMm - towerWidth, preset.maxWidthMm, profileMax),
  );

  for (const kind of required) {
    if (kind === "torre-lateral") continue;
    out.push({
      kind,
      widthMm: benchWidth,
      install: preset.install,
      mirror: preset.mirror,
      sink: { type: preset.sink },
      countertop: { material: preset.countertop as never },
    });
  }
  if (towerWidth > 0) {
    out.push({ kind: "torre-lateral", widthMm: towerWidth, install: "piso" });
  }
  return out;
}

/** Resolve a composição do banheiro. Puro e determinístico. */
export function planBathroomLayout(input: BathroomLayoutInput): BathroomLayoutResult {
  const widthMm = Math.max(MIN_MODULE_MM, Math.round(input.widthMm || 900));
  const betweenWalls = input.betweenWalls ?? false;
  const wantsBetweenWalls =
    betweenWalls || (normalizePresetId(input.preset) !== null && !input.modules && !input.legacyModules
      ? BATHROOM_PRESETS[normalizePresetId(input.preset)!].betweenWalls
      : false);
  const warnings: string[] = [];

  let source: BathroomLayoutSource;
  let preset: BathroomPreset | null = null;
  let modules: readonly BathroomModuleInput[];

  const presetId: BathroomPresetId | null = normalizePresetId(input.preset);
  /** Entre paredes, a composição gerada nasce menor para caber o tapa-vão real. */
  const generatedWidthMm = wantsBetweenWalls
    ? Math.max(MIN_MODULE_MM, widthMm - 2 * WALL_GAP_MM)
    : widthMm;

  if (input.modules && input.modules.length > 0) {
    source = "explicito";
    modules = input.modules;
    if (presetId) preset = BATHROOM_PRESETS[presetId];
  } else if (input.legacyModules && input.legacyModules.length > 0) {
    // Nunca sobrescrever configuração manual já existente.
    source = "legado";
    modules = input.legacyModules;
  } else if (presetId) {
    preset = BATHROOM_PRESETS[presetId];
    /* Composição gerada para um vão fechado é, por definição, entre paredes —
     * a origem precisa registrar isso mesmo quando o preset foi escolhido. */
    source = betweenWalls || preset.betweenWalls ? "entre-paredes" : "preset";
    modules = modulesFromPreset(preset, generatedWidthMm);
  } else if (betweenWalls) {
    preset = pickBathroomPreset(widthMm, true);
    source = "entre-paredes";
    modules = modulesFromPreset(preset, generatedWidthMm);
  } else {
    preset = pickBathroomPreset(widthMm, betweenWalls);
    source = "preset-automatico";
    modules = modulesFromPreset(preset, generatedWidthMm);
  }

  let result = place(modules, widthMm, {
    heightMm: input.heightMm ?? preset?.counterHeightMm,
    depthMm: input.depthMm ?? preset?.depthMm,
    finishId: input.finishId,
    install: input.install ?? preset?.install,
  });

  if (result.placements.length === 0) {
    // Fallback mínimo seguro: um gabinete simples que caiba.
    source = "fallback";
    warnings.push("nenhum módulo coube — aplicado fallback mínimo seguro");
    result = place(
      [
        {
          kind: "gabinete-1-porta",
          widthMm: Math.min(widthMm, 600),
          // Fallback é sempre montável: sem louça e sem tampo obrigatórios.
          sink: { type: "nenhuma" },
          countertop: { material: "nenhum" },
        },
      ],
      widthMm,
      { heightMm: input.heightMm, depthMm: input.depthMm, finishId: input.finishId },
    );
  }

  warnings.push(...result.warnings);

  // Tapa-vão REAL: só entre paredes ou quando explicitamente pedido.
  const fillers: FillerPiece[] = [];
  const wantsFiller = input.fillGaps ?? wantsBetweenWalls;
  if (wantsFiller && result.leftover >= 10) {
    const last = result.placements[result.placements.length - 1];
    const half = wantsBetweenWalls ? Math.round(result.leftover / 2) : result.leftover;
    const height = input.heightMm ?? preset?.counterHeightMm ?? 600;
    const depth = input.depthMm ?? preset?.depthMm ?? 460;
    if (wantsBetweenWalls && half >= 10) {
      // Os módulos deslocam para a direita do tapa-vão esquerdo.
      result = {
        ...result,
        placements: result.placements.map((p) => ({ ...p, xMm: p.xMm + half })),
      };
      fillers.push(
        makeFiller({
          id: "tapa-vao-esq",
          xMm: 0,
          widthMm: half,
          heightMm: height,
          depthMm: depth,
          finishId: input.finishId ?? "branco-tx",
          reason: "vão entre a parede esquerda e o módulo",
        }),
      );
      fillers.push(
        makeFiller({
          id: "tapa-vao-dir",
          xMm: widthMm - (result.leftover - half),
          widthMm: result.leftover - half,
          heightMm: height,
          depthMm: depth,
          finishId: input.finishId ?? "branco-tx",
          reason: "vão entre o módulo e a parede direita",
        }),
      );
    } else {
      fillers.push(
        makeFiller({
          id: "tapa-vao-dir",
          xMm: last ? last.xMm + last.widthMm : 0,
          widthMm: result.leftover,
          heightMm: height,
          depthMm: depth,
          finishId: input.finishId ?? "branco-tx",
          reason: "enchimento solicitado",
        }),
      );
    }
  }

  const covered = fillers.filter((f) => f.widthMm >= 10).reduce((a, f) => a + f.widthMm, 0);
  return {
    source,
    preset,
    widthMm,
    placements: result.placements,
    fillers: fillers.filter((f) => f.widthMm >= 10),
    /* Sobra REAL: o que nenhum tapa-vão cobriu. Nunca zerar por otimismo. */
    leftoverMm: Math.max(0, result.leftover - covered),
    warnings,
  };
}