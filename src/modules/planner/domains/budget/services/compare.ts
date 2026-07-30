/**
 * Etapa 12 — Comparação entre revisões (o que mudou e por quê).
 */
import type { BudgetDiffLine, ProjectBudget } from "../types";
import { money } from "./defaults";

function line(label: string, before: number, after: number): BudgetDiffLine {
  return { label, before, after, delta: money(after - before) };
}

export function compareBudgets(
  before: ProjectBudget,
  after: ProjectBudget,
): readonly BudgetDiffLine[] {
  return [
    line("Custo direto", before.totals.directCost, after.totals.directCost),
    line("Mão de obra", before.totals.laborCost, after.totals.laborCost),
    line("Custos indiretos", before.totals.overhead, after.totals.overhead),
    line("Margem", before.totals.margin, after.totals.margin),
    line("Impostos", before.totals.taxes, after.totals.taxes),
    line("Desconto", before.totals.discount, after.totals.discount),
    line("Preço final", before.totals.final, after.totals.final),
  ].filter((d) => Math.abs(d.delta) >= 0.01);
}

/** Itens que entraram, saíram ou mudaram de custo entre duas versões. */
export function compareItems(before: ProjectBudget, after: ProjectBudget) {
  const prev = new Map(before.items.map((i) => [i.id, i]));
  const next = new Map(after.items.map((i) => [i.id, i]));
  const added = after.items.filter((i) => !prev.has(i.id));
  const removed = before.items.filter((i) => !next.has(i.id));
  const changed = after.items.filter((i) => {
    const p = prev.get(i.id);
    if (!p) return false;
    return (p.totalCost ?? 0) !== (i.totalCost ?? 0) || p.quantityGross !== i.quantityGross;
  });
  return { added, removed, changed };
}