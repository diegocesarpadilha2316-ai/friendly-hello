/**
 * Persistência de regras de fabricação por empresa (Fase 3.5).
 * `localStorage` por tenant — nenhum provider novo.
 */
import type { CompanyManufacturingRules } from "./types";

const KEY = (tenantId: string) => `dioris.planner.mfg-rules.${tenantId}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function defaultRules(tenantId: string): CompanyManufacturingRules {
  return {
    tenantId,
    label: "Padrão Dioris",
    defaults: {
      thicknessMm: 18,
      backThicknessMm: 6,
      clearanceMm: 3,
      reveal: 2,
      edge: "pvc-1-0",
      grain: "vertical",
      back: "encaixado",
      base: "pe",
      assembly: "minifix",
      door: "lisa",
      drawer: "padrao",
      handle: "cava",
      brandId: "duratex",
      finishId: "branco-tx",
      hardware: {
        dobradica: "blum-clip-top",
        corredica: "blum-tandembox",
        pistao: "blum-aventos-hf",
        puxador: "dioris-cava-128",
        amortecedor: "blum-blumotion",
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function loadRules(tenantId: string): CompanyManufacturingRules {
  if (!isBrowser()) return defaultRules(tenantId);
  try {
    const raw = window.localStorage.getItem(KEY(tenantId));
    if (!raw) return defaultRules(tenantId);
    const parsed = JSON.parse(raw) as Partial<CompanyManufacturingRules>;
    const d = defaultRules(tenantId);
    return {
      ...d,
      ...parsed,
      tenantId,
      defaults: {
        ...d.defaults,
        ...(parsed.defaults ?? {}),
        hardware: { ...d.defaults.hardware, ...(parsed.defaults?.hardware ?? {}) },
      },
    };
  } catch {
    return defaultRules(tenantId);
  }
}

export function saveRules(rules: CompanyManufacturingRules): void {
  if (!isBrowser()) return;
  const next: CompanyManufacturingRules = { ...rules, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(KEY(rules.tenantId), JSON.stringify(next));
}

export function resetRules(tenantId: string): CompanyManufacturingRules {
  const d = defaultRules(tenantId);
  saveRules(d);
  return d;
}
