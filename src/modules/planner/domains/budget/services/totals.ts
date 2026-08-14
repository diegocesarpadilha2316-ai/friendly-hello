/**
 * Etapa 12 — Fechamento financeiro canônico.
 *
 * Ordem imutável do cálculo:
 *   custo direto → mão de obra → logística → custos indiretos →
 *   remuneração (margem OU markup) → desconto → impostos → preço final.
 *
 * Itens sem preço NUNCA entram como zero silencioso: são contados em
 * `missingPriceCount` e reduzem a `priceCoveragePct`.
 */
import type { BudgetItem, BudgetLabor, BudgetSettings, BudgetTotals } from "../types";
import { money } from "./defaults";

export function computeTotals(
  items: readonly BudgetItem[],
  labor: BudgetLabor,
  settings: BudgetSettings,
  processedAreaM2: number,
): BudgetTotals {
  let directCost = 0;
  let missingPriceCount = 0;
  let pricedLines = 0;
  for (const it of items) {
    if (it.totalCost == null) {
      missingPriceCount += 1;
      continue;
    }
    pricedLines += 1;
    directCost += it.totalCost;
  }
  directCost = money(directCost);

  const laborCost = money(labor.total);
  const logisticsCost = money(settings.freightValue + settings.installationValue);
  const baseCost = money(directCost + laborCost + logisticsCost);
  const overhead = money(baseCost * (settings.overheadPct / 100));
  const fullCost = money(baseCost + overhead);

  // margem = sobre o preço de venda; markup = sobre o custo.
  const m = Math.min(Math.max(settings.marginPct, 0), 95) / 100;
  const priceBeforeTax =
    settings.marginMode === "margem" ? money(fullCost / (1 - m || 1)) : money(fullCost * (1 + m));
  const margin = money(priceBeforeTax - fullCost);

  const discount =
    settings.discountMode === "percent"
      ? money(priceBeforeTax * (Math.min(Math.max(settings.discountValue, 0), 100) / 100))
      : money(Math.max(settings.discountValue, 0));
  const netBeforeTax = money(Math.max(priceBeforeTax - discount, 0));

  const t = Math.min(Math.max(settings.taxPct, 0), 60) / 100;
  // Imposto por dentro: preserva o líquido esperado após tributação.
  const final = money(t > 0 ? netBeforeTax / (1 - t) : netBeforeTax);
  const taxes = money(final - netBeforeTax);

  const profit = money(final - taxes - fullCost);
  const profitPct = final > 0 ? Math.round((profit / final) * 1000) / 10 : 0;
  const perM2 = processedAreaM2 > 0 ? money(final / processedAreaM2) : 0;
  const totalLines = pricedLines + missingPriceCount;
  const priceCoveragePct =
    totalLines > 0 ? Math.round((pricedLines / totalLines) * 1000) / 10 : 100;

  return {
    directCost,
    laborCost,
    logisticsCost,
    baseCost,
    overhead,
    fullCost,
    margin,
    taxes,
    discount,
    final,
    perM2,
    profit,
    profitPct,
    missingPriceCount,
    priceCoveragePct,
  };
}
