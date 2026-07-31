/**
 * LAYOUT ENGINE — distribui automaticamente módulos internos num vão.
 *
 * A receita descreve INTENÇÃO (colunas e faixas); o motor resolve medidas
 * reais, insere divisórias, respeita limites de cada módulo e descarta o
 * que não couber, sempre devolvendo um projeto interno VÁLIDO.
 */
import { round } from "../construction";
import type {
  InteriorCavity,
  InteriorIssue,
  InteriorPlacement,
  InteriorPlan,
  InteriorValidation,
} from "./types";
import type { ConstructionContext } from "../construction";
import { getInteriorModule } from "./registry";
import { resolveInteriorBox } from "./positioning";
import { validateInteriorPlan } from "./validator";

/** Faixa horizontal dentro de uma coluna. */
export interface LayoutBand {
  readonly module: string;
  /** Altura fixa (mm). Sem isso a faixa divide a sobra por `flex`. */
  readonly heightMm?: number;
  readonly flex?: number;
  /** Repetições empilhadas (gaveteiro, sapateira). */
  readonly repeat?: number;
  readonly role?: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface LayoutColumn {
  readonly label?: string;
  readonly widthMm?: number;
  readonly flex?: number;
  readonly bands: readonly LayoutBand[];
}

/** Receita de auto layout — base dos presets e da IA. */
export interface LayoutRecipe {
  readonly id: string;
  readonly label: string;
  readonly families: readonly string[];
  /** Insere divisória vertical entre colunas. */
  readonly dividers: boolean;
  readonly columns: readonly LayoutColumn[];
}

export interface AutoLayoutInput {
  readonly cavity: InteriorCavity;
  readonly recipe: LayoutRecipe;
  readonly planId?: string;
  readonly context?: Partial<Omit<ConstructionContext, "instanceId">>;
  /** Espessura da divisória vertical entre colunas (mm). */
  readonly dividerThicknessMm?: number;
  /** Folga vertical entre faixas (mm). */
  readonly bandGapMm?: number;
}

export interface AutoLayoutResult {
  readonly plan: InteriorPlan;
  readonly validation: InteriorValidation;
  readonly warnings: readonly InteriorIssue[];
  /** Faixas que não couberam e foram descartadas. */
  readonly dropped: readonly string[];
}

function share(values: readonly number[], total: number): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return values.map(() => total / Math.max(1, values.length));
  return values.map((v) => (v / sum) * total);
}

export function autoLayout(input: AutoLayoutInput): AutoLayoutResult {
  const { cavity, recipe } = input;
  const dividerT = input.dividerThicknessMm ?? 18;
  const gap = input.bandGapMm ?? 0;
  const warnings: InteriorIssue[] = [];
  const dropped: string[] = [];
  const placements: InteriorPlacement[] = [];

  const cols = recipe.columns.length > 0 ? recipe.columns : [{ bands: [] }];
  const dividerCount = recipe.dividers ? Math.max(0, cols.length - 1) : 0;
  const freeWidth = cavity.widthMm - dividerCount * dividerT;

  const fixedWidth = cols.reduce((a, c) => a + (c.widthMm ?? 0), 0);
  const flexCols = cols.filter((c) => c.widthMm === undefined);
  const flexWidths = share(
    flexCols.map((c) => c.flex ?? 1),
    Math.max(0, freeWidth - fixedWidth),
  );

  let flexIdx = 0;
  let cursorX = cavity.x;

  cols.forEach((col, ci) => {
    const colWidth = round(col.widthMm ?? flexWidths[flexIdx++] ?? 0);
    const colCavity: InteriorCavity = {
      ...cavity,
      id: `${cavity.id}:col-${ci + 1}`,
      label: col.label ?? `Coluna ${ci + 1}`,
      x: round(cursorX),
      widthMm: colWidth,
    };

    if (colWidth <= 0) {
      warnings.push({
        level: "warn",
        code: "coluna-sem-espaco",
        message: `${colCavity.label}: não há largura disponível.`,
      });
    } else {
      placements.push(...layoutColumn(colCavity, col, ci, gap, dropped, warnings));
    }

    cursorX += colWidth;
    if (recipe.dividers && ci < cols.length - 1) {
      const def = getInteriorModule("divisoria-vertical");
      if (def) {
        const { box: b } = resolveInteriorBox(
          { ...cavity, x: round(cursorX), widthMm: dividerT },
          def,
          { kind: "coordenada", at: [0, 0, 0], size: { widthMm: dividerT, heightMm: cavity.heightMm, depthMm: cavity.depthMm } },
        );
        placements.push({
          id: `${cavity.id}:div-${ci + 1}`,
          moduleId: def.id,
          box: b,
          role: `Divisória ${ci + 1}`,
          origin: "auto",
        });
      }
      cursorX += dividerT;
    }
  });

  const plan: InteriorPlan = {
    id: input.planId ?? `${cavity.id}:${recipe.id}`,
    cavity,
    placements,
    context: input.context,
  };

  return { plan, validation: validateInteriorPlan(plan), warnings, dropped };
}

function layoutColumn(
  colCavity: InteriorCavity,
  col: LayoutColumn,
  colIndex: number,
  gap: number,
  dropped: string[],
  warnings: InteriorIssue[],
): InteriorPlacement[] {
  const out: InteriorPlacement[] = [];

  type Resolved = { band: LayoutBand; repeat: number; fixed?: number };
  const items: Resolved[] = col.bands.map((band) => ({
    band,
    repeat: Math.max(1, Math.round(band.repeat ?? 1)),
    fixed: band.heightMm,
  }));

  const gapsTotal = gap * Math.max(0, items.reduce((a, i) => a + i.repeat, 0) - 1);
  const fixedTotal = items.reduce((a, i) => a + (i.fixed ?? 0) * i.repeat, 0);
  const flexItems = items.filter((i) => i.fixed === undefined);
  const flexHeights = share(
    flexItems.map((i) => i.band.flex ?? 1),
    Math.max(0, colCavity.heightMm - fixedTotal - gapsTotal),
  );

  let flexIdx = 0;
  let cursorY = colCavity.y;

  for (const item of items) {
    const each = item.fixed ?? (flexHeights[flexIdx++] ?? 0) / item.repeat;
    const def = getInteriorModule(item.band.module);
    if (!def) {
      dropped.push(item.band.module);
      warnings.push({
        level: "warn",
        code: "modulo-inexistente",
        message: `Módulo "${item.band.module}" não registrado — faixa ignorada.`,
      });
      continue;
    }

    for (let r = 0; r < item.repeat; r++) {
      const top = cursorY + each;
      const remaining = colCavity.y + colCavity.heightMm - cursorY;
      if (each < def.min.heightMm || remaining < def.min.heightMm - 1) {
        dropped.push(def.id);
        warnings.push({
          level: "warn",
          code: "faixa-sem-espaco",
          message: `${def.name}: faixa de ${Math.round(each)} mm menor que o mínimo (${def.min.heightMm} mm) — módulo não inserido.`,
        });
        cursorY = top + gap;
        continue;
      }

      const { box: b, warnings: w } = resolveInteriorBox(colCavity, def, {
        kind: "vao",
        fromYMm: round(cursorY - colCavity.y),
        toYMm: round(Math.min(top, colCavity.y + colCavity.heightMm) - colCavity.y),
      });
      warnings.push(...w);
      out.push({
        id: `${colCavity.id}:${def.id}-${out.length + 1}`,
        moduleId: def.id,
        box: b,
        role: item.band.role ?? `${def.name} · col ${colIndex + 1}`,
        params: item.band.params,
        origin: "auto",
      });
      cursorY = top + gap;
    }
  }

  return out;
}