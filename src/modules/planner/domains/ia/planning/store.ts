/**
 * Etapa 11 — persistência mínima do plano ativo.
 *
 * Zero banco, zero migration: apenas `localStorage`, isolado por
 * tenant + projeto (mesma política da Memória Inteligente da Etapa 10).
 * O objetivo é único: garantir idempotência entre reloads — um plano
 * que estava executando volta como `paused`, nunca reexecuta sozinho, e
 * as etapas já concluídas permanecem concluídas.
 */
import type { PlanStep, ProjectPlan } from "./types";

const PREFIX = "dioris.planner.plan";

function key(tenantId: string, projectId: string): string {
  return `${PREFIX}.${tenantId}.${projectId}`;
}

function safeParse(raw: string | null): ProjectPlan | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProjectPlan;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Nenhum plano retomado do storage pode continuar "executando" sozinho. */
function coldStart(plan: ProjectPlan): ProjectPlan {
  const steps: PlanStep[] = plan.steps.map((s) =>
    s.status === "running" ? { ...s, status: "pending" } : s,
  );
  const status = plan.status === "executing" ? "paused" : plan.status;
  return { ...plan, steps, status };
}

export function readStoredPlan(tenantId: string, projectId: string | null): ProjectPlan | null {
  if (typeof window === "undefined" || !projectId) return null;
  try {
    const plan = safeParse(window.localStorage.getItem(key(tenantId, projectId)));
    if (!plan) return null;
    if (plan.tenantId !== tenantId || plan.projectId !== projectId) return null;
    return coldStart(plan);
  } catch {
    return null;
  }
}

export function writeStoredPlan(
  plan: ProjectPlan | null,
  tenantId: string,
  projectId: string | null,
): void {
  if (typeof window === "undefined" || !projectId) return;
  try {
    const k = key(tenantId, projectId);
    if (!plan) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, JSON.stringify(plan));
  } catch {
    /* storage indisponível — o plano continua funcionando em memória */
  }
}

export function clearStoredPlan(tenantId: string, projectId: string | null): void {
  writeStoredPlan(null, tenantId, projectId);
}
