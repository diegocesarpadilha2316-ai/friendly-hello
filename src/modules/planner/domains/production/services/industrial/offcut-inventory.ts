/**
 * Inventário de sobras — persistência local por tenant.
 * Padrão de `company-rules.ts` (localStorage, sem provider/store novos).
 */
import type { FabricationPlan } from "../fabrication";
import type { OffcutInventoryItem } from "./types";

const KEY = (tenantId: string) => `dioris.production.offcuts.${tenantId}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadOffcuts(tenantId: string): OffcutInventoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OffcutInventoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOffcuts(tenantId: string, items: readonly OffcutInventoryItem[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY(tenantId), JSON.stringify(items));
}

export function registerOffcutsFromPlan(
  tenantId: string,
  projectId: string,
  projectName: string,
  plan: FabricationPlan,
  material = "MDF Duratex",
  brand = "Duratex",
  color = "Branco TX",
  thicknessMm = 18,
): OffcutInventoryItem[] {
  const existing = loadOffcuts(tenantId);
  const existingKeys = new Set(existing.map((o) => o.id));
  const now = new Date().toISOString();
  const created: OffcutInventoryItem[] = [];
  plan.boards.forEach((board) => {
    board.offcuts.forEach((rect, idx) => {
      const id = `${projectId}-b${board.index}-o${idx}`;
      if (existingKeys.has(id)) return;
      created.push({
        id,
        tenantId,
        projectId,
        projectName,
        material,
        brand,
        color,
        thicknessMm,
        lengthMm: Math.round(rect.w),
        widthMm: Math.round(rect.h),
        areaM2: rect.areaM2,
        createdAt: now,
        origin: "plano-corte",
        status: "disponivel",
      });
    });
  });
  const next = [...existing, ...created];
  saveOffcuts(tenantId, next);
  return next;
}

export function updateOffcutStatus(
  tenantId: string,
  id: string,
  status: OffcutInventoryItem["status"],
): OffcutInventoryItem[] {
  const list = loadOffcuts(tenantId).map((o) => (o.id === id ? { ...o, status } : o));
  saveOffcuts(tenantId, list);
  return list;
}

export function removeOffcut(tenantId: string, id: string): OffcutInventoryItem[] {
  const list = loadOffcuts(tenantId).filter((o) => o.id !== id);
  saveOffcuts(tenantId, list);
  return list;
}

export function clearOffcuts(tenantId: string): void {
  saveOffcuts(tenantId, []);
}
