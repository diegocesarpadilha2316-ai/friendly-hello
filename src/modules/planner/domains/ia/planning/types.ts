/**
 * Etapa 11 — Contrato canônico do Planejamento Inteligente.
 *
 * FONTE ÚNICA DE VERDADE dos tipos de plano. Nenhum outro arquivo pode
 * declarar um contrato de plano/etapa. O plano NÃO cria chat, endpoint,
 * provider nem sessão: ele apenas descreve, em ordem, chamadas do
 * catálogo canônico de ferramentas da Etapa 9, executadas pelo tool
 * runner (checkpoint, rollback, idempotência já garantidos lá).
 */
import type { PlannerAgentId } from "../agents/types";
import type { ToolName } from "../services/tools";
import type { PlannerToolResult } from "../tools/types";

/** Classificação do pedido (Parte 2). */
export type PlanRequestKind =
  | "conversa"
  | "consulta"
  | "alteracao_pequena"
  | "operacao_unica"
  | "plano_intermediario"
  | "projeto_completo"
  | "destrutivo";

export type PlanImpact = "baixo" | "medio" | "alto" | "destrutivo";

export type PlanStatus =
  | "draft"
  | "awaiting_information"
  | "awaiting_confirmation"
  | "ready"
  | "executing"
  | "paused"
  | "completed"
  | "partially_completed"
  | "cancelled"
  | "failed";

export type PlanStepStatus =
  | "pending"
  | "blocked"
  | "awaiting_confirmation"
  | "running"
  | "completed"
  | "skipped"
  | "cancelled"
  | "failed"
  | "rolled_back"
  | "invalid";

/** Escopo aproximado do que a etapa toca — usado no preview e nos limites. */
export type PlanAffectedScope = "projeto" | "ambiente" | "comodo" | "modulo" | "selecao" | "cena";

export interface PlanMissingInfo {
  readonly key: string;
  /** Pergunta curta e objetiva feita ao usuário. */
  readonly question: string;
  readonly level: "obrigatoria" | "recomendada" | "opcional";
  readonly answer?: string;
}

export interface PlanAssumption {
  readonly key: string;
  /** Texto visível: "Vou considerar pé-direito de 2.70 m porque…". */
  readonly label: string;
  readonly value: string;
  readonly editable: boolean;
}

export interface PlanStep {
  readonly stepId: string;
  readonly position: number;
  readonly title: string;
  readonly description: string;
  readonly agent: PlannerAgentId;
  readonly toolName: ToolName;
  readonly args: Readonly<Record<string, unknown>>;
  readonly status: PlanStepStatus;
  readonly mutating: boolean;
  readonly destructive: boolean;
  readonly requiresConfirmation: boolean;
  /** IDs de etapas que precisam concluir antes desta. */
  readonly dependsOn: readonly string[];
  readonly affectedScope: PlanAffectedScope;
  /** Etapa opcional pode ser removida/pulada sem invalidar o plano. */
  readonly optional: boolean;
  readonly attempts: number;
  readonly result?: PlannerToolResult;
  readonly warnings: readonly string[];
  readonly startedAt?: string;
  readonly finishedAt?: string;
}

export interface ProjectPlan {
  readonly version: 1;
  readonly planId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly sessionId: string | null;
  readonly clientMessageId: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: PlanRequestKind;
  readonly status: PlanStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currentStepIndex: number;
  readonly requiresConfirmation: boolean;
  readonly confirmed: boolean;
  readonly estimatedImpact: PlanImpact;
  readonly agents: readonly PlannerAgentId[];
  readonly steps: readonly PlanStep[];
  readonly warnings: readonly string[];
  readonly assumptions: readonly PlanAssumption[];
  readonly missingInformation: readonly PlanMissingInfo[];
  /** Checkpoint criado antes da execução (id do toolCall âncora). */
  readonly checkpointId: string | null;
  readonly needsCheckpoint: boolean;
  /** Resumo final estruturado, montado ao terminar (Parte 16). */
  readonly finalReport: PlanFinalReport | null;
}

export interface PlanFinalReport {
  readonly objective: string;
  readonly completedSteps: readonly string[];
  readonly failedSteps: readonly string[];
  readonly createdObjects: readonly string[];
  readonly changedObjects: readonly string[];
  readonly materials: readonly string[];
  readonly warnings: readonly string[];
  readonly pendings: readonly string[];
  readonly budget: "disponivel" | "incompleto" | "nao_solicitado";
  readonly production: "disponivel" | "preliminar" | "nao_solicitado";
  readonly render: "preparado" | "pendente" | "nao_solicitado";
  readonly nextSteps: readonly string[];
  readonly text: string;
}

/** Limites de segurança (Parte 19). */
export const PLAN_LIMITS = {
  maxSteps: 24,
  maxMutatingSteps: 18,
  maxDestructiveSteps: 2,
  maxAttemptsPerStep: 2,
  maxArgsChars: 4_000,
  maxPlansPerProject: 3,
} as const;

export function planProgress(plan: ProjectPlan): number {
  if (!plan.steps.length) return 0;
  const done = plan.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped" || s.status === "cancelled",
  ).length;
  return Math.round((done / plan.steps.length) * 100);
}

export function isPlanTerminal(status: PlanStatus): boolean {
  return (
    status === "completed" ||
    status === "partially_completed" ||
    status === "cancelled" ||
    status === "failed"
  );
}
