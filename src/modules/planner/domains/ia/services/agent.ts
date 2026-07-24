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
import {
  TOOL_FUNCTIONS,
  type ToolContext,
  type ToolExecutionResult,
} from "./tools";

export interface AgentInput {
  message: string;
  project: PlannerProject;
  ctx: ToolContext;
  rules: CompanyManufacturingRules;
  signal?: AbortSignal;
}

export interface AgentChunk {
  kind: "text" | "tool" | "done" | "error";
  text?: string;
  toolName?: string;
  toolArgs?: Readonly<Record<string, unknown>>;
  toolResult?: ToolExecutionResult;
}

function executeIntent(
  intent: ParsedIntent,
  project: PlannerProject,
  ctx: ToolContext,
): ToolExecutionResult {
  const fn = TOOL_FUNCTIONS[intent.tool] as
    | ((p: PlannerProject, c: ToolContext, a: Readonly<Record<string, unknown>>) => ToolExecutionResult)
    | undefined;
  if (!fn) {
    return {
      project,
      summary: `Ferramenta desconhecida: ${intent.tool}.`,
      affectedIds: [],
    };
  }
  return fn(project, ctx, intent.args ?? {});
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

  if (parsed.type === "smalltalk" || parsed.type === "unknown") {
    yield* streamText(parsed.reply, input.signal);
    yield { kind: "done" };
    return;
  }

  if (parsed.type === "question") {
    const answer = answerQuestion(parsed.question, input.project, input.ctx, input.rules);
    yield* streamText(answer, input.signal);
    yield { kind: "done" };
    return;
  }

  // command
  let project = input.project;
  const summaries: string[] = [];
  for (const intent of parsed.intents) {
    if (input.signal?.aborted) {
      yield { kind: "error", text: "Geração cancelada." };
      return;
    }
    yield {
      kind: "tool",
      toolName: intent.tool,
      toolArgs: intent.args,
    };
    const result = executeIntent(intent, project, input.ctx);
    project = result.project;
    summaries.push(`• ${result.summary}`);
    yield { kind: "tool", toolName: intent.tool, toolArgs: intent.args, toolResult: result };
    // pequena pausa para dar feeling de tool-loop sem travar a UI
    await sleep(60, input.signal);
  }

  const header = summaries.length > 1 ? "Pronto — executei os passos:\n" : "Pronto — ";
  const finalText = `${header}${summaries.join("\n")}`;
  yield* streamText(finalText, input.signal);
  yield { kind: "done", toolResult: { project, summary: finalText, affectedIds: [] } };
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