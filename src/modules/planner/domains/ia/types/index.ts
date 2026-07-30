/**
 * Domínio IA do Planner — tipos privados.
 *
 * Nenhum campo persistido: o domínio consome exclusivamente o
 * `PlannerEditorProvider` (Fase 3.1). Mensagens, chamadas de ferramenta e
 * resultados vivem apenas na memória do chat (React state). Undo/Redo do
 * projeto continua sendo do próprio Provider — não replicamos.
 */

export type PlannerAIRole = "user" | "assistant" | "system" | "tool";

export type PlannerAIStatus = "idle" | "thinking" | "streaming" | "done" | "error" | "cancelled";

export interface PlannerAIToolCall {
  readonly id: string;
  readonly name: string;
  readonly args: Readonly<Record<string, unknown>>;
  readonly status: "pending" | "ok" | "error";
  readonly message?: string;
  readonly executedAt: string;
  /** Agente especialista responsável pela execução (Etapa 8). */
  readonly agent?: string;
}

export interface PlannerAIMessage {
  readonly id: string;
  readonly role: PlannerAIRole;
  readonly content: string;
  readonly createdAt: string;
  readonly edited?: boolean;
  readonly toolCalls?: readonly PlannerAIToolCall[];
  readonly status?: PlannerAIStatus;
}

export interface PlannerAIQuickAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
  readonly icon?: string;
}
