/**
 * Etapa 12 — Exportação do orçamento.
 *
 * Duas visões distintas e nunca misturadas:
 *  - INTERNA: custos, perdas, mão de obra, margem — só para a empresa.
 *  - COMERCIAL: escopo, condições e preço final — o que o cliente vê.
 */
import type { ProjectBudget } from "../types";
import { CATEGORY_LABEL, formatBRL } from "./defaults";

function csvEscape(v: string | number | null): string {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV interno completo (auditoria). */
export function budgetToCsv(budget: ProjectBudget): string {
  const head = [
    "Categoria",
    "Item",
    "Origem",
    "Unidade",
    "Qtd líquida",
    "Perda %",
    "Qtd bruta",
    "Custo unit.",
    "Status do preço",
    "Fonte",
    "Total",
  ];
  const rows = budget.items.map((i) =>
    [
      CATEGORY_LABEL[i.category],
      i.name,
      i.origin,
      i.unit,
      i.quantityNet,
      i.wastePct,
      i.quantityGross,
      i.unitCost ?? "",
      i.pricingStatus,
      i.priceSource,
      i.totalCost ?? "",
    ].map(csvEscape),
  );
  const t = budget.totals;
  const footer = [
    [],
    ["Custo direto", t.directCost],
    ["Mão de obra", t.laborCost],
    ["Logística", t.logisticsCost],
    ["Custos indiretos", t.overhead],
    ["Margem", t.margin],
    ["Desconto", -t.discount],
    ["Impostos", t.taxes],
    ["PREÇO FINAL", t.final],
  ].map((r) => r.map(csvEscape));
  return [head.map(csvEscape), ...rows, ...footer].map((r) => r.join(";")).join("\n");
}

export function downloadCsv(budget: ProjectBudget): void {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF", budgetToCsv(budget)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orcamento-${budget.projectName.replace(/\s+/g, "-").toLowerCase()}-r${budget.revision}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** HTML da proposta comercial — sem custos internos, perdas ou margem. */
export function commercialProposalHtml(budget: ProjectBudget, validityDays = 15): string {
  const groups = new Map<string, number>();
  for (const item of budget.items) {
    const label = CATEGORY_LABEL[item.category];
    groups.set(label, (groups.get(label) ?? 0) + (item.totalCost ?? 0));
  }
  const scope = [...groups.keys()]
    .map((label) => `<li>${label}</li>`)
    .join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Proposta — ${budget.projectName}</title>
<style>
 body{font-family:system-ui,sans-serif;color:#0f172a;margin:40px;line-height:1.55}
 h1{font-size:22px;margin:0 0 4px} .muted{color:#64748b;font-size:13px}
 .total{margin-top:28px;padding:18px 20px;background:#0f172a;color:#fff;border-radius:12px}
 .total strong{font-size:28px;display:block}
 ul{padding-left:18px} li{margin:2px 0}
 table{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}
 td{padding:6px 0;border-bottom:1px solid #e2e8f0}
</style></head><body>
<h1>Proposta comercial</h1>
<div class="muted">${budget.projectName} · Cliente: ${budget.clientName} · Revisão ${budget.revision}</div>
<h3>Escopo incluído</h3><ul>${scope}</ul>
<table>
 <tr><td>Validade da proposta</td><td style="text-align:right">${validityDays} dias</td></tr>
 <tr><td>Prazo estimado de produção</td><td style="text-align:right">${Math.max(
   5,
   Math.ceil(budget.labor.totalHours / 8),
 )} dias úteis</td></tr>
 <tr><td>Impostos</td><td style="text-align:right">inclusos</td></tr>
</table>
<div class="total"><span>Investimento total</span><strong>${formatBRL(budget.totals.final)}</strong></div>
<p class="muted">Proposta gerada pelo Dioris Planner em ${new Date(budget.updatedAt).toLocaleDateString("pt-BR")}.
Valores sujeitos a confirmação de medidas em campo.</p>
</body></html>`;
}

export function printCommercialProposal(budget: ProjectBudget): void {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(commercialProposalHtml(budget));
  win.document.close();
  win.focus();
  win.print();
}