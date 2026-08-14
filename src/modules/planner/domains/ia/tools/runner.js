import { defaultRules } from "@/modules/planner/shared";
import { getToolContract } from "./registry";
import { getActiveRoom, safeErrorMessage } from "./validation";
const MAX_CHECKPOINTS = 20;
const checkpoints = [];
function pushCheckpoint(cp) {
  checkpoints.push(cp);
  while (checkpoints.length > MAX_CHECKPOINTS) checkpoints.shift();
}
/** Recupera o snapshot anterior a uma execução — base do rollback. */
export function getCheckpoint(toolCallId) {
  return checkpoints.find((c) => c.toolCallId === toolCallId)?.project ?? null;
}
export function listCheckpoints() {
  return checkpoints.map(({ toolCallId, tool, createdAt }) => ({ toolCallId, tool, createdAt }));
}
export function clearCheckpoints() {
  checkpoints.length = 0;
}
/** Operações que exigem checkpoint automático antes de rodar. */
function needsCheckpoint(c) {
  return c.mutating && (c.destructive || c.supportsPreview || (c.maxAffected ?? 0) > 20);
}
/* -------------------------- idempotência --------------------------- */
const executed = new Map();
const MAX_MEMO = 200;
function remember(id, result) {
  executed.set(id, result);
  if (executed.size > MAX_MEMO) {
    const first = executed.keys().next().value;
    if (first) executed.delete(first);
  }
}
export function clearExecutionMemo() {
  executed.clear();
}
/* ----------------------------- runner ------------------------------ */
function fail(input, agent, code, summary) {
  return {
    result: {
      ok: false,
      toolCallId: input.toolCallId,
      agent,
      tool: input.tool,
      summary,
      affectedIds: [],
      warnings: [],
      errorCode: code,
    },
    project: input.project,
    checkpoint: null,
  };
}
export async function runPlannerTool(input) {
  const contract = getToolContract(input.tool);
  if (!contract) {
    return fail(input, "marceneiro", "NOT_FOUND", `Ferramenta desconhecida: ${input.tool}.`);
  }
  const agent = contract.ownerAgent;
  // Idempotência: a mesma chamada nunca roda duas vezes.
  const memo = executed.get(input.toolCallId);
  if (memo) {
    return { result: memo, project: input.project, checkpoint: null };
  }
  if (input.signal?.aborted) {
    return fail(input, agent, "CANCELLED", "Operação cancelada antes de iniciar.");
  }
  if (contract.requiresProject && !getActiveRoom(input.project, input.ctx)) {
    return fail(input, agent, "NO_ROOM", "Selecione um cômodo antes de executar esta operação.");
  }
  if (contract.destructive && !input.confirmed) {
    return fail(
      input,
      agent,
      "NEEDS_CONFIRMATION",
      "Esta operação remove ou substitui conteúdo do projeto e precisa da sua confirmação explícita.",
    );
  }
  // Validação estrita — argumento inválido nunca chega ao executor.
  const parsed = contract.inputSchema.safeParse(input.args ?? {});
  if (!parsed.success) {
    return fail(input, agent, "INVALID_ARGS", safeErrorMessage(parsed.error));
  }
  const checkpoint = needsCheckpoint(contract) ? input.project : null;
  try {
    const outcome = await Promise.race([
      Promise.resolve(
        contract.execute(parsed.data, {
          project: input.project,
          ctx: input.ctx,
          rules: defaultRules(input.tenantId),
          toolCallId: input.toolCallId,
          tenantId: input.tenantId,
          signal: input.signal,
        }),
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), contract.timeout)),
    ]);
    const affected = outcome.affectedIds ?? [];
    if (contract.maxAffected && affected.length > contract.maxAffected) {
      return fail(
        input,
        agent,
        "LIMIT_EXCEEDED",
        `A operação afetaria ${affected.length} objetos, acima do limite seguro de ${contract.maxAffected}.`,
      );
    }
    const nextProject = outcome.project ?? input.project;
    const result = {
      ok: !outcome.errorCode,
      toolCallId: input.toolCallId,
      agent,
      tool: contract.name,
      summary: outcome.summary,
      affectedIds: affected,
      warnings: outcome.warnings ?? [],
      data: outcome.data,
      errorCode: outcome.errorCode,
    };
    // Só resultados concluídos entram no memo. Memorizar uma falha tornava
    // "Repetir falhas" inoperante: a nova tentativa recebia imediatamente o
    // mesmo erro antigo, sem executar novamente a ferramenta.
    if (result.ok) remember(input.toolCallId, result);
    if (checkpoint && nextProject !== input.project) {
      pushCheckpoint({
        toolCallId: input.toolCallId,
        tool: contract.name,
        project: checkpoint,
        createdAt: Date.now(),
      });
    }
    return {
      result,
      project: result.ok ? nextProject : input.project,
      checkpoint: result.ok ? checkpoint : null,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.message === "timeout";
    // Rollback implícito: em falha, o projeto de entrada é preservado.
    return fail(
      input,
      agent,
      timedOut ? "TIMEOUT" : "INTERNAL",
      timedOut
        ? "A operação demorou demais e foi interrompida. Nada foi alterado."
        : "Não foi possível concluir esta operação. Nada foi alterado.",
    );
  }
}
/**
 * Rollback explícito: devolve o snapshot anterior a uma execução para que
 * o chamador aplique via `updateProject` (preservando Undo/Autosave).
 */
export function rollbackTool(toolCallId) {
  return getCheckpoint(toolCallId);
}
