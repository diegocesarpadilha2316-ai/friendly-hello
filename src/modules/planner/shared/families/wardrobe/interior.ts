/**
 * INTEGRAÇÃO ROUPEIRO × BIBLIOTECA PARAMÉTRICA DE INTERIORES.
 *
 * Aqui NÃO existe motor novo, nem geometria. Este arquivo apenas decide
 * QUAL projeto interno o roupeiro deve usar e entrega o resultado do
 * Layout Engine já convertido em slots da Biblioteca Construtiva:
 *
 *   ficha → cavidade útil → LayoutRecipe → autoLayout → InteriorPlan
 *        → interiorPlanToSlots → buildAssembly (em build.ts) → AssemblyMesh
 *
 * Ordem de resolução (nunca perde configuração manual):
 *   1. layout interno explícito salvo na ficha;
 *   2. conversão dos parâmetros legados/manuais da ficha;
 *   3. preset escolhido pelo usuário;
 *   4. `pickPreset()` automático por família e dimensões;
 *   5. layout mínimo seguro (fallback).
 */
import type { AssemblySlot, ConstructionBox } from "../../construction";
import { round } from "../../construction";
import {
  autoLayout,
  getInteriorPreset,
  interiorPlanToSlots,
  pickPreset,
  validateInteriorPlan,
  type InteriorCavity,
  type InteriorFamilyId,
  type InteriorIssue,
  type InteriorPlacement,
  type InteriorPlan,
  type InteriorValidation,
  type LayoutBand,
  type LayoutColumn,
  type LayoutRecipe,
} from "../../interior";
import type { WardrobeSpec } from "./spec";

/** Medidas derivadas mínimas de que o interior precisa (vindas do build). */
export interface WardrobeCaseMetrics {
  readonly interiorY0: number;
  readonly interiorHeightMm: number;
  readonly innerWidthMm: number;
}

export type WardrobeInteriorSource =
  | "explicito"
  | "legado"
  | "preset-usuario"
  | "preset-automatico"
  | "fallback";

export interface WardrobeInteriorResult {
  readonly plan: InteriorPlan;
  readonly cavity: InteriorCavity;
  readonly source: WardrobeInteriorSource;
  readonly recipeId: string;
  readonly validation: InteriorValidation;
  readonly warnings: readonly InteriorIssue[];
  readonly requested: readonly string[];
  readonly dropped: readonly string[];
  readonly slots: readonly AssemblySlot[];
}

/** Vão livre real do roupeiro, em milímetros, no espaço do móvel. */
export function wardrobeCavity(spec: WardrobeSpec, m: WardrobeCaseMetrics): InteriorCavity {
  const t = spec.thicknessMm;
  const bt = spec.backThicknessMm;
  return {
    id: "roupeiro:vao",
    label: "Vão interno",
    x: round(t),
    y: round(m.interiorY0),
    z: round(bt),
    widthMm: round(Math.max(0, m.innerWidthMm)),
    heightMm: round(Math.max(0, m.interiorHeightMm)),
    // Abertura frontal: o interior nunca invade o plano das frentes.
    depthMm: round(Math.max(0, spec.depthMm - bt - t)),
  };
}

/** Família de interiores atendida pela ficha. */
export function wardrobeInteriorFamily(spec: WardrobeSpec): InteriorFamilyId {
  return spec.opening === "sem-porta" ? "closet" : "roupeiro";
}

/** O maleiro pertence à caixa (build.ts) — o interior nunca o duplica. */
function stripMaleiro(recipe: LayoutRecipe): LayoutRecipe {
  return {
    ...recipe,
    columns: recipe.columns.map((c) => ({
      ...c,
      bands: c.bands.filter((b) => b.module !== "maleiro"),
    })),
  };
}

/** A ficha tem configuração interna manual/legada digna de preservação? */
export function hasManualInterior(spec: WardrobeSpec): boolean {
  return spec.drawers > 0 || spec.shelvesPerColumn > 0 || spec.hangers > 0 || spec.niches > 0;
}

/**
 * Converte os parâmetros da ficha (originais de projetos antigos ou do
 * inspetor) numa receita de layout — sem regravar nada no projeto.
 */
export function legacyInteriorRecipe(spec: WardrobeSpec): LayoutRecipe {
  const cols = Math.max(1, spec.columns);
  const drawerCol = spec.drawers > 0 ? Math.min(cols - 1, Math.max(0, spec.drawerColumn)) : -1;

  const nicheColumns = new Set<number>();
  for (let n = 0; n < spec.niches; n++) {
    nicheColumns.add(cols === 1 ? 0 : (Math.floor((cols - 1) / 2) + n) % cols);
  }

  const preferred = Array.from({ length: cols }, (_, i) => i).filter((i) => i !== drawerCol);
  const pool = preferred.length > 0 ? preferred : Array.from({ length: cols }, (_, i) => i);
  const hangerCount = new Map<number, number>();
  for (let n = 0; n < spec.hangers; n++) {
    const c = pool[n % pool.length];
    hangerCount.set(c, (hangerCount.get(c) ?? 0) + 1);
  }

  const columns: LayoutColumn[] = Array.from({ length: cols }, (_, c) => {
    const bands: LayoutBand[] = [];
    if (c === drawerCol) {
      bands.push({
        module: "gaveta-interna",
        heightMm: 200,
        repeat: spec.drawers,
        role: `Gaveta · col ${c + 1}`,
      });
    }
    const hangers = hangerCount.get(c) ?? 0;
    if (spec.shelvesPerColumn > 0) {
      bands.push({
        module: "prateleira",
        // Com cabideiro na mesma coluna as prateleiras têm passo fixo,
        // deixando a sobra para a barra (que exige altura mínima).
        ...(hangers > 0 ? { heightMm: 350 } : { flex: 1 }),
        repeat: spec.shelvesPerColumn,
        role: `Prateleira · col ${c + 1}`,
      });
    }
    for (let h = 0; h < hangers; h++) {
      bands.push({ module: "cabideiro", flex: 1, role: `Cabideiro ${h + 1} · col ${c + 1}` });
    }
    if (nicheColumns.has(c)) {
      bands.push({ module: "nicho", heightMm: 320, role: `Nicho · col ${c + 1}` });
    }
    return { label: `Coluna ${c + 1}`, flex: 1, bands };
  });

  return {
    id: "roupeiro-legado",
    label: "Configuração da ficha",
    families: ["roupeiro", "closet"],
    dividers: cols > 1,
    columns,
  };
}

/** Layout mínimo seguro: só prateleiras, sempre válido. */
function fallbackRecipe(spec: WardrobeSpec): LayoutRecipe {
  const cols = Math.max(1, spec.columns);
  return {
    id: "roupeiro-fallback",
    label: "Layout mínimo seguro",
    families: ["roupeiro", "closet"],
    dividers: cols > 1,
    columns: Array.from({ length: cols }, (_, c) => ({
      label: `Coluna ${c + 1}`,
      flex: 1,
      bands: [{ module: "prateleira", flex: 1, repeat: 2, role: `Prateleira · col ${c + 1}` }],
    })),
  };
}

function scale(v: number, from: number, to: number): number {
  return from > 0 ? (v / from) * to : v;
}

/**
 * Reancora um plano salvo num vão de outra medida (redimensionamento do
 * móvel). Proporcional, determinístico e sem perder módulos.
 */
export function refitInteriorPlan(plan: InteriorPlan, cavity: InteriorCavity): InteriorPlan {
  const from = plan.cavity;
  if (
    from.widthMm === cavity.widthMm &&
    from.heightMm === cavity.heightMm &&
    from.depthMm === cavity.depthMm &&
    from.x === cavity.x &&
    from.y === cavity.y &&
    from.z === cavity.z
  ) {
    return { ...plan, cavity };
  }
  const placements: InteriorPlacement[] = plan.placements.map((p) => {
    const b: ConstructionBox = {
      x: round(cavity.x + scale(p.box.x - from.x, from.widthMm, cavity.widthMm)),
      y: round(cavity.y + scale(p.box.y - from.y, from.heightMm, cavity.heightMm)),
      z: round(cavity.z + scale(p.box.z - from.z, from.depthMm, cavity.depthMm)),
      width: round(scale(p.box.width, from.widthMm, cavity.widthMm)),
      height: round(scale(p.box.height, from.heightMm, cavity.heightMm)),
      depth: round(scale(p.box.depth, from.depthMm, cavity.depthMm)),
    };
    return { ...p, box: b };
  });
  return { ...plan, cavity, placements };
}

interface Candidate {
  readonly source: WardrobeInteriorSource;
  readonly recipe?: LayoutRecipe;
  readonly plan?: InteriorPlan;
}

function requestedModules(recipe?: LayoutRecipe): string[] {
  if (!recipe) return [];
  const out: string[] = [];
  for (const col of recipe.columns) {
    for (const band of col.bands) {
      for (let i = 0; i < Math.max(1, Math.round(band.repeat ?? 1)); i++) out.push(band.module);
    }
  }
  return out;
}

/** Resolve o projeto interno do roupeiro seguindo a ordem de prioridade. */
export function resolveWardrobeInterior(
  spec: WardrobeSpec,
  metrics: WardrobeCaseMetrics,
): WardrobeInteriorResult {
  const cavity = wardrobeCavity(spec, metrics);
  const conf = spec.interior;
  const family = wardrobeInteriorFamily(spec);

  const candidates: Candidate[] = [];

  if (conf?.plan && conf.plan.placements.length > 0) {
    candidates.push({ source: "explicito", plan: refitInteriorPlan(conf.plan, cavity) });
  }
  if (conf?.mode !== "preset" && hasManualInterior(spec)) {
    candidates.push({ source: "legado", recipe: legacyInteriorRecipe(spec) });
  }
  const chosen = conf?.presetId ? getInteriorPreset(conf.presetId) : undefined;
  if (chosen) candidates.push({ source: "preset-usuario", recipe: stripMaleiro(chosen) });
  if (conf?.mode === "preset" || (!hasManualInterior(spec) && !conf?.plan)) {
    candidates.push({ source: "preset-automatico", recipe: stripMaleiro(pickPreset(family, cavity)) });
  }
  candidates.push({ source: "fallback", recipe: fallbackRecipe(spec) });

  let last: WardrobeInteriorResult | undefined;

  for (const c of candidates) {
    if (cavity.widthMm <= 0 || cavity.heightMm <= 0 || cavity.depthMm <= 0) break;

    if (c.plan) {
      const validation = validateInteriorPlan(c.plan);
      const result: WardrobeInteriorResult = {
        plan: c.plan,
        cavity,
        source: c.source,
        recipeId: c.plan.id,
        validation,
        warnings: validation.warnings,
        requested: c.plan.placements.map((p) => p.moduleId),
        dropped: [],
        slots: interiorPlanToSlots(c.plan),
      };
      if (validation.ok) return result;
      last = result;
      continue;
    }

    const r = autoLayout({
      cavity,
      recipe: c.recipe!,
      planId: `roupeiro:${c.recipe!.id}`,
      dividerThicknessMm: spec.thicknessMm,
    });
    const result: WardrobeInteriorResult = {
      plan: r.plan,
      cavity,
      source: c.source,
      recipeId: c.recipe!.id,
      validation: r.validation,
      warnings: [...r.warnings, ...r.validation.warnings],
      requested: requestedModules(c.recipe),
      dropped: r.dropped,
      slots: interiorPlanToSlots(r.plan),
    };
    if (r.validation.ok) return result;
    last = result;
  }

  if (last) return last;

  const empty: InteriorPlan = { id: "roupeiro:vazio", cavity, placements: [] };
  return {
    plan: empty,
    cavity,
    source: "fallback",
    recipeId: "vazio",
    validation: validateInteriorPlan(empty),
    warnings: [],
    requested: [],
    dropped: [],
    slots: [],
  };
}

/** Diagnóstico por móvel (consumido apenas em DEV). */
export interface WardrobeInteriorDiagnostics {
  readonly id: string;
  readonly source: WardrobeInteriorSource;
  readonly recipeId: string;
  readonly cavityMm: { widthMm: number; heightMm: number; depthMm: number };
  readonly columns: number;
  readonly requested: number;
  readonly placed: number;
  readonly dropped: readonly string[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly pieces: number;
  readonly motions: number;
}

export function wardrobeInteriorDiagnostics(
  id: string,
  spec: WardrobeSpec,
  interior: WardrobeInteriorResult,
  totals: { pieces: number; motions: number },
): WardrobeInteriorDiagnostics {
  return {
    id,
    source: interior.source,
    recipeId: interior.recipeId,
    cavityMm: {
      widthMm: interior.cavity.widthMm,
      heightMm: interior.cavity.heightMm,
      depthMm: interior.cavity.depthMm,
    },
    columns: spec.columns,
    requested: interior.requested.length,
    placed: interior.plan.placements.length,
    dropped: interior.dropped,
    warnings: interior.warnings.map((w) => w.message),
    errors: interior.validation.errors.map((e) => e.message),
    pieces: totals.pieces,
    motions: totals.motions,
  };
}
