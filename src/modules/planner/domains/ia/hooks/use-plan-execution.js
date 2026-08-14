/**
 * Etapa 11 — ponte React entre o motor de planejamento e o editor.
 *
 * Nenhum provider novo: o hook vive dentro do `usePlannerChat`, usa o
 * `PlannerEditorProvider` já existente como canal único de mutação e
 * persiste apenas o plano ativo em localStorage (idempotência).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared";
import { readMemory, updateMemoryFromTurn } from "../memory";
import {
  PlanRunner,
  generatePlan,
  planProgressOf,
  readStoredPlan,
  writeStoredPlan,
} from "../planning";
export function usePlanExecution(tenantId) {
  const editor = usePlannerEditor();
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const [plan, setPlan] = useState(null);
  const runnerRef = useRef(null);
  // Referência síncrona do projeto canônico. Ao criar o primeiro projeto,
  // React ainda não concluiu o render quando o plano auto-inicia; depender de
  // `editor.state.project` nessa janela fazia todas as etapas falharem com
  // "Nenhum projeto ativo" mesmo com o viewport já exibindo o cômodo.
  const projectRef = useRef(editor.state.project);
  projectRef.current = editor.state.project ?? projectRef.current;
  // Espelho síncrono para a corrida entre loadProject e o primeiro plano.
  const editorProjectRef = useRef(editor.state.project);
  editorProjectRef.current = editor.state.project ?? editorProjectRef.current;
  const ctxRef = useRef(null);
  const messageRef = useRef("");
  const finishRef = useRef(() => {});
  const projectId = editor.state.project?.id ?? null;
  // Retomada fria: um plano interrompido volta como pausado, jamais executando.
  useEffect(() => {
    if (!projectId) return;
    const stored = readStoredPlan(tenantId, projectId);
    if (stored) setPlan(stored);
  }, [tenantId, projectId]);
  const commit = useCallback(
    (next) => {
      setPlan(next);
      writeStoredPlan(next, tenantId, next.projectId);
    },
    [tenantId],
  );
  const buildRunner = useCallback(
    (base, ctx) => {
      const runner = new PlanRunner({
        plan: base,
        tenantId,
        ctx,
        getProject: () => projectRef.current,
        applyProject: (project) => {
          projectRef.current = project;
          console.info("[planner-plan] applyProject", {
            furniture: project.environments
              .flatMap((env) => env.rooms)
              .reduce(
                (total, room) =>
                  total +
                  room.nodeOrder.filter((id) => room.nodes[id]?.params?.role === "furniture")
                    .length,
                0,
              ),
            providerHasProject: Boolean(editorProjectRef.current),
            projectId: project.id,
          });
          // No primeiro turno o provider pode ainda não ter renderizado o
          // projeto; updateProject seria no-op. Carrega o snapshot completo.
          if (!editorProjectRef.current) {
            // Até o próximo render updateProject ainda é no-op; não
            // altere o ref para que etapas seguintes carreguem o
            // snapshot sucessivo e completo no provider.
            editorRef.current.loadProject(project);
            return;
          }
          editorRef.current.updateProject(() => project);
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
  const ensureRunner = useCallback(() => {
    if (runnerRef.current) return runnerRef.current;
    const current = plan;
    if (!current) return null;
    const ctx = ctxRef.current ?? {
      environmentId: editor.state.selectedEnvironmentId ?? "",
      roomId: editor.state.selectedRoomId ?? "",
      selectionIds: editor.state.selectedNodeId ? [editor.state.selectedNodeId] : undefined,
    };
    ctxRef.current = ctx;
    return buildRunner(current, ctx);
  }, [buildRunner, editor.state, plan]);
  const propose = useCallback(
    (input) => {
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
        memory: input.project.id
          ? readMemory(tenantId, input.project.id, input.project.name)
          : null,
        hasSelection: Boolean(input.ctx.selectionIds?.length),
        roomHasDimensions: Boolean(room?.dimensions.width && room?.dimensions.depth),
      });
      if (!generated.steps.length) return null;
      ctxRef.current = input.ctx;
      projectRef.current = input.project;
      messageRef.current = input.message;
      const runner = buildRunner(generated, input.ctx);
      commit(generated);
      // Prompt completo (nenhuma pendência obrigatória e nada destrutivo)
      // executa automaticamente: sem confirmação redundante.
      if (generated.status === "ready") {
        void runner
          .run()
          .then((p) => finishRef.current(p))
          .catch((error) => {
            const message =
              error instanceof Error ? error.message : "Falha inesperada na execução.";
            console.warn("[planner-plan] execução automática falhou", error);
            setPlan((prev) =>
              prev ? { ...prev, status: "failed", warnings: [...prev.warnings, message] } : prev,
            );
          });
      }
      return generated;
    },
    [buildRunner, commit, tenantId],
  );
  const finishMemory = useCallback(
    (finished) => {
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
              args: s.args,
              status: "ok",
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
  finishRef.current = finishMemory;
  const runNow = useCallback(
    (mode) => {
      const runner = ensureRunner();
      if (!runner) return;
      const exec =
        mode === "resume"
          ? runner.resume()
          : mode === "retry"
            ? runner.retryFailed()
            : mode === "restart"
              ? runner.restart()
              : runner.run();
      void exec.then(finishMemory).catch((error) => {
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
  const execute = useCallback(() => {
    const current = runnerRef.current?.current ?? plan;
    const terminal =
      current?.status === "completed" ||
      current?.status === "partially_completed" ||
      current?.status === "cancelled" ||
      current?.status === "failed";
    runNow(terminal ? "restart" : "run");
  }, [plan, runNow]);
  const resume = useCallback(() => runNow("resume"), [runNow]);
  const retryFailed = useCallback(() => runNow("retry"), [runNow]);
  const confirmAndExecute = useCallback(() => {
    ensureRunner()?.confirm();
    runNow("run");
  }, [ensureRunner, runNow]);
  /** Resposta do usuário à pendência → plano liberado e execução imediata. */
  const answerAndExecute = useCallback(
    (answer) => {
      // Fluxo conversacional: a resposta é incorporada ao pedido original e
      // o plano é regerado já executando automaticamente (sem confirmação).
      const current = plan;
      const ctx = ctxRef.current;
      const project = projectRef.current;
      if (answer && current && ctx && project) {
        const merged = `${messageRef.current} ${answer}`.trim();
        const next = propose({
          message: merged,
          clientMessageId: `${current.clientMessageId}_a`,
          sessionId: current.sessionId,
          project,
          ctx,
        });
        if (next) return;
      }
      const runner = ensureRunner();
      if (!runner) return;
      runner.answerMissing(answer);
      runNow("run");
    },
    [ensureRunner, plan, propose, runNow],
  );
  const pause = useCallback(() => runnerRef.current?.pause(), []);
  const cancel = useCallback(() => runnerRef.current?.cancel(), []);
  const rollback = useCallback(() => {
    runnerRef.current?.rollback();
  }, []);
  const removeStep = useCallback((stepId) => runnerRef.current?.removeStep(stepId), []);
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
