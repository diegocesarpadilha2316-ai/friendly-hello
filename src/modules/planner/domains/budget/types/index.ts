/**
 * Etapa 12 — Contrato canônico do Orçamento Profissional.
 *
 * FONTE ÚNICA DE VERDADE do orçamento. Nenhum outro arquivo pode declarar
 * a forma de um item, de um total ou de uma revisão de orçamento.
 *
 * Regras absolutas:
 *  - Unidade monetária: BRL, sempre com 2 casas (arredondamento no final).
 *  - Quantidade líquida (`quantityNet`) NUNCA inclui perda; a perda é
 *    aplicada explicitamente e exibida separada (`wastePct` → `quantityGross`).
 *  - Preço desconhecido é `null` + `pricingStatus: "ausente"`. O motor
 *    JAMAIS inventa um valor: o item entra no orçamento com custo nulo e
 *    o orçamento inteiro é marcado como incompleto.
 */

export type BudgetCategory =
  | "chapas"
  | "fitas"
  | "ferragens"
  | "vidros-espelhos"
  | "iluminacao"
  | "acabamentos"
  | "servicos"
  | "logistica"
  | "outros";

export type BudgetUnit = "un" | "pc" | "m" | "m2" | "chapa" | "h" | "kit" | "verba";

/** Confiabilidade do preço unitário aplicado. */
export type BudgetPricingStatus = "conhecido" | "estimado" | "ausente";

/** De onde a linha nasceu. */
export type BudgetItemSource = "producao" | "catalogo" | "manual";

export interface BudgetItem {
  /** Estável e idempotente: `${source}:${refId}`. Sobrevive a recálculos. */
  readonly id: string;
  readonly source: BudgetItemSource;
  readonly category: BudgetCategory;
  readonly name: string;
  /** Origem legível ("Balcão 900 · Cozinha") — auditoria. */
  readonly origin: string;
  readonly unit: BudgetUnit;
  /** Quantidade real necessária, sem perda. */
  readonly quantityNet: number;
  /** Percentual de perda aplicado (0–60). */
  readonly wastePct: number;
  /** quantityNet × (1 + wastePct/100), arredondado conforme a unidade. */
  readonly quantityGross: number;
  /** `null` ⇒ preço ausente. Nunca inventar. */
  readonly unitCost: number | null;
  readonly pricingStatus: BudgetPricingStatus;
  /** Rótulo da fonte do preço ("Catálogo Dioris", "Manual", "Padrão da empresa"). */
  readonly priceSource: string;
  /** `null` quando `unitCost` é `null`. */
  readonly totalCost: number | null;
  /** Preço ou quantidade editados manualmente pelo usuário. */
  readonly manualPrice: boolean;
  readonly manualQuantity: boolean;
  readonly note?: string;
}

export interface BudgetLaborLine {
  readonly id: string;
  readonly label: string;
  readonly hours: number;
  readonly ratePerHour: number;
  readonly total: number;
}

export interface BudgetLabor {
  readonly lines: readonly BudgetLaborLine[];
  readonly totalHours: number;
  readonly total: number;
}

/** Como a remuneração é aplicada sobre o custo. */
export type BudgetMarginMode = "margem" | "markup";
export type BudgetDiscountMode = "percent" | "valor";

export interface BudgetSettings {
  readonly currency: "BRL";
  /** Perda por categoria (%). */
  readonly wastePctByCategory: Readonly<Record<BudgetCategory, number>>;
  /** Preço da chapa cheia (R$/chapa) — usado quando o catálogo não cobre. */
  readonly boardPrice: number;
  readonly edgeTapePricePerM: number;
  readonly paintPricePerM2: number;
  readonly laborRatePerHour: number;
  /** Custos indiretos sobre o custo direto (%). */
  readonly overheadPct: number;
  readonly marginMode: BudgetMarginMode;
  readonly marginPct: number;
  readonly taxPct: number;
  readonly discountMode: BudgetDiscountMode;
  readonly discountValue: number;
  readonly freightValue: number;
  readonly installationValue: number;
}

export interface BudgetTotals {
  /** Materiais + ferragens + insumos (sem mão de obra). */
  readonly directCost: number;
  readonly laborCost: number;
  readonly logisticsCost: number;
  /** directCost + laborCost + logisticsCost */
  readonly baseCost: number;
  readonly overhead: number;
  /** baseCost + overhead */
  readonly fullCost: number;
  readonly margin: number;
  readonly taxes: number;
  readonly discount: number;
  /** Preço final ao cliente. */
  readonly final: number;
  /** Preço por m² de chapa processada (0 quando não há área). */
  readonly perM2: number;
  /** Resultado esperado (final − impostos − custo cheio − desconto). */
  readonly profit: number;
  readonly profitPct: number;
  /** Itens sem preço conhecido. */
  readonly missingPriceCount: number;
  /** % do custo direto coberto por preço conhecido. */
  readonly priceCoveragePct: number;
}

/** Overrides do usuário — preservados entre recálculos. */
export interface BudgetOverrides {
  readonly unitCost: Readonly<Record<string, number>>;
  readonly quantity: Readonly<Record<string, number>>;
  readonly wastePct: Readonly<Record<string, number>>;
  readonly excluded: readonly string[];
  readonly extras: readonly BudgetItem[];
  readonly note: Readonly<Record<string, string>>;
}

export interface ProjectBudget {
  readonly version: 1;
  readonly budgetId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly clientName: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly calculatedAt: string;
  /** Assinatura do projeto no momento do cálculo — detecta desatualização. */
  readonly projectSignature: string;
  readonly items: readonly BudgetItem[];
  readonly labor: BudgetLabor;
  readonly settings: BudgetSettings;
  readonly totals: BudgetTotals;
  /** Orçamento incompleto: existe preço ausente. */
  readonly complete: boolean;
  readonly warnings: readonly string[];
  readonly assumptions: readonly string[];
}

export interface BudgetRevisionEntry {
  readonly revision: number;
  readonly createdAt: string;
  readonly label: string;
  readonly final: number;
  readonly snapshot: ProjectBudget;
}

export interface BudgetRecord {
  readonly current: ProjectBudget | null;
  readonly overrides: BudgetOverrides;
  readonly settings: BudgetSettings | null;
  readonly revisions: readonly BudgetRevisionEntry[];
}

export interface BudgetDiffLine {
  readonly label: string;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
}
