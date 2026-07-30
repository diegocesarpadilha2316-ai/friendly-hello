/**
 * Etapa 9 — Contrato canônico das ferramentas profissionais do Planner.
 *
 * FONTE ÚNICA DE VERDADE. Nenhum outro arquivo pode declarar schema,
 * propriedade (agente), categoria, executor ou flags de segurança de uma
 * ferramenta. `services/tools.ts` continua sendo apenas a biblioteca de
 * executores puros; `agents/registry.ts` deriva a propriedade daqui.
 *
 * UNIDADE CANÔNICA INTERNA: **milímetro (mm)**, inteiro. Toda entrada em
 * metros/centímetros é convertida explicitamente em `validation.ts`.
 */
import type { z } from "zod";
import type { PlannerProject, CompanyManufacturingRules } from "@/modules/planner/shared";
import type { PlannerAgentId } from "../agents/types";
import type { ToolContext, ToolName } from "../services/tools";

export type PlannerToolCategory =
  | "project"
  | "environment"
  | "furniture"
  | "layout"
  | "materials"
  | "budget"
  | "production"
  | "render"
  | "inspection";

/** Códigos de erro padronizados — nunca vaza exceção bruta para a UI. */
export type PlannerToolErrorCode =
  | "INVALID_ARGS"
  | "NO_PROJECT"
  | "NO_ROOM"
  | "NOT_FOUND"
  | "AMBIGUOUS"
  | "OUT_OF_SCOPE"
  | "LIMIT_EXCEEDED"
  | "TIMEOUT"
  | "CANCELLED"
  | "NEEDS_CONFIRMATION"
  | "INTERNAL";

/** Resultado padronizado de QUALQUER ferramenta (Parte 14). */
export interface PlannerToolResult<TData = unknown> {
  readonly ok: boolean;
  readonly toolCallId: string;
  readonly agent: PlannerAgentId;
  readonly tool: string;
  readonly summary: string;
  readonly affectedIds: readonly string[];
  readonly warnings: readonly string[];
  readonly data?: TData;
  readonly errorCode?: PlannerToolErrorCode;
}

/** Contexto de execução — sempre derivado do estado canônico do editor. */
export interface PlannerToolRunContext {
  readonly project: PlannerProject;
  readonly ctx: ToolContext;
  readonly rules: CompanyManufacturingRules;
  readonly toolCallId: string;
  readonly tenantId: string;
  readonly signal?: AbortSignal;
}

/** Retorno interno do executor — normalizado pelo runner. */
export interface PlannerToolOutcome<TData = unknown> {
  /** Projeto resultante. Ausente/idêntico ⇒ ferramenta consultiva. */
  readonly project?: PlannerProject;
  readonly summary: string;
  readonly affectedIds?: readonly string[];
  readonly warnings?: readonly string[];
  readonly data?: TData;
  /** Quando presente, o runner marca `ok: false` com este código. */
  readonly errorCode?: PlannerToolErrorCode;
}

export interface PlannerToolContract<TArgs = unknown, TData = unknown> {
  readonly name: ToolName;
  readonly description: string;
  readonly ownerAgent: PlannerAgentId;
  readonly category: PlannerToolCategory;
  /** Schema estrito (rejeita campos desconhecidos) + normalização de unidades. */
  readonly inputSchema: z.ZodType<TArgs>;
  /** Altera o `PlannerProject`. */
  readonly mutating: boolean;
  /** Remove/substitui conteúdo — exige confirmação explícita do usuário. */
  readonly destructive: boolean;
  readonly requiresProject: boolean;
  /** Participa do fluxo de preview + confirmação em planos amplos. */
  readonly supportsPreview: boolean;
  /** Reversível pelo Undo do editor (todas as mutações passam por updateProject). */
  readonly supportsUndo: boolean;
  /** Só pode rodar uma vez por turno (a chamada mais recente vence). */
  readonly singletonPerTurn: boolean;
  /** Timeout de execução em ms. */
  readonly timeout: number;
  /** Teto de objetos afetados numa única execução. */
  readonly maxAffected?: number;
  readonly execute: (
    args: TArgs,
    run: PlannerToolRunContext,
  ) => PlannerToolOutcome<TData> | Promise<PlannerToolOutcome<TData>>;
}

/** Passo validado, pronto para execução. */
export interface PlannerToolStep {
  readonly toolCallId: string;
  readonly tool: ToolName;
  readonly agent: PlannerAgentId;
  readonly args: unknown;
  readonly contract: PlannerToolContract<never, unknown>;
}

/** Plano de execução consolidado (Parte 11/12). */
export interface PlannerToolPlan {
  readonly turnId: string;
  readonly steps: readonly PlannerToolStep[];
  readonly agents: readonly PlannerAgentId[];
  readonly rejected: readonly { tool: string; reason: string }[];
  /** Exige confirmação do usuário antes de executar. */
  readonly needsConfirmation: boolean;
  /** Motivos legíveis da confirmação. */
  readonly confirmationReasons: readonly string[];
  /** Resumo humano do que será feito ("Esta ação irá: …"). */
  readonly previewLines: readonly string[];
  /** Criar checkpoint (versão) antes de executar. */
  readonly needsCheckpoint: boolean;
}
