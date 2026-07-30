/**
 * Telemetria dos agentes — 100% em memória.
 *
 * Nenhuma tabela, migration ou alteração de banco. O registro reaproveita
 * a infraestrutura existente: o resumo textual entra na resposta do chat e
 * as tool calls continuam sendo persistidas pelo caminho já existente
 * (`recordAiToolCall`), agora com o agente responsável no argumento.
 */
import type { ToolName } from "../services/tools";
import type { PlannerAgentId, PlannerAgentRun } from "./types";

const MAX_RUNS = 200;
const runs: PlannerAgentRun[] = [];

let seq = 0;
const nextId = () => `run_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export interface AgentRunHandle {
  readonly id: string;
  readonly agent: PlannerAgentId;
  finish(success: boolean, tools: readonly ToolName[], error?: string): PlannerAgentRun;
}

export function startAgentRun(agent: PlannerAgentId): AgentRunHandle {
  const id = nextId();
  const startedAt = Date.now();
  return {
    id,
    agent,
    finish(success, tools, error) {
      const finishedAt = Date.now();
      const run: PlannerAgentRun = {
        id,
        agent,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        success,
        error,
        tools,
      };
      runs.push(run);
      if (runs.length > MAX_RUNS) runs.splice(0, runs.length - MAX_RUNS);
      return run;
    },
  };
}

export function listAgentRuns(limit = 50): readonly PlannerAgentRun[] {
  return runs.slice(-limit);
}

export function clearAgentRuns(): void {
  runs.length = 0;
}

/** Linha compacta para exibir no chat / logs — "Designer 120ms ✓". */
export function formatAgentRun(run: PlannerAgentRun): string {
  const status = run.success ? "ok" : `erro: ${run.error ?? "desconhecido"}`;
  return `${run.agent} — ${run.durationMs}ms — ${status}`;
}