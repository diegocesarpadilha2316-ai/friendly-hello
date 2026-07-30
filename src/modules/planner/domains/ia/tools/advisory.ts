/**
 * Etapa 9 — Ferramentas consultivas: Materiais (busca), Orçamentista,
 * Produção e Render.
 *
 * REGRA DE OURO: nenhuma delas inventa dado. Preço só sai do catálogo
 * real; o que não tem preço é declarado como pendência, nunca estimado
 * às cegas. Nenhuma altera o `PlannerProject` (exceto o preset de cena,
 * que vive em memória e é publicado no EventBus).
 */
import {
  decomposeFurniture,
  findCatalogItem,
  type CompanyManufacturingRules,
  type FurniturePart,
  type PlannerProject,
} from "@/modules/planner/shared";
import type { ToolContext } from "../services/tools";
import {
  furnitureOf,
  getActiveRoom,
  labelOf,
  searchMaterials,
  type FurniturePrimitive,
  type MaterialMatch,
} from "./validation";

/* ============================ MATERIAIS ============================ */

export interface MaterialSearchResult {
  readonly query: string;
  readonly matches: readonly MaterialMatch[];
  readonly exact: MaterialMatch | null;
  readonly ambiguous: boolean;
  readonly note: string;
}

/**
 * Busca acabamento real no catálogo. Retorna match único, lista ambígua
 * ou vazio — quem chama decide, a IA nunca "inventa" um acabamento.
 */
export function searchMaterialTool(query: string, brand?: string): MaterialSearchResult {
  const matches = searchMaterials(query, brand).slice(0, 12);
  const exact = matches.length === 1 ? matches[0] : null;
  return {
    query,
    matches,
    exact,
    ambiguous: matches.length > 1,
    note:
      matches.length === 0
        ? "Nenhum acabamento correspondente no catálogo de chapas."
        : exact
          ? `Acabamento único encontrado: ${exact.label} (${exact.brandLabel}).`
          : `${matches.length} acabamentos correspondem — é preciso escolher um.`,
  };
}

/* ======================= BASE DE ENGENHARIA ======================== */

interface DecomposedRow {
  readonly furniture: FurniturePrimitive;
  readonly label: string;
  readonly parts: readonly FurniturePart[];
  readonly boardAreaM2: number;
  readonly edgeMeters: number;
  readonly partCount: number;
  readonly priceBRL: number | null;
}

function decomposeRoom(
  project: PlannerProject,
  ctx: ToolContext,
  rules: CompanyManufacturingRules,
): DecomposedRow[] {
  const room = getActiveRoom(project, ctx);
  if (!room) return [];
  return furnitureOf(room).map((f) => {
    const result = decomposeFurniture(f, rules);
    const item = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
    return {
      furniture: f,
      label: labelOf(f),
      parts: result.parts,
      boardAreaM2: result.totals.boardAreaM2,
      edgeMeters: result.totals.edgeMeters,
      partCount: result.totals.partCount,
      priceBRL: typeof item?.priceBRL === "number" ? item.priceBRL : null,
    };
  });
}

/* =========================== ORÇAMENTO ============================= */

export type BudgetCategory = "chapas" | "fita_borda" | "ferragens" | "vidros" | "iluminacao" | "servicos";

export interface BudgetLine {
  readonly category: BudgetCategory;
  readonly label: string;
  readonly quantity: number;
  readonly unit: string;
  /** `null` quando não há preço cadastrado — jamais um número inventado. */
  readonly unitPriceBRL: number | null;
  readonly totalBRL: number | null;
  readonly source: "catalogo" | "sem_preco";
}

export interface BudgetEstimate {
  readonly lines: readonly BudgetLine[];
  readonly totalKnownBRL: number;
  readonly pendingCategories: readonly BudgetCategory[];
  readonly partial: boolean;
  readonly note: string;
  readonly disclaimer: string;
}

function countHardware(parts: readonly FurniturePart[]): number {
  return parts
    .filter((p) => p.kind === "porta" || p.kind === "gaveta" || p.kind === "frente")
    .reduce((acc, p) => acc + p.qty, 0);
}

/**
 * Estimativa por categoria. Quantidades vêm da decomposição real; preços,
 * exclusivamente do catálogo. Categoria sem preço é listada como pendência.
 */
export function estimateBudget(
  project: PlannerProject,
  ctx: ToolContext,
  rules: CompanyManufacturingRules,
): BudgetEstimate {
  const rows = decomposeRoom(project, ctx, rules);
  const boardArea = rows.reduce((a, r) => a + r.boardAreaM2, 0);
  const edge = rows.reduce((a, r) => a + r.edgeMeters, 0);
  const hardware = rows.reduce((a, r) => a + countHardware(r.parts), 0);
  const withPrice = rows.filter((r) => r.priceBRL !== null);
  const modulesTotal = withPrice.reduce((a, r) => a + (r.priceBRL ?? 0), 0);

  const lines: BudgetLine[] = [
    {
      category: "chapas",
      label: "Chapas (área bruta decomposta)",
      quantity: Math.round(boardArea * 100) / 100,
      unit: "m²",
      unitPriceBRL: null,
      totalBRL: null,
      source: "sem_preco",
    },
    {
      category: "fita_borda",
      label: "Fita de borda",
      quantity: Math.round(edge * 10) / 10,
      unit: "m",
      unitPriceBRL: null,
      totalBRL: null,
      source: "sem_preco",
    },
    {
      category: "ferragens",
      label: "Conjuntos de ferragem (portas/gavetas)",
      quantity: hardware,
      unit: "cj",
      unitPriceBRL: null,
      totalBRL: null,
      source: "sem_preco",
    },
  ];

  if (withPrice.length > 0) {
    lines.push({
      category: "servicos",
      label: `Módulos com preço de catálogo (${withPrice.length} de ${rows.length})`,
      quantity: withPrice.length,
      unit: "un",
      unitPriceBRL: null,
      totalBRL: Math.round(modulesTotal * 100) / 100,
      source: "catalogo",
    });
  }

  const pending = lines.filter((l) => l.source === "sem_preco").map((l) => l.category);

  return {
    lines,
    totalKnownBRL: Math.round(modulesTotal * 100) / 100,
    pendingCategories: pending,
    partial: pending.length > 0 || withPrice.length < rows.length,
    note:
      rows.length === 0
        ? "Nenhum módulo no cômodo ativo — não há o que orçar."
        : `Quantidades calculadas a partir da decomposição real de ${rows.length} módulo(s).`,
    disclaimer:
      "Estimativa parcial: apenas valores existentes no catálogo foram somados. Chapas, fita e ferragens dependem de tabela de preço da empresa e NÃO foram estimadas.",
  };
}

/* =========================== PRODUÇÃO ============================== */

export interface ProductionSummary {
  readonly moduleCount: number;
  readonly partCount: number;
  readonly boardAreaM2: number;
  readonly edgeMeters: number;
  readonly byModule: readonly { id: string; label: string; parts: number; areaM2: number }[];
  readonly pendings: readonly string[];
  readonly note: string;
}

export function productionSummary(
  project: PlannerProject,
  ctx: ToolContext,
  rules: CompanyManufacturingRules,
): ProductionSummary {
  const rows = decomposeRoom(project, ctx, rules);
  const pendings: string[] = [];
  if (rows.some((r) => !r.furniture.materialId && !r.furniture.params["material"])) {
    pendings.push("Existem módulos sem material definido — a chapa usada é a padrão da empresa.");
  }
  if (rows.some((r) => !r.furniture.catalogItemId)) {
    pendings.push("Existem módulos sem vínculo de catálogo — sem ficha técnica para a fábrica.");
  }

  return {
    moduleCount: rows.length,
    partCount: rows.reduce((a, r) => a + r.partCount, 0),
    boardAreaM2: Math.round(rows.reduce((a, r) => a + r.boardAreaM2, 0) * 100) / 100,
    edgeMeters: Math.round(rows.reduce((a, r) => a + r.edgeMeters, 0) * 10) / 10,
    byModule: rows.map((r) => ({
      id: r.furniture.id,
      label: r.label,
      parts: r.partCount,
      areaM2: Math.round(r.boardAreaM2 * 100) / 100,
    })),
    pendings,
    note: "Resumo consultivo — não libera produção nem gera ordem de fabricação.",
  };
}

export interface CutListRow {
  readonly moduleId: string;
  readonly moduleLabel: string;
  readonly part: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly qty: number;
  readonly material: string;
  readonly finish: string;
  readonly grain: string;
}

export interface PreliminaryCutList {
  readonly rows: readonly CutListRow[];
  readonly totalPieces: number;
  readonly truncated: boolean;
  readonly note: string;
}

/** Máximo de linhas devolvidas à IA — protege o contexto do modelo. */
export const CUT_LIST_MAX_ROWS = 120;

export function preliminaryCutList(
  project: PlannerProject,
  ctx: ToolContext,
  rules: CompanyManufacturingRules,
): PreliminaryCutList {
  const rows: CutListRow[] = [];
  let total = 0;
  for (const r of decomposeRoom(project, ctx, rules)) {
    for (const p of r.parts) {
      total += p.qty;
      if (rows.length < CUT_LIST_MAX_ROWS) {
        rows.push({
          moduleId: r.furniture.id,
          moduleLabel: r.label,
          part: p.label,
          widthMm: p.widthMm,
          heightMm: p.heightMm,
          thicknessMm: p.thicknessMm,
          qty: p.qty,
          material: p.material,
          finish: p.finish,
          grain: p.grain,
        });
      }
    }
  }
  return {
    rows,
    totalPieces: total,
    truncated: rows.length >= CUT_LIST_MAX_ROWS,
    note: "Lista PRELIMINAR: usa as regras padrão da empresa e não substitui o plano de corte oficial do módulo de Produção.",
  };
}