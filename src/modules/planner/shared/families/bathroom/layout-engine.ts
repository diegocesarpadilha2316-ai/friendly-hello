/**
 * LAYOUT ENGINE — BANHEIRO.
 *
 * Distribui os módulos numa bancada respeitando prioridade:
 *   1. configuração explícita (modules[]);
 *   2. configuração manual legada;
 *   3. preset selecionado;
 *   4. preset automático;
 *   5. fallback mínimo seguro.
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
  normalizeBathroomKind,
  type BathroomModuleInput,
  type BathroomModuleKind,
} from "./spec";

export type BathroomLayoutSource =
  | "explicito"
  | "legado"
  | "preset"
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
    if (available < Math.min(p.minWidthMm, MIN_MODULE_MM)) {
      warnings.push(`módulo ${kind} descartado: sem espaço restante`);
      return;
    }
    const widthMm = Math.min(wanted, available);
    if (widthMm < p.minWidthMm) {
      warnings.push(`módulo ${kind} descartado: ${Math.round(widthMm)} mm < mínimo ${p.minWidthMm} mm`);
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
  const benchWidth = Math.max(MIN_MODULE_MM, widthMm - towerWidth);

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
  const warnings: string[] = [];

  let source: BathroomLayoutSource;
  let preset: BathroomPreset | null = null;
  let modules: readonly BathroomModuleInput[];

  const presetId: BathroomPresetId | null = normalizePresetId(input.preset);

  if (input.modules && input.modules.length > 0) {
    source = "explicito";
    modules = input.modules;
    if (presetId) preset = BATHROOM_PRESETS[presetId];
  } else if (input.legacyModules && input.legacyModules.length > 0) {
    // Nunca sobrescrever configuração manual já existente.
    source = "legado";
    modules = input.legacyModules;
  } else if (presetId) {
    source = "preset";
    preset = BATHROOM_PRESETS[presetId];
    modules = modulesFromPreset(preset, widthMm);
  } else {
    preset = pickBathroomPreset(widthMm, betweenWalls);
    source = "preset-automatico";
    modules = modulesFromPreset(preset, widthMm);
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
      [{ kind: "gabinete-1-porta", widthMm: Math.min(widthMm, 600) }],
      widthMm,
      { heightMm: input.heightMm, depthMm: input.depthMm, finishId: input.finishId },
    );
  }

  warnings.push(...result.warnings);

  // Tapa-vão REAL: só entre paredes ou quando explicitamente pedido.
  const fillers: FillerPiece[] = [];
  const wantsFiller = input.fillGaps ?? betweenWalls ?? false;
  if (wantsFiller && result.leftover >= 10) {
    const last = result.placements[result.placements.length - 1];
    const half = betweenWalls ? Math.round(result.leftover / 2) : result.leftover;
    const height = input.heightMm ?? preset?.counterHeightMm ?? 600;
    const depth = input.depthMm ?? preset?.depthMm ?? 460;
    if (betweenWalls && half >= 10) {
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

  return {
    source,
    preset,
    widthMm,
    placements: result.placements,
    fillers: fillers.filter((f) => f.widthMm >= 10),
    leftoverMm: wantsFiller ? 0 : result.leftover,
    warnings,
  };
}