/** Limites de segurança (Parte 19). */
export const PLAN_LIMITS = {
    maxSteps: 24,
    maxMutatingSteps: 18,
    maxDestructiveSteps: 2,
    maxAttemptsPerStep: 2,
    maxArgsChars: 4000,
    maxPlansPerProject: 3,
};
export function planProgress(plan) {
    if (!plan.steps.length)
        return 0;
    const done = plan.steps.filter((s) => s.status === "completed" || s.status === "skipped" || s.status === "cancelled").length;
    return Math.round((done / plan.steps.length) * 100);
}
export function isPlanTerminal(status) {
    return (status === "completed" ||
        status === "partially_completed" ||
        status === "cancelled" ||
        status === "failed");
}
