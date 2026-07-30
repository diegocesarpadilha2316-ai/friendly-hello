/**
 * Etapa 9 — Runner único das ferramentas profissionais.
 *
 * Responsabilidades:
 *  1. validar argumentos com o schema estrito do contrato;
 *  2. impedir execução fora de escopo (sem projeto/cômodo);
 *  3. criar checkpoint antes de operações amplas e permitir rollback;
 *  4. garantir idempotência por `toolCallId`;
 *  5. normalizar TODO retorno em `PlannerToolResult`.
 *
 * O checkpoint é um snapshot em memória do `PlannerProject` anterior —
 * não cria store nem persistência nova. O Undo do editor continua sendo
 * o mecanismo oficial de desfazer para o usuário.
 */
import type { PlannerProject } from "@/modules/planner/shared";
import { defaultRules } from "@/modules/planner/shared";
import type { ToolContext } from "../services/tools";
import { getToolContract } from "./registry";
import type { PlannerToolContract, PlannerToolErrorCode, PlannerToolResult } from "./types";
import { getActiveRoom, safeErrorMessage } from "./validation";

export interface RunToolInput {
  readonly tool: string;
  readonly args: unknown;
  readonly project: PlannerProject;
  readonly ctx: ToolContext;
  readonly toolCallId: string;
  readonly tenantId: string;
  /** Usuário já confirmou uma operação destrutiva/ampla neste turno. */
  readonly confirmed?: boolean;
  readonly signal?: AbortSignal;
}

export interface RunToolOutput {
  readonly result: PlannerToolResult;
  /** Projeto resultante — igual ao de entrada quando nada mudou. */
  readonly project: PlannerProject;
  /** Snapshot anterior, quando um checkpoint foi criado. */
  readonly checkpoint: PlannerProject | null;
}

/* -------------------------- checkpoints --------------------------- */

interface Checkpoint {
  readonly toolCallId: string;
  readonly tool: string;
  readonly project: PlannerProject;
  readonly createdAt: number;
}

const MAX_CHECKPOINTS = 20;
const checkpoints: Checkpoint[] = [];

function pushCheckpoint(cp: Checkpoint): void {
  checkpoints.push(cp);
  while (checkpoints.length > MAX_CHECKPOINTS) checkpoints.shift();
}

/** Recupera o snapshot anterior a uma execução — base do rollback. */
export function getCheckpoint(toolCallId: string): PlannerProject | null {
  return checkpoints.find((c) => c.toolCallId === toolCallId)?.project ?? null;
}

export function listCheckpoints(): readonly {
  toolCallId: string;
  tool: string;
  createdAt: number;
}[] {
  return checkpoints.map(({ toolCallId, tool, createdAt }) => ({ toolCallId, tool, createdAt }));
}

export function clearCheckpoints(): void {
  checkpoints.length = 0;
}

/** Operações que exigem checkpoint automático antes de rodar. */
function needsCheckpoint(c: PlannerToolContract): boolean {
  return c.mutating && (c.destructive || c.supportsPreview || (c.maxAffected ?? 0) > 20);
}

/* -------------------------- idempotência --------------------------- */

const executed = new Map<string, PlannerToolResult>();
const MAX_MEMO = 200;

function remember(id: string, result: PlannerToolResult): void {
  executed.set(id, result);
  if (executed.size > MAX_MEMO) {
    const first = executed.keys().next().value;
    if (first) executed.delete(first);
  }
}

export function clearExecutionMemo(): void {
  executed.clear();
}

/* ----------------------------- runner ------------------------------ */

function fail(
  input: RunToolInput,
  agent: PlannerToolResult["agent"],
  code: PlannerToolErrorCode,
  summary: string,
): RunToolOutput {
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

export async function runPlannerTool(input: RunToolInput): Promise<RunToolOutput> {
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
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), contract.timeout),
      ),
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
    const result: PlannerToolResult = {
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

    remember(input.toolCallId, result);
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
export function rollbackTool(toolCallId: string): PlannerProject | null {
  return getCheckpoint(toolCallId);
}
