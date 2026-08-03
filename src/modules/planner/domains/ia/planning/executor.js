import { runPlannerTool } from "../tools/runner";
import { isStepUnlocked, refreshBlocked } from "./graph";
import { buildFinalReport } from "./report";
import { PLAN_LIMITS, isPlanTerminal, planProgress, } from "./types";
const TERMINAL_STEP = [
    "completed",
    "skipped",
    "cancelled",
    "failed",
    "rolled_back",
];
export const stepToolCallId = (planId, stepId) => `${planId}::${stepId}`;
export function planProgressOf(plan) {
    const total = plan.steps.length;
    const done = plan.steps.filter((s) => TERMINAL_STEP.includes(s.status)).length;
    const running = plan.steps.find((s) => s.status === "running");
    const next = plan.steps.find((s) => s.status === "pending" || s.status === "blocked");
    const focus = running ?? next ?? null;
    return {
        current: Math.min(total, running ? done + 1 : done),
        total,
        percent: planProgress(plan),
        agent: focus?.agent ?? null,
        tool: focus?.toolName ?? null,
        title: focus?.title ?? null,
        warnings: plan.steps.flatMap((s) => s.warnings),
        failures: plan.steps
            .filter((s) => s.status === "failed")
            .map((s) => `${s.title}: ${s.result?.summary ?? "falha desconhecida"}`),
    };
}
function patchStep(plan, stepId, patch) {
    const steps = plan.steps.map((s) => (s.stepId === stepId ? { ...s, ...patch } : s));
    return { ...plan, steps, updatedAt: new Date().toISOString() };
}
/** Checkpoint só para impacto alto, destrutivo ou várias mutações. */
export function planNeedsCheckpoint(plan) {
    if (plan.needsCheckpoint)
        return true;
    if (plan.estimatedImpact === "alto" || plan.estimatedImpact === "destrutivo")
        return true;
    return plan.steps.filter((s) => s.mutating).length >= 3;
}
/**
 * Executor sequencial com pausa/retomada/cancelamento reais.
 * Uma instância por plano; o hook mantém a instância viva.
 */
export class PlanRunner {
    options;
    plan;
    paused = false;
    cancelled = false;
    running = false;
    controller = null;
    checkpointProject = null;
    constructor(options) {
        this.options = options;
        this.plan = options.plan;
    }
    get current() {
        return this.plan;
    }
    get isRunning() {
        return this.running;
    }
    get checkpoint() {
        return this.checkpointProject;
    }
    emit(next) {
        this.plan = next;
        this.options.onUpdate(next);
    }
    setPlan(patch) {
        this.emit({ ...this.plan, ...patch, updatedAt: new Date().toISOString() });
    }
    pause() {
        if (!this.running)
            return;
        this.paused = true;
        this.setPlan({ status: "paused" });
    }
    cancel() {
        this.cancelled = true;
        this.controller?.abort();
        const steps = this.plan.steps.map((s) => s.status === "pending" || s.status === "blocked" || s.status === "running"
            ? { ...s, status: "cancelled" }
            : s);
        const partial = steps.some((s) => s.status === "completed");
        this.emit({
            ...this.plan,
            steps,
            status: "cancelled",
            finalReport: buildFinalReport({ ...this.plan, steps }, partial ? "cancelled" : "cancelled"),
            updatedAt: new Date().toISOString(),
        });
    }
    /** Confirmação explícita do usuário (impacto alto/destrutivo). */
    confirm() {
        this.setPlan({ confirmed: true, status: "ready" });
    }
    /**
     * Registra as respostas do usuário para as informações pendentes e
     * libera o plano. Nenhuma pergunta pode deixar o fluxo parado: depois
     * de responder (ou de decidir seguir com as suposições), o plano volta
     * para `ready` e pode executar automaticamente.
     */
    answerMissing(answer) {
        const missingInformation = this.plan.missingInformation.map((m) => m.answer ? m : { ...m, answer: answer?.trim() || "assumir padrão" });
        this.emit({
            ...this.plan,
            missingInformation,
            status: isPlanTerminal(this.plan.status) ? this.plan.status : "ready",
            updatedAt: new Date().toISOString(),
        });
    }
    /** Remove uma etapa opcional antes da execução (edição do plano). */
    removeStep(stepId) {
        const target = this.plan.steps.find((s) => s.stepId === stepId);
        if (!target || !target.optional || target.status !== "pending")
            return;
        const steps = refreshBlocked(this.plan.steps.map((s) => (s.stepId === stepId ? { ...s, status: "skipped" } : s)));
        this.emit({ ...this.plan, steps, updatedAt: new Date().toISOString() });
    }
    /** Retomada — só reexecuta o que ainda não concluiu. */
    async resume() {
        this.paused = false;
        this.cancelled = false;
        return this.run();
    }
    /** Retry: apenas etapas que falharam voltam para `pending`. */
    async retryFailed() {
        const steps = this.plan.steps.map((s) => s.status === "failed" && s.attempts < PLAN_LIMITS.maxAttemptsPerStep
            ? { ...s, status: "pending", warnings: [] }
            : s);
        this.emit({ ...this.plan, steps, status: "ready", updatedAt: new Date().toISOString() });
        this.paused = false;
        this.cancelled = false;
        return this.run();
    }
    /**
     * Reinicia um plano terminal usando as mesmas etapas, mas com uma nova
     * identidade de execução. Isso evita colisão com a idempotência da
     * tentativa anterior e faz o botão "Reiniciar plano" executar de verdade.
     */
    async restart() {
        const now = new Date().toISOString();
        const steps = this.plan.steps.map((step) => ({
            ...step,
            status: "pending",
            attempts: 0,
            result: undefined,
            warnings: [],
            startedAt: undefined,
            finishedAt: undefined,
        }));
        this.plan = {
            ...this.plan,
            planId: `${this.plan.planId}-retry-${Date.now().toString(36)}`,
            steps: refreshBlocked(steps),
            status: "ready",
            currentStepIndex: 0,
            finalReport: null,
            warnings: [],
            updatedAt: now,
        };
        this.paused = false;
        this.cancelled = false;
        this.checkpointProject = null;
        this.emit(this.plan);
        return this.run();
    }
    async run() {
        if (this.running)
            return this.plan;
        if (isPlanTerminal(this.plan.status))
            return this.plan;
        if (this.plan.missingInformation.some((m) => m.level === "obrigatoria" && !m.answer)) {
            this.setPlan({ status: "awaiting_information" });
            return this.plan;
        }
        if (this.plan.requiresConfirmation && !this.plan.confirmed) {
            this.setPlan({ status: "awaiting_confirmation" });
            return this.plan;
        }
        const baseProject = this.options.getProject();
        if (!baseProject) {
            this.setPlan({ status: "failed", warnings: [...this.plan.warnings, "Nenhum projeto ativo."] });
            return this.plan;
        }
        // Checkpoint único por plano — nunca um por ferramenta.
        if (!this.checkpointProject && planNeedsCheckpoint(this.plan)) {
            this.checkpointProject = baseProject;
            this.options.onCheckpoint?.(baseProject, this.plan.planId);
            this.setPlan({ checkpointId: this.plan.planId });
        }
        this.running = true;
        this.controller = new AbortController();
        this.emit({
            ...this.plan,
            status: "executing",
            steps: refreshBlocked(this.plan.steps),
            updatedAt: new Date().toISOString(),
        });
        let project = baseProject;
        try {
            for (;;) {
                if (this.cancelled)
                    break;
                if (this.paused) {
                    this.setPlan({ status: "paused" });
                    break;
                }
                // Ordem estrita: a próxima etapa é sempre a primeira pendente
                // com todas as dependências satisfeitas.
                const next = this.plan.steps.find((s) => (s.status === "pending" || s.status === "blocked") && isStepUnlocked(s, this.plan.steps));
                if (!next)
                    break;
                const index = this.plan.steps.findIndex((s) => s.stepId === next.stepId);
                this.emit(patchStep({ ...this.plan, currentStepIndex: index }, next.stepId, { status: "running", startedAt: new Date().toISOString(), attempts: next.attempts + 1 }));
                const outcome = await runPlannerTool({
                    tool: next.toolName,
                    args: next.args,
                    project,
                    ctx: this.options.ctx,
                    toolCallId: stepToolCallId(this.plan.planId, next.stepId),
                    tenantId: this.options.tenantId,
                    confirmed: this.plan.confirmed || !next.requiresConfirmation,
                    signal: this.controller.signal,
                });
                const result = outcome.result;
                if (result.ok && outcome.project !== project) {
                    project = outcome.project;
                    this.options.applyProject(project);
                }
                this.emit(patchStep(this.plan, next.stepId, {
                    status: result.ok ? "completed" : "failed",
                    result,
                    warnings: result.warnings,
                    finishedAt: new Date().toISOString(),
                }));
                if (!result.ok) {
                    // Falha interrompe o plano: nada é executado fora de ordem.
                    break;
                }
                this.emit({ ...this.plan, steps: refreshBlocked(this.plan.steps) });
            }
        }
        catch (error) {
            // Erro interno jamais pode travar a interface: a etapa corrente é
            // marcada como falha e o plano encerra em estado repetível.
            const message = error instanceof Error ? error.message : "Falha inesperada na execução.";
            const running = this.plan.steps.find((s) => s.status === "running");
            const steps = this.plan.steps.map((s) => s.stepId === running?.stepId
                ? { ...s, status: "failed", warnings: [...s.warnings, message] }
                : s);
            this.emit({
                ...this.plan,
                steps,
                warnings: [...this.plan.warnings, message],
                updatedAt: new Date().toISOString(),
            });
        }
        finally {
            this.running = false;
            this.controller = null;
        }
        return this.finalize();
    }
    finalize() {
        if (this.cancelled)
            return this.plan;
        if (this.paused)
            return this.plan;
        const steps = this.plan.steps;
        const failed = steps.some((s) => s.status === "failed");
        const pending = steps.some((s) => s.status === "pending" || s.status === "blocked");
        const completed = steps.some((s) => s.status === "completed");
        const status = failed
            ? completed
                ? "partially_completed"
                : "failed"
            : pending
                ? "paused"
                : "completed";
        const next = {
            ...this.plan,
            status,
            finalReport: isPlanTerminal(status) ? buildFinalReport(this.plan, status) : null,
            updatedAt: new Date().toISOString(),
        };
        this.emit(next);
        return next;
    }
    /** Rollback explícito para o checkpoint do plano, quando existir. */
    rollback() {
        if (!this.checkpointProject)
            return null;
        const snapshot = this.checkpointProject;
        this.options.applyProject(snapshot);
        const steps = this.plan.steps.map((s) => s.status === "completed" ? { ...s, status: "rolled_back" } : s);
        this.emit({
            ...this.plan,
            steps,
            status: "cancelled",
            updatedAt: new Date().toISOString(),
        });
        return snapshot;
    }
}
