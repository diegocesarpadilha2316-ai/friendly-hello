/**
 * Etapa 12 — Motor do Orçamento Profissional.
 *
 * Determinístico e idempotente: mesma entrada ⇒ mesmo orçamento.
 * Overrides do usuário (preço, quantidade, perda, exclusão, extras) são
 * reaplicados por `id` estável a cada recálculo, então recalcular NUNCA
 * apaga o trabalho manual.
 */
import type {
  BudgetItem,
  BudgetLabor,
  BudgetOverrides,
  BudgetSettings,
  ProjectBudget,
} from "../types";
import { CATEGORY_LABEL, money } from "./defaults";
import { quantify, processedAreaM2, type QuantifyInput } from "./quantify";
import { computeTotals } from "./totals";

export interface CalculateInput extends Omit<QuantifyInput, "settings"> {
  readonly tenantId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly clientName: string;
  readonly projectSignature: string;
  readonly settings: BudgetSettings;
  readonly overrides: BudgetOverrides;
  readonly time: {
    readonly cuttingH: number;
    readonly machiningH: number;
    readonly assemblyH: number;
    readonly finishingH: number;
    readonly totalH: number;
  };
  /** Revisão e datas preservadas de um orçamento anterior. */
  readonly previous?: ProjectBudget | null;
}

export const EMPTY_OVERRIDES: BudgetOverrides = {
  unitCost: {},
  quantity: {},
  wastePct: {},
  excluded: [],
  extras: [],
  note: {},
};

function applyOverrides(items: readonly BudgetItem[], ov: BudgetOverrides): BudgetItem[] {
  const excluded = new Set(ov.excluded);
  const out: BudgetItem[] = [];
  for (const base of items) {
    if (excluded.has(base.id)) continue;
    let item = base;
    const qty = ov.quantity[base.id];
    const wastePct = ov.wastePct[base.id];
    const price = ov.unitCost[base.id];
    const note = ov.note[base.id];

    if (typeof wastePct === "number" && wastePct >= 0) {
      item = { ...item, wastePct };
    }
    if (typeof qty === "number" && qty >= 0) {
      item = { ...item, quantityNet: qty, manualQuantity: true };
    }
    // recompõe a quantidade bruta sempre que quantidade ou perda mudaram
    if (item !== base) {
      const raw = item.quantityNet * (1 + item.wastePct / 100);
      const discrete = ["un", "pc", "chapa", "kit"].includes(item.unit);
      item = {
        ...item,
        quantityGross: discrete ? Math.ceil(raw - 1e-9) : Math.round(raw * 100) / 100,
      };
    }
    if (typeof price === "number" && price >= 0) {
      item = {
        ...item,
        unitCost: money(price),
        pricingStatus: "conhecido",
        priceSource: "Preço informado pelo usuário",
        manualPrice: true,
      };
    }
    if (note) item = { ...item, note };

    item = {
      ...item,
      totalCost: item.unitCost == null ? null : money(item.unitCost * item.quantityGross),
    };
    out.push(item);
  }
  for (const extra of ov.extras) {
    if (excluded.has(extra.id)) continue;
    out.push({
      ...extra,
      totalCost: extra.unitCost == null ? null : money(extra.unitCost * extra.quantityGross),
    });
  }
  return out;
}

function buildLabor(input: CalculateInput): BudgetLabor {
  const rate = input.settings.laborRatePerHour;
  const raw = [
    { id: "corte", label: "Corte e usinagem", hours: input.time.cuttingH + input.time.machiningH },
    { id: "montagem", label: "Montagem de módulos", hours: input.time.assemblyH },
    { id: "acabamento", label: "Acabamento e revisão", hours: input.time.finishingH },
  ];
  const lines = raw
    .filter((l) => l.hours > 0)
    .map((l) => ({
      id: l.id,
      label: l.label,
      hours: Math.round(l.hours * 10) / 10,
      ratePerHour: rate,
      total: money(l.hours * rate),
    }));
  return {
    lines,
    totalHours: Math.round(lines.reduce((a, l) => a + l.hours, 0) * 10) / 10,
    total: money(lines.reduce((a, l) => a + l.total, 0)),
  };
}

export function calculateBudget(input: CalculateInput): ProjectBudget {
  const base = quantify({
    parts: input.parts,
    hardware: input.hardware,
    boardsCount: input.boardsCount,
    settings: input.settings,
    materialPricePerM2: input.materialPricePerM2,
  });
  const items = applyOverrides(base, input.overrides);
  const labor = buildLabor(input);
  const area = processedAreaM2(input.parts);
  const totals = computeTotals(items, labor, input.settings, area);

  const warnings: string[] = [];
  const missing = items.filter((i) => i.totalCost == null);
  if (missing.length > 0) {
    warnings.push(
      `${missing.length} item(ns) sem preço cadastrado — o total está incompleto: ${missing
        .slice(0, 4)
        .map((i) => i.name)
        .join(", ")}${missing.length > 4 ? "…" : ""}.`,
    );
  }
  const estimated = items.filter((i) => i.pricingStatus === "estimado");
  if (estimated.length > 0) {
    warnings.push(`${estimated.length} item(ns) usando preço estimado (padrão da empresa).`);
  }
  if (items.length === 0) warnings.push("Nenhum módulo produzível no projeto — nada a orçar.");
  if (input.settings.marginMode === "margem" && input.settings.marginPct >= 60) {
    warnings.push("Margem acima de 60% sobre o preço de venda — confirme a política comercial.");
  }

  const assumptions: string[] = [
    `Perdas aplicadas por categoria: ${Object.entries(input.settings.wastePctByCategory)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${CATEGORY_LABEL[k as keyof typeof CATEGORY_LABEL]} ${v}%`)
      .join(" · ")}.`,
    `Mão de obra a ${money(input.settings.laborRatePerHour)} R$/h sobre ${labor.totalHours} h estimadas pelo motor de produção.`,
    `Custos indiretos de ${input.settings.overheadPct}% sobre o custo base.`,
    input.settings.marginMode === "margem"
      ? `Remuneração como margem de ${input.settings.marginPct}% sobre o preço de venda.`
      : `Remuneração como markup de ${input.settings.marginPct}% sobre o custo.`,
    `Impostos de ${input.settings.taxPct}% calculados por dentro do preço final.`,
  ];

  const now = new Date().toISOString();
  return {
    version: 1,
    budgetId: input.previous?.budgetId ?? `bud_${input.projectId}`,
    tenantId: input.tenantId,
    projectId: input.projectId,
    projectName: input.projectName,
    clientName: input.clientName,
    revision: input.previous?.revision ?? 1,
    createdAt: input.previous?.createdAt ?? now,
    updatedAt: now,
    calculatedAt: now,
    projectSignature: input.projectSignature,
    items,
    labor,
    settings: input.settings,
    totals,
    complete: missing.length === 0 && items.length > 0,
    warnings,
    assumptions,
  };
}
