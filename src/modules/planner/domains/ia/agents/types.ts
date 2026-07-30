/**
 * Etapa 8 — Agentes especializados de IA do Planner.
 *
 * Camada 100% aditiva: não cria chat, endpoint, provider, store nem
 * sessão nova. Os agentes são *papéis* que operam sobre a MESMA
 * infraestrutura das Etapas 5/6/7 (`/api/ai/chat`, `usePlannerChat`,
 * `runAgent`, `TOOL_FUNCTIONS`).
 */
import type { ToolName } from "../services/tools";

export type PlannerAgentId =
  | "designer"
  | "marceneiro"
  | "materiais"
  | "orcamentista"
  | "producao"
  | "render";

export interface PlannerAgentDefinition {
  readonly id: PlannerAgentId;
  readonly label: string;
  /** Ordem de execução no pipeline (menor executa antes). */
  readonly order: number;
  /** Áreas de responsabilidade — usadas no prompt e na documentação. */
  readonly responsibilities: readonly string[];
  /** Ferramentas que este agente PODE executar (ownership exclusivo). */
  readonly allowedTools: readonly ToolName[];
  /** Ferramentas explicitamente proibidas (pertencem a outro agente). */
  readonly forbiddenTools: readonly ToolName[];
  /** Palavras-chave pt-BR que ativam o agente em pedidos conversacionais. */
  readonly keywords: readonly string[];
  /** Persona injetada no prompt de sistema quando o agente participa. */
  readonly persona: string;
  /** Agente consultivo: não executa tools, apenas responde/analisa. */
  readonly advisory: boolean;
}

/** Registro de execução de um agente — telemetria em memória. */
export interface PlannerAgentRun {
  readonly id: string;
  readonly agent: PlannerAgentId;
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly error?: string;
  readonly tools: readonly ToolName[];
}

/** Passo do pipeline consolidado pelo Orchestrator. */
export interface PlannerAgentStep {
  readonly agent: PlannerAgentId;
  readonly tool: ToolName;
  readonly args: Readonly<Record<string, unknown>>;
}

export interface PlannerAgentPlan {
  /** Passos executáveis, já ordenados por agente e sem duplicação. */
  readonly steps: readonly PlannerAgentStep[];
  /** Agentes que participarão (executores + consultivos). */
  readonly agents: readonly PlannerAgentId[];
  /** Passos descartados por duplicação/permissão — apenas diagnóstico. */
  readonly skipped: readonly { tool: string; reason: string }[];
}
