/**
 * Agent — orquestrador da IA do Planner.
 *
 * Este é o único ponto de entrada usado pelo hook `usePlannerChat`. Ele
 * chama o interpretador local para transformar a mensagem do usuário em
 * uma sequência de `ParsedIntent`s, executa cada uma sobre o MESMO
 * `PlannerProject` (via `updateProject`) e devolve uma resposta em
 * streaming.
 *
 * Preparado para plugar GPT/Gemini/Claude/Open Source no futuro: basta
 * substituir `interpret()` por uma chamada a `aiGenerateJson` do
 * `@/core/ai` que retorne o MESMO shape (`ParsedIntent[]`). A interface
 * de execução permanece idêntica.
 */
import type { PlannerProject } from "@/modules/planner/shared";
import type { CompanyManufacturingRules } from "@/modules/planner/shared";
import { interpret, type ParsedIntent } from "./interpreter";
import { answerQuestion } from "./questions";
import { type ToolContext, type ToolExecutionResult, type ToolName } from "./tools";
import { getToolContract } from "../tools/registry";
import { runPlannerTool } from "../tools/runner";
import type { PlannerToolResult } from "../tools/types";
import {
  buildAgentPlan,
  describeAgents,
  selectConversationalAgents,
  startAgentRun,
  type PlannerAgentId,
} from "../agents";

export interface AgentInput {
  message: string;
  project: PlannerProject;
  ctx: ToolContext;
  rules: CompanyManufacturingRules;
  signal?: AbortSignal;
  /** Turno em que o usuário já confirmou operações destrutivas (Etapa 9). */
  confirmDestructive?: boolean;
  /**
   * Callback opcional — quando fornecido, respostas conversacionais
   * (smalltalk/unknown/question) passam por um LLM real (AI Gateway).
   * Retornar `null` mantém a resposta heurística local.
   */
  llmReply?: (prompt: {
    userMessage: string;
    role: "smalltalk" | "unknown" | "question";
    project: PlannerProject;
    ctx: ToolContext;
    agents?: readonly PlannerAgentId[];
  }) => Promise<string | null>;
  /**
   * Callback de streaming opcional — quando fornecido, respostas
   * conversacionais são geradas em tempo real pelo LLM. O texto final
   * completo é retornado ao final do generator.
   */
  llmReplyStream?: (prompt: {
    userMessage: string;
    role: "smalltalk" | "unknown" | "question";
    project: PlannerProject;
    ctx: ToolContext;
    agents?: readonly PlannerAgentId[];
  }) => AsyncGenerator<string>;
  /**
   * Callback opcional — quando fornecido, o agent tenta obter do LLM uma
   * lista estruturada de `ParsedIntent`s (tool-calling real) antes de
   * cair no fallback heurístico. Retornar `null` ou `[]` mantém o
   * comportamento local.
   */
  llmPlan?: (prompt: {
    userMessage: string;
    project: PlannerProject;
    ctx: ToolContext;
  }) => Promise<readonly ParsedIntent[] | null>;
}

export interface AgentChunk {
  kind: "text" | "tool" | "done" | "error";
  text?: string;
  toolName?: string;
  toolArgs?: Readonly<Record<string, unknown>>;
  toolResult?: ToolExecutionResult;
  /** Agente especialista responsável pela ação (Etapa 8). */
  agent?: PlannerAgentId;
  /** Agentes que participaram do turno — presente no chunk `done`. */
  agents?: readonly PlannerAgentId[];
  /** Resultado padronizado da ferramenta (Etapa 9). */
  toolOutcome?: PlannerToolResult;
}

/**
 * Etapa 9 — toda execução passa pelo runner canônico: validação estrita
 * de argumentos, checkpoint, idempotência por `toolCallId`, timeout e
 * resultado padronizado. Ferramentas fora do registro são recusadas.
 */
async function executeIntent(
  intent: ParsedIntent,
  project: PlannerProject,
  input: AgentInput,
  toolCallId: string,
): Promise<{ result: ToolExecutionResult; outcome: PlannerToolResult }> {
  const run = await runPlannerTool({
    tool: intent.tool,
    args: intent.args ?? {},
    project,
    ctx: input.ctx,
    toolCallId,
    tenantId: input.rules.tenantId,
    confirmed: input.confirmDestructive,
    signal: input.signal,
  });
  return {
    result: {
      project: run.project,
      summary: run.result.summary,
      affectedIds: run.result.affectedIds,
    },
    outcome: run.result,
  };
}

/**
 * Executa a mensagem do usuário como um único passo do agent.
 * Retorna:
 *  - `chunks`: fluxo textual pronto para streaming pela UI.
 *  - `finalProject`: o `PlannerProject` mutado — o hook aplica via `updateProject`.
 *  - `toolCalls`: registro das chamadas para exibição no chat.
 */
export async function* runAgent(input: AgentInput): AsyncGenerator<AgentChunk, void, void> {
  const parsed = interpret(input.message);
  const convAgents = selectConversationalAgents(input.message);

  if (parsed.type === "smalltalk" || parsed.type === "unknown") {
    // Antes de responder só com texto, tenta obter um plano estruturado
    // (tool-calling real) do LLM — se vier, executa como command.
    if (parsed.type === "unknown" && input.llmPlan) {
      const plan = await tryLLMPlan(input);
      if (plan && plan.length > 0) {
        yield* runCommand(plan, input);
        return;
      }
    }
    if (input.llmReplyStream) {
      yield* tryLLMStream(input, parsed.type, input.message, undefined, convAgents);
      yield { kind: "done", agents: convAgents };
      return;
    }
    const reply = (await tryLLM(input, parsed.type, input.message, convAgents)) ?? parsed.reply;
    yield* streamText(reply, input.signal);
    yield { kind: "done", agents: convAgents };
    return;
  }

  if (parsed.type === "question") {
    const local = answerQuestion(parsed.question, input.project, input.ctx, input.rules);
    if (input.llmReplyStream) {
      yield* tryLLMStream(input, "question", input.message, local, convAgents);
      yield { kind: "done", agents: convAgents };
      return;
    }
    const remote = await tryLLM(input, "question", input.message, convAgents);
    const answer = remote ? `${local}\n\n${remote}` : local;
    yield* streamText(answer, input.signal);
    yield { kind: "done", agents: convAgents };
    return;
  }

  // command — o plano determinístico local é a fonte de verdade quando já
  // entendeu o pedido. O LLM só planeja em `unknown`; aqui ele não pode
  // sobrescrever medidas, parede alvo, material ou Blueprint validados.
  yield* runCommand(parsed.intents, input);
}

async function* runCommand(
  intents: readonly ParsedIntent[],
  input: AgentInput,
): AsyncGenerator<AgentChunk, void, void> {
  let project = input.project;
  const summaries: string[] = [];
  // Orquestração multiagente: escolhe agentes, ordena o pipeline e remove
  // execuções duplicadas antes de tocar no projeto.
  const plan = buildAgentPlan(input.message, intents);
  const participated: PlannerAgentId[] = [];
  let currentAgent: PlannerAgentId | null = null;
  let handle: ReturnType<typeof startAgentRun> | null = null;
  const agentTools: ToolName[] = [];
  /** Identidade do turno — base da idempotência por `toolCallId`. */
  const turnId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const closeRun = (success: boolean, error?: string) => {
    if (handle) handle.finish(success, [...agentTools], error);
    handle = null;
    agentTools.length = 0;
  };

  for (const step of plan.steps) {
    const intent: ParsedIntent = { tool: step.tool, args: step.args };
    if (input.signal?.aborted) {
      closeRun(false, "cancelado");
      yield { kind: "error", text: "Geração cancelada." };
      return;
    }
    if (step.agent !== currentAgent) {
      closeRun(true);
      currentAgent = step.agent;
      participated.push(step.agent);
      handle = startAgentRun(step.agent);
    }
    yield { kind: "tool", toolName: step.tool, toolArgs: step.args, agent: step.agent };
    let result: ToolExecutionResult;
    let outcome: PlannerToolResult;
    try {
      const executed = await executeIntent(
        intent,
        project,
        input,
        `${turnId}:${plan.steps.indexOf(step)}:${step.tool}`,
      );
      result = executed.result;
      outcome = executed.outcome;
    } catch (e) {
      closeRun(false, e instanceof Error ? e.message : "falha na ferramenta");
      yield { kind: "error", text: `Falha ao executar ${step.tool}.` };
      return;
    }
    agentTools.push(step.tool);
    project = result.project;
    const warn = outcome.warnings.length > 0 ? ` (${outcome.warnings[0]})` : "";
    summaries.push(`• ${result.summary}${outcome.ok ? "" : warn}`);
    yield {
      kind: "tool",
      toolName: step.tool,
      toolArgs: step.args,
      toolResult: result,
      toolOutcome: outcome,
      agent: step.agent,
    };
    await sleep(60, input.signal);
  }
  closeRun(true);

  const header = summaries.length > 1 ? "Pronto — executei os passos:\n" : "Pronto — ";
  const team = participated.length > 0 ? describeAgents(participated) : "";
  // Suposições da Ficha Técnica / resumo das alterações pontuais: o usuário
  // precisa saber o que foi assumido sem que a IA pergunte à toa.
  const hints = intents
    .map((i) => i.answerHint)
    .filter((h): h is string => typeof h === "string" && h.trim().length > 0);
  const hintLine =
    hints.length > 0 ? `\n\n${[...new Set(hints)].join(" ")} Se quiser, é só ajustar.` : "";
  const finalText = `${header}${summaries.join("\n")}${hintLine}${team ? `\n\n_Equipe: ${team}._` : ""}`;
  yield* streamText(finalText, input.signal);
  yield {
    kind: "done",
    toolResult: { project, summary: finalText, affectedIds: [] },
    agents: plan.agents,
  };
}

async function tryLLMPlan(input: AgentInput): Promise<readonly ParsedIntent[] | null> {
  if (!input.llmPlan) return null;
  try {
    const plan = await input.llmPlan({
      userMessage: input.message,
      project: input.project,
      ctx: input.ctx,
    });
    if (!Array.isArray(plan) || plan.length === 0) return null;
    // valida cada intent contra ToolName conhecido.
    const valid = plan.filter(
      (i): i is ParsedIntent =>
        !!i &&
        typeof i === "object" &&
        typeof (i as ParsedIntent).tool === "string" &&
        getToolContract((i as ParsedIntent).tool) !== null,
    );
    return valid.length > 0 ? (valid as readonly ParsedIntent[]) : null;
  } catch {
    return null;
  }
}

// Somente para referência de tipo (evita import não-usado em builds estritos).
export type _ToolNameForPlan = ToolName;

async function tryLLM(
  input: AgentInput,
  role: "smalltalk" | "unknown" | "question",
  userMessage: string,
  agents?: readonly PlannerAgentId[],
): Promise<string | null> {
  if (!input.llmReply) return null;
  const handle = startAgentRun(agents?.[0] ?? "designer");
  try {
    const text = await input.llmReply({
      userMessage,
      role,
      project: input.project,
      ctx: input.ctx,
      agents,
    });
    handle.finish(true, []);
    return text && text.trim().length > 0 ? text : null;
  } catch (e) {
    handle.finish(false, [], e instanceof Error ? e.message : "falha no LLM");
    return null;
  }
}

async function* tryLLMStream(
  input: AgentInput,
  role: "smalltalk" | "unknown" | "question",
  userMessage: string,
  prefix?: string,
  agents?: readonly PlannerAgentId[],
): AsyncGenerator<AgentChunk> {
  if (!input.llmReplyStream) return;
  const handle = startAgentRun(agents?.[0] ?? "designer");
  try {
    if (prefix) {
      yield { kind: "text", text: prefix };
      yield { kind: "text", text: "\n\n" };
    }
    for await (const delta of input.llmReplyStream({
      userMessage,
      role,
      project: input.project,
      ctx: input.ctx,
      agents,
    })) {
      if (input.signal?.aborted) return;
      if (delta) yield { kind: "text", text: delta };
    }
    handle.finish(true, []);
  } catch (e) {
    handle.finish(false, [], e instanceof Error ? e.message : "falha no streaming");
    // Falha silenciosa no streaming: o hook já marca erro no estado.
  }
}

async function* streamText(text: string, signal?: AbortSignal): AsyncGenerator<AgentChunk> {
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    if (signal?.aborted) return;
    await sleep(12, signal);
    yield { kind: "text", text: part };
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(t);
        resolve();
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
