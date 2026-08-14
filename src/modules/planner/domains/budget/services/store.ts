/**
 * Etapa 12 — Persistência local do orçamento.
 *
 * Zero banco, zero migration: `localStorage` isolado por tenant + projeto
 * (`dioris.planner.budget.<tenant>.<projeto>`), mesmo padrão da memória
 * do projeto (Etapa 10). O orçamento nunca vaza entre empresas.
 */
import type {
  BudgetOverrides,
  BudgetRecord,
  BudgetRevisionEntry,
  BudgetSettings,
  ProjectBudget,
} from "../types";
import { EMPTY_OVERRIDES } from "./calculate";

const PREFIX = "dioris.planner.budget";
const MAX_REVISIONS = 20;

export function budgetKey(tenantId: string, projectId: string): string {
  return `${PREFIX}.${tenantId}.${projectId}`;
}

const cache = new Map<string, BudgetRecord>();
const listeners = new Map<string, Set<() => void>>();

function emptyRecord(): BudgetRecord {
  return { current: null, overrides: EMPTY_OVERRIDES, settings: null, revisions: [] };
}

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function subscribeBudget(tenantId: string, projectId: string, fn: () => void): () => void {
  const key = budgetKey(tenantId, projectId);
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(fn);
  listeners.set(key, set);
  return () => set.delete(fn);
}

export function loadBudgetRecord(tenantId: string, projectId: string): BudgetRecord {
  const key = budgetKey(tenantId, projectId);
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof window === "undefined") return emptyRecord();
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Partial<BudgetRecord>) : null;
    const record: BudgetRecord = {
      current: parsed?.current ?? null,
      overrides: { ...EMPTY_OVERRIDES, ...(parsed?.overrides ?? {}) },
      settings: parsed?.settings ?? null,
      revisions: parsed?.revisions ?? [],
    };
    cache.set(key, record);
    return record;
  } catch {
    return emptyRecord();
  }
}

function persist(tenantId: string, projectId: string, record: BudgetRecord): BudgetRecord {
  const key = budgetKey(tenantId, projectId);
  cache.set(key, record);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch {
      /* cota excedida — o cache em runtime continua válido */
    }
  }
  emit(key);
  return record;
}

export function saveCurrentBudget(
  tenantId: string,
  projectId: string,
  budget: ProjectBudget,
): BudgetRecord {
  const prev = loadBudgetRecord(tenantId, projectId);
  return persist(tenantId, projectId, { ...prev, current: budget, settings: budget.settings });
}

export function saveOverrides(
  tenantId: string,
  projectId: string,
  overrides: BudgetOverrides,
): BudgetRecord {
  const prev = loadBudgetRecord(tenantId, projectId);
  return persist(tenantId, projectId, { ...prev, overrides });
}

export function saveSettings(
  tenantId: string,
  projectId: string,
  settings: BudgetSettings,
): BudgetRecord {
  const prev = loadBudgetRecord(tenantId, projectId);
  return persist(tenantId, projectId, { ...prev, settings });
}

/** Congela a revisão atual e abre a próxima. */
export function commitRevision(
  tenantId: string,
  projectId: string,
  budget: ProjectBudget,
  label: string,
): BudgetRecord {
  const prev = loadBudgetRecord(tenantId, projectId);
  const entry: BudgetRevisionEntry = {
    revision: budget.revision,
    createdAt: new Date().toISOString(),
    label: label.trim() || `Revisão ${budget.revision}`,
    final: budget.totals.final,
    snapshot: budget,
  };
  const next: ProjectBudget = {
    ...budget,
    revision: budget.revision + 1,
    updatedAt: entry.createdAt,
  };
  return persist(tenantId, projectId, {
    ...prev,
    current: next,
    settings: next.settings,
    revisions: [entry, ...prev.revisions].slice(0, MAX_REVISIONS),
  });
}

export function clearBudget(tenantId: string, projectId: string): BudgetRecord {
  return persist(tenantId, projectId, emptyRecord());
}
