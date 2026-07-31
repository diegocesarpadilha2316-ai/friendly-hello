/**
 * LAYOUT ENGINE — LAVANDERIA.
 *
 * Distribui os módulos na parede respeitando a prioridade IMUTÁVEL:
 *   1. configuração explícita (modules[]);
 *   2. configuração manual legada;
 *   3. preset selecionado;
 *   4. composição entre paredes;
 *   5. preset automático;
 *   6. fallback mínimo seguro.
 *
 * Nunca sobrescreve configuração manual existente e nunca cria módulo
 * inválido: a largura mínima considerada é a REAL (perfil, tanque e
 * aparelho). Sobra só vira tapa-vão real quando o vão é entre paredes ou
 * quando pedido explicitamente.
 */
import { makeFiller, type FillerPiece } from "../filler";
import {
  LAUNDRY_PRESETS,
  normalizeLaundryPresetId,
  pickLaundryPreset,
  type LaundryPreset,
  type LaundryPresetId,
} from "./presets";
import { laundryGeometry } from "./modules";
import {
  LAUNDRY_MODULE_PROFILES,
  laundryMinWidthMm,
  normalizeLaundryKind,
  normalizeLaundryModule,
  type LaundryModuleInput,
  type LaundryModuleKind,
} from "./spec";

export type LaundryLayoutSource =
  | "explicito"
  | "legado"
  | "preset"
  | "entre-paredes"
  | "preset-automatico"
  | "fallback";

export interface LaundryPlacement {
  readonly id: string;
  readonly kind: LaundryModuleKind;
  /** Posição X (mm) a partir da esquerda da composição. */
  readonly xMm: number;
  readonly widthMm: number;
  /** Trecho da composição (0 = parede principal, 1 = retorno do L). */
  readonly run: number;
  readonly module: LaundryModuleInput;
}

export interface LaundryLayoutInput {
  /** Largura total disponível na parede (mm). */
  readonly widthMm: number;
  readonly heightMm?: number;
  readonly depthMm?: number;
  /** Configuração explícita — vence tudo. */
  readonly modules?: readonly LaundryModuleInput[];
  /** Configuração manual legada já persistida no projeto. */
  readonly legacyModules?: readonly LaundryModuleInput[];
  readonly preset?: string;
  readonly betweenWalls?: boolean;
  /** Composição em L: reparte a largura em dois trechos. */
  readonly corner?: boolean;
  /** Largura do retorno do L (mm). */
  readonly returnWidthMm?: number;
  /** Emitir tapa-vão real para a sobra. */
  readonly fillGaps?: boolean;
  readonly finishId?: string;
  readonly install?: string;
  /** Emitir aéreos automaticamente (default: o que o preset pedir). */
  readonly uppers?: boolean;
}

export interface LaundryLayoutResult {
  readonly source: LaundryLayoutSource;
  readonly preset: LaundryPreset | null;
  readonly widthMm: number;
  readonly placements: readonly LaundryPlacement[];
  /** Peças reais de tapa-vão (nunca "sobra virou número"). */
  readonly fillers: readonly FillerPiece[];
  readonly leftoverMm: number;
  readonly droppedModules: readonly string[];
  readonly warnings: readonly string[];
}

const MIN_MODULE_MM = 200;
/** Largura mínima de sobra que ainda vale fechar com um gabinete real. */
const MIN_BENCH_FILL_MM = 300;
/** Folga entre o topo da bancada (ou da tampa) e a base do aéreo. */
const UPPER_CLEARANCE_MM = 500;
/** Altura máxima de instalação de um aéreo (alcance real). */
const MAX_UPPER_MOUNT_MM = 2000;
/** Vão técnico reservado por parede quando a composição é entre paredes. */
const WALL_GAP_MM = 18;
/** Circulação mínima recomendada à frente da composição. */
export const LAUNDRY_CIRCULATION_MM = 800;

function place(
  modules: readonly LaundryModuleInput[],
  totalWidth: number,
  defaults: { heightMm?: number; depthMm?: number; finishId?: string; install?: string },
  run = 0,
): {
  placements: LaundryPlacement[];
  leftover: number;
  warnings: string[];
  dropped: string[];
} {
  const placements: LaundryPlacement[] = [];
  const warnings: string[] = [];
  const dropped: string[] = [];
  let x = 0;
  /* Aéreos e prateleiras têm cursor PRÓPRIO: eles não consomem a bancada,
   * mas também não podem ocupar a mesma faixa de parede um do outro. */
  let xUpper = 0;

  modules.forEach((m, i) => {
    const kind = normalizeLaundryKind(m.kind);
    const p = LAUNDRY_MODULE_PROFILES[kind];
    /* Aéreo e prateleira não consomem a largura da bancada. */
    const overlays = p.level === "superior";
    const wanted = m.widthMm ?? p.defaultWidthMm;
    const available = overlays ? totalWidth - xUpper : totalWidth - x;
    const minWidthMm = laundryMinWidthMm({ ...m, kind });

    if (available < Math.min(minWidthMm, MIN_MODULE_MM)) {
      warnings.push(`módulo ${kind} descartado: sem espaço restante`);
      dropped.push(kind);
      return;
    }
    const widthMm = Math.min(wanted, available);
    if (widthMm < minWidthMm) {
      warnings.push(`módulo ${kind} descartado: ${Math.round(widthMm)} mm < mínimo ${minWidthMm} mm`);
      dropped.push(kind);
      return;
    }
    placements.push({
      id: `${kind}-${run}-${i + 1}`,
      kind,
      xMm: Math.round(overlays ? xUpper : x),
      widthMm: Math.round(widthMm),
      run,
      module: {
        /* Altura da bancada só vale para a BANCADA: colunas, tampos,
         * acabamentos e aéreos mantêm a altura do próprio perfil. */
        heightMm: p.level === "bancada" ? defaults.heightMm : undefined,
        /* Profundidade da bancada vale para bancada e colunas; aéreos,
         * tampos e acabamentos mantêm a profundidade do próprio perfil. */
        depthMm: p.level === "bancada" || p.level === "coluna" ? defaults.depthMm : undefined,
        finishId: defaults.finishId,
        install: overlays ? "suspenso" : (defaults.install as LaundryModuleInput["install"]),
        ...m,
        kind,
        widthMm: Math.round(widthMm),
      },
    });
    if (overlays) xUpper += widthMm;
    else x += widthMm;
  });

  return { placements, leftover: Math.max(0, Math.round(totalWidth - x)), warnings, dropped };
}

/**
 * Traduz o preset em módulos: obrigatórios primeiro (na medida cheia),
 * depois flexíveis preenchendo a sobra na ordem de preferência. Quando não
 * cabe tudo, remove pela `reductionOrder` — nunca encolhe abaixo do mínimo.
 */
function modulesFromPreset(preset: LaundryPreset, widthMm: number): LaundryModuleInput[] {
  const out: LaundryModuleInput[] = [];
  let left = widthMm;

  const tubKinds: readonly LaundryModuleKind[] = ["gabinete-tanque"];

  for (const kind of preset.required) {
    const p = LAUNDRY_MODULE_PROFILES[kind];
    const base: LaundryModuleInput = {
      kind,
      widthMm: p.defaultWidthMm,
      ...(tubKinds.includes(kind) ? { tub: { type: preset.tub } } : {}),
      ...(preset.countertop && p.countertop ? { countertop: { material: preset.countertop as never } } : {}),
    };
    const min = laundryMinWidthMm(base);
    if (left < min) continue;
    const width = Math.min(p.defaultWidthMm, left);
    out.push({ ...base, widthMm: Math.max(min, width) });
    left -= Math.max(min, width);
  }

  /* flexíveis de bancada/coluna consomem sobra; aéreos são sobrepostos */
  for (const kind of preset.flexible) {
    const p = LAUNDRY_MODULE_PROFILES[kind];
    if (p.level === "superior") {
      if (preset.uppers) out.push({ kind, widthMm: p.defaultWidthMm });
      continue;
    }
    const min = laundryMinWidthMm({ kind });
    if (left < min) continue;
    const width = Math.min(p.defaultWidthMm, left);
    out.push({ kind, widthMm: width });
    left -= width;
  }

  return out;
}

/** Resolve a composição da lavanderia. Puro e determinístico. */
export function planLaundryLayout(input: LaundryLayoutInput): LaundryLayoutResult {
  const widthMm = Math.max(MIN_MODULE_MM, Math.round(input.widthMm || 1200));
  const presetId: LaundryPresetId | null = normalizeLaundryPresetId(input.preset);
  const explicitPreset = presetId ? LAUNDRY_PRESETS[presetId] : null;
  const betweenWalls = input.betweenWalls ?? false;
  const generatedOnly = !input.modules?.length && !input.legacyModules?.length;
  const wantsBetweenWalls =
    betweenWalls || (generatedOnly && explicitPreset ? explicitPreset.betweenWalls : false);
  const warnings: string[] = [];

  let source: LaundryLayoutSource;
  let preset: LaundryPreset | null = null;
  let modules: readonly LaundryModuleInput[];

  /** Entre paredes, a composição nasce menor para caber o tapa-vão real. */
  const generatedWidthMm = wantsBetweenWalls
    ? Math.max(MIN_MODULE_MM, widthMm - 2 * WALL_GAP_MM)
    : widthMm;

  if (input.modules && input.modules.length > 0) {
    source = "explicito";
    modules = input.modules;
    preset = explicitPreset;
  } else if (input.legacyModules && input.legacyModules.length > 0) {
    // Nunca sobrescrever configuração manual já existente.
    source = "legado";
    modules = input.legacyModules;
  } else if (explicitPreset) {
    preset = explicitPreset;
    source = betweenWalls || preset.betweenWalls ? "entre-paredes" : "preset";
    modules = modulesFromPreset(preset, generatedWidthMm);
  } else if (betweenWalls) {
    preset = pickLaundryPreset(widthMm, true);
    source = "entre-paredes";
    modules = modulesFromPreset(preset, generatedWidthMm);
  } else {
    preset = pickLaundryPreset(widthMm, false);
    source = "preset-automatico";
    modules = modulesFromPreset(preset, generatedWidthMm);
  }

  const defaults = {
    heightMm: input.heightMm ?? preset?.heightMm,
    depthMm: input.depthMm ?? preset?.depthMm,
    finishId: input.finishId,
    install: input.install ?? preset?.install,
  };

  /* Composição em L: dois trechos independentes com a mesma regra. */
  const corner = input.corner ?? preset?.corner ?? false;
  const returnWidthMm = corner
    ? Math.max(MIN_MODULE_MM, Math.round(input.returnWidthMm ?? Math.floor(widthMm / 3)))
    : 0;
  const mainWidthMm = corner ? Math.max(MIN_MODULE_MM, widthMm - returnWidthMm) : widthMm;

  let result = place(modules, mainWidthMm, defaults, 0);
  const dropped = [...result.dropped];

  if (corner && result.leftover > 0 && preset) {
    const back = place(
      modulesFromPreset(preset, returnWidthMm).filter(
        (m) => LAUNDRY_MODULE_PROFILES[normalizeLaundryKind(m.kind)].level !== "superior",
      ),
      returnWidthMm,
      defaults,
      1,
    );
    result = {
      ...result,
      placements: [...result.placements, ...back.placements],
      warnings: [...result.warnings, ...back.warnings],
      dropped: [...result.dropped, ...back.dropped],
      leftover: result.leftover + back.leftover,
    };
    dropped.push(...back.dropped);
  }

  if (result.placements.length === 0) {
    // Fallback mínimo seguro: um gabinete simples, sem hidráulica nem aparelho.
    source = "fallback";
    warnings.push("nenhum módulo coube — aplicado fallback mínimo seguro");
    /* O fallback SEMPRE entrega um módulo válido: se o espaço é menor que o
     * mínimo real, o módulo recebe o mínimo e a sobra vira aviso de overflow. */
    const fallbackWidthMm = Math.max(300, Math.min(widthMm, 600));
    if (fallbackWidthMm > widthMm) {
      warnings.push(
        `espaço de ${Math.round(widthMm)} mm menor que o módulo mínimo de ${fallbackWidthMm} mm`,
      );
    }
    result = place(
      [
        {
          kind: "gabinete-inferior",
          widthMm: fallbackWidthMm,
          tub: { type: "nenhum" },
          appliance: { kind: "nenhum" },
          countertop: { material: "nenhum" },
        },
      ],
      Math.max(widthMm, fallbackWidthMm),
      { heightMm: input.heightMm, depthMm: input.depthMm, finishId: input.finishId },
      0,
    );
  }

  /* Altura de instalação dos aéreos: derivada da bancada real (tampo, e o
   * curso da tampa quando existe máquina de abertura superior). Nunca
   * sobrescreve uma altura informada explicitamente. */
  const benchSpecs = result.placements
    .filter((pl) => {
      const level = LAUNDRY_MODULE_PROFILES[pl.kind].level;
      /* Colunas ocupam a própria faixa de parede: não empurram o aéreo. */
      return level === "bancada" || level === "tampo";
    })
    .map((pl) => normalizeLaundryModule(pl.module));
  const benchTopMm = benchSpecs.reduce((acc, spec) => {
    const g = laundryGeometry(spec);
    const lid = spec.appliance.doorOpening === "superior" ? spec.appliance.topLidMm : 0;
    return Math.max(acc, g.topOfCountertopMm + lid);
  }, 0);
  if (benchTopMm > 0) {
    const mountMm = benchTopMm + UPPER_CLEARANCE_MM;
    if (mountMm > MAX_UPPER_MOUNT_MM) {
      warnings.push(
        `aéreo não cabe acima da bancada de ${Math.round(benchTopMm)} mm — instalado no limite de ${MAX_UPPER_MOUNT_MM} mm`,
      );
    }
    result = {
      ...result,
      placements: result.placements.map((pl) =>
        LAUNDRY_MODULE_PROFILES[pl.kind].level === "superior" && pl.module.floorGapMm === undefined
          ? { ...pl, module: { ...pl.module, floorGapMm: Math.min(MAX_UPPER_MOUNT_MM, mountMm) } }
          : pl,
      ),
    };
  }

  warnings.push(...result.warnings);

  /* Sobra de bancada em composição GERADA nunca fica vazia: um gabinete
   * flexível fecha o vão (configuração explícita e legada não são tocadas). */
  /* Entre paredes a sobra pertence aos tapa-vãos reais: só o excedente
   * acima dessa reserva pode virar gabinete. */
  const fillableLeftoverMm = Math.max(
    0,
    result.leftover - (wantsBetweenWalls ? 2 * WALL_GAP_MM : 0),
  );
  if (
    (source === "preset" || source === "preset-automatico" || source === "entre-paredes") &&
    fillableLeftoverMm >= MIN_BENCH_FILL_MM
  ) {
    const extra = place(
      [
        {
          kind: "gabinete-inferior",
          widthMm: fillableLeftoverMm,
          ...(preset?.countertop ? { countertop: { material: preset.countertop as never } } : {}),
        },
      ],
      fillableLeftoverMm,
      defaults,
      0,
    );
    const shift = result.placements
      .filter((pl) => LAUNDRY_MODULE_PROFILES[pl.kind].level !== "superior" && pl.run === 0)
      .reduce((acc, pl) => Math.max(acc, pl.xMm + pl.widthMm), 0);
    result = {
      ...result,
      placements: [
        ...result.placements,
        ...extra.placements.map((pl) => ({
          ...pl,
          id: `${pl.kind}-fill-${result.placements.length + 1}`,
          xMm: pl.xMm + shift,
        })),
      ],
      leftover: result.leftover - (fillableLeftoverMm - extra.leftover),
    };
  }

  // Tapa-vão REAL: só entre paredes ou quando explicitamente pedido.
  const fillers: FillerPiece[] = [];
  const wantsFiller = input.fillGaps ?? wantsBetweenWalls;
  const bench = result.placements.filter(
    (p) => LAUNDRY_MODULE_PROFILES[p.kind].level !== "superior" && p.run === 0,
  );
  if (wantsFiller && result.leftover >= 10) {
    const last = bench[bench.length - 1];
    const half = wantsBetweenWalls ? Math.round(result.leftover / 2) : result.leftover;
    const height = defaults.heightMm ?? 850;
    const depth = defaults.depthMm ?? 600;
    if (wantsBetweenWalls && half >= 10) {
      result = {
        ...result,
        placements: result.placements.map((p) =>
          LAUNDRY_MODULE_PROFILES[p.kind].level === "superior" ? p : { ...p, xMm: p.xMm + half },
        ),
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

  const real = fillers.filter((f) => f.widthMm >= 10);
  const covered = real.reduce((a, f) => a + f.widthMm, 0);
  return {
    source,
    preset,
    widthMm,
    placements: result.placements,
    fillers: real,
    /* Sobra REAL: o que nenhum tapa-vão cobriu. Nunca zerar por otimismo. */
    leftoverMm: Math.max(0, result.leftover - covered),
    droppedModules: dropped,
    warnings,
  };
}
