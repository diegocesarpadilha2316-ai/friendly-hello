/**
 * Etapa 12 — Padrões do Orçamento Profissional.
 *
 * Todo padrão aqui é uma ASSUNÇÃO explícita: aparece na lista de premissas
 * do orçamento e pode ser editado pelo usuário. Nenhum valor é silencioso.
 */
import type { BudgetCategory, BudgetSettings } from "../types";

export const BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  "chapas",
  "fitas",
  "ferragens",
  "vidros-espelhos",
  "iluminacao",
  "acabamentos",
  "servicos",
  "logistica",
  "outros",
];

export const CATEGORY_LABEL: Readonly<Record<BudgetCategory, string>> = {
  chapas: "Chapas e painéis",
  fitas: "Fitas de borda",
  ferragens: "Ferragens",
  "vidros-espelhos": "Vidros e espelhos",
  iluminacao: "Iluminação",
  acabamentos: "Acabamentos e pintura",
  servicos: "Serviços",
  logistica: "Logística e montagem",
  outros: "Outros",
};

/** Perdas típicas de marcenaria (%) — auditáveis e editáveis. */
export const DEFAULT_WASTE: Readonly<Record<BudgetCategory, number>> = {
  chapas: 12,
  fitas: 10,
  ferragens: 2,
  "vidros-espelhos": 8,
  iluminacao: 5,
  acabamentos: 10,
  servicos: 0,
  logistica: 0,
  outros: 0,
};

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  currency: "BRL",
  wastePctByCategory: DEFAULT_WASTE,
  boardPrice: 480,
  edgeTapePricePerM: 3.2,
  paintPricePerM2: 78,
  laborRatePerHour: 62,
  overheadPct: 8,
  marginMode: "margem",
  marginPct: 22,
  taxPct: 8.5,
  discountMode: "percent",
  discountValue: 0,
  freightValue: 0,
  installationValue: 0,
};

export function mergeSettings(
  base: BudgetSettings,
  patch: Partial<BudgetSettings> | null | undefined,
): BudgetSettings {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    wastePctByCategory: { ...base.wastePctByCategory, ...(patch.wastePctByCategory ?? {}) },
  };
}

export function money(v: number): number {
  return Math.round(v * 100) / 100;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}