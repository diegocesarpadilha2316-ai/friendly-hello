const PREFIX = "dioris.planner.plan";
function key(tenantId, projectId) {
  return `${PREFIX}.${tenantId}.${projectId}`;
}
function safeParse(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}
/** Nenhum plano retomado do storage pode continuar "executando" sozinho. */
function coldStart(plan) {
  const steps = plan.steps.map((s) => (s.status === "running" ? { ...s, status: "pending" } : s));
  const status = plan.status === "executing" ? "paused" : plan.status;
  return { ...plan, steps, status };
}
export function readStoredPlan(tenantId, projectId) {
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
export function writeStoredPlan(plan, tenantId, projectId) {
  if (typeof window === "undefined" || !projectId) return;
  try {
    const k = key(tenantId, projectId);
    if (!plan) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, JSON.stringify(plan));
  } catch {
    /* storage indisponível — o plano continua funcionando em memória */
  }
}
export function clearStoredPlan(tenantId, projectId) {
  writeStoredPlan(null, tenantId, projectId);
}
