/**
 * Etapa 11 — ponte React entre o motor de planejamento e o editor.
 *
 * Nenhum provider novo: o hook vive dentro do `usePlannerChat`, usa o
 * `PlannerEditorProvider` já existente como canal único de mutação e
 * persiste apenas o plano ativo em localStorage (idempotência).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlannerProject } from "@/modules/planner/shared";
import { usePlannerEditor } from "@/modules/planner/shared";
import { readMemory, updateMemoryFromTurn } from "../memory";
import type { ToolContext } from "../services/tools";
import {
  PlanRunner,
  generatePlan,
  planProgressOf,
  readStoredPlan,
  writeStoredPlan,
  type PlanProgress,
  type ProjectPlan,
} from "../planning";

export interface ProposePlanInput {
  readonly message: string;
  readonly clientMessageId: string;
  readonly sessionId: string | null;
  readonly project: PlannerProject;
  readonly ctx: ToolContext;
}

export interface UsePlanExecutionResult {
  readonly plan: ProjectPlan | null;
  readonly progress: PlanProgress | null;
  readonly propose: (input: ProposePlanInput) => ProjectPlan | null;
  readonly execute: () => void;
  readonly confirmAndExecute: () => void;
  readonly answerAndExecute: (answer?: string) => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly cancel: () => void;
  readonly retryFailed: () => void;
  readonly rollback: () => void;
  readonly removeStep: (stepId: string) => void;
  readonly dismiss: () => void;
}

export function usePlanExecution(tenantId: string): UsePlanExecutionResult {
  const editor = usePlannerEditor();
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const runnerRef = useRef<PlanRunner | null>(null);
  const ctxRef = useRef<ToolContext | null>(null);
  const messageRef = useRef<string>("");

  const projectId = editor.state.project?.id ?? null;

  // Retomada fria: um plano interrompido volta como pausado, jamais executando.
  useEffect(() => {
    if (!projectId) return;
    const stored = readStoredPlan(tenantId, projectId);
    if (stored) setPlan(stored);
  }, [tenantId, projectId]);

  const commit = useCallback(
    (next: ProjectPlan) => {
      setPlan(next);
      writeStoredPlan(next, tenantId, next.projectId);
    },
    [tenantId],
  );

  const buildRunner = useCallback(
    (base: ProjectPlan, ctx: ToolContext) => {
      const runner = new PlanRunner({
        plan: base,
        tenantId,
        ctx,
        getProject: () => editor.state.project,
        applyProject: (project) => {
          if (editor.state.project) editor.updateProject(() => project);
          else editor.loadProject(project);
        },
        onUpdate: commit,
      });
      runnerRef.current = runner;
      return runner;
    },
    [commit, editor, tenantId],
  );

  /**
   * Garante um runner vivo. Após reload (ou se o plano veio do
   * localStorage) o runner não existe e o clique em "Executar plano"
   * ficava sem efeito — causa raiz do fluxo travado.
   */
  const ensureRunner = useCallback((): PlanRunner | null => {
    if (runnerRef.current) return runnerRef.current;
    const current = plan;
    if (!current) return null;
    const ctx: ToolContext =
      ctxRef.current ?? {
        environmentId: editor.state.selectedEnvironmentId ?? "",
        roomId: editor.state.selectedRoomId ?? "",
        selectionIds: editor.state.selectedNodeId ? [editor.state.selectedNodeId] : undefined,
      };
    ctxRef.current = ctx;
    return buildRunner(current, ctx);
  }, [buildRunner, editor.state, plan]);

  const propose = useCallback(
    (input: ProposePlanInput): ProjectPlan | null => {
      const room = input.project.environments
        .find((e) => e.id === input.ctx.environmentId)
        ?.rooms.find((r) => r.id === input.ctx.roomId);
      const generated = generatePlan({
        message: input.message,
        tenantId,
        projectId: input.project.id,
        sessionId: input.sessionId,
        clientMessageId: input.clientMessageId,
        project: input.project,
        memory: input.project.id ? readMemory(tenantId, input.project.id, input.project.name) : null,
        hasSelection: Boolean(input.ctx.selectionIds?.length),
        roomHasDimensions: Boolean(room?.dimensions.width && room?.dimensions.depth),
      });
      if (!generated.steps.length) return null;
      ctxRef.current = input.ctx;
      messageRef.current = input.message;
      buildRunner(generated, input.ctx);
      commit(generated);
      return generated;
    },
    [buildRunner, commit, tenantId],
  );

  const finishMemory = useCallback(
    (finished: ProjectPlan) => {
      // Memória só é atualizada quando o plano termina de fato.
      if (finished.status !== "completed" && finished.status !== "partially_completed") return;
      const project = editor.state.project;
      const ctx = ctxRef.current;
      if (!project || !ctx) return;
      try {
        updateMemoryFromTurn({
          tenantId,
          userMessage: messageRef.current,
          project,
          environmentId: ctx.environmentId,
          roomId: ctx.roomId,
          toolCalls: finished.steps
            .filter((s) => s.status === "completed")
            .map((s) => ({
              name: s.toolName,
              args: s.args as Record<string, unknown>,
              status: "ok" as const,
              agent: s.agent,
              message: s.result?.summary,
            })),
          outcome: "done",
        });
      } catch (e) {
        console.warn("[planner-plan] memória não pôde ser atualizada", e);
      }
    },
    [editor.state.project, tenantId],
  );

  const runNow = useCallback(
    (mode: "run" | "resume" | "retry") => {
      const runner = ensureRunner();
      if (!runner) return;
      const exec =
        mode === "resume" ? runner.resume() : mode === "retry" ? runner.retryFailed() : runner.run();
      void exec.then(finishMemory).catch((error: unknown) => {
        // Nunca deixar a UI presa: erro inesperado encerra o estado
        // pendente com motivo visível e permite tentar de novo.
        const message = error instanceof Error ? error.message : "Falha inesperada na execução.";
        console.warn("[planner-plan] execução falhou", error);
        setPlan((prev) =>
          prev ? { ...prev, status: "failed", warnings: [...prev.warnings, message] } : prev,
        );
      });
    },
    [ensureRunner, finishMemory],
  );

  const execute = useCallback(() => runNow("run"), [runNow]);
  const resume = useCallback(() => runNow("resume"), [runNow]);
  const retryFailed = useCallback(() => runNow("retry"), [runNow]);

  const confirmAndExecute = useCallback(() => {
    ensureRunner()?.confirm();
    runNow("run");
  }, [ensureRunner, runNow]);

  /** Resposta do usuário à pendência → plano liberado e execução imediata. */
  const answerAndExecute = useCallback(
    (answer?: string) => {
      const runner = ensureRunner();
      if (!runner) return;
      runner.answerMissing(answer);
      runNow("run");
    },
    [ensureRunner, runNow],
  );

  const pause = useCallback(() => runnerRef.current?.pause(), []);
  const cancel = useCallback(() => runnerRef.current?.cancel(), []);
  const rollback = useCallback(() => {
    runnerRef.current?.rollback();
  }, []);
  const removeStep = useCallback((stepId: string) => runnerRef.current?.removeStep(stepId), []);

  const dismiss = useCallback(() => {
    const current = runnerRef.current?.current ?? plan;
    runnerRef.current = null;
    setPlan(null);
    if (current) writeStoredPlan(null, tenantId, current.projectId);
  }, [plan, tenantId]);

  return {
    plan,
    progress: plan ? planProgressOf(plan) : null,
    propose,
    execute,
    confirmAndExecute,
    answerAndExecute,
    pause,
    resume,
    cancel,
    retryFailed,
    rollback,
    removeStep,
    dismiss,
  };
}