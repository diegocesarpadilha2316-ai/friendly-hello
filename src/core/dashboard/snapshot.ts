/**
 * Fonte única de dados temporários do Dashboard.
 * Enquanto os módulos não expõem seus próprios services, o snapshot é vazio —
 * porém tipado. Módulos futuros substituem partes via `buildSnapshot`.
 *
 * NUNCA use dados mockados espalhados por widgets: sempre passe pelo snapshot.
 */
import type { DashboardSnapshot } from "./types";

export function emptySnapshot(params: { tenantId: string }): DashboardSnapshot {
  return {
    credits: { available: 0, used: 0, resetsAt: null },
    plan: { key: "free", label: "Free", status: "active", renewsAt: null },
    aiToday: { requests: 0, creditsSpent: 0, byCapability: [] },
    recentProjects: [],
    activity: [],
    upcoming: [],
    usage: [],
    kpis: [],
    charts: [],
    meta: {
      tenantId: params.tenantId,
      generatedAt: new Date().toISOString(),
      warming: true,
    },
  };
}
