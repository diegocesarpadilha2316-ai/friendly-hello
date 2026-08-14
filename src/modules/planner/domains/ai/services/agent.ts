import type { PlannerProject } from "@/modules/planner/shared";
import type { AIChatChunk, AIChatResponse, AIMessage, AIProvider, AIToolResult } from "../types";
import { pushLog } from "./logs";
import { runToolCall, toolSchemas } from "./tools";

export interface AgentRunOptions {
  readonly stream?: boolean;
  readonly signal?: AbortSignal;
  readonly onChunk?: (chunk: AIChatChunk) => void;
  readonly onToolResult?: (result: AIToolResult) => void;
  readonly applyProject?: (updater: (p: PlannerProject) => PlannerProject) => void;
  readonly currentProject?: PlannerProject | null;
  readonly maxToolIterations?: number;
}

export interface AgentRunResult {
  readonly finalMessage: AIMessage;
  readonly response: AIChatResponse;
  readonly toolResults: readonly AIToolResult[];
}

/**
 * Orquestra um turno completo: chat + tool-calling iterativo.
 * Tool-calls aplicados via `applyProject()` (canal único do editor).
 */
export async function runAgent(
  provider: AIProvider,
  messages: readonly AIMessage[],
  options: AgentRunOptions = {},
): Promise<AgentRunResult> {
  const start = Date.now();
  const maxIter = Math.max(1, options.maxToolIterations ?? 4);
  let conversation: AIMessage[] = [...messages];
  const toolResults: AIToolResult[] = [];
  let response: AIChatResponse = { content: "", toolCalls: [], finishReason: null };

  for (let i = 0; i < maxIter; i++) {
    const opts = {
      tools: toolSchemas(),
      signal: options.signal,
      stream: options.stream ?? true,
    };
    response = options.stream
      ? await provider.stream(conversation, options.onChunk ?? (() => {}), opts)
      : await provider.chat(conversation, opts);

    if (response.toolCalls.length === 0) break;

    conversation = [
      ...conversation,
      { role: "assistant", content: response.content, toolCalls: response.toolCalls },
    ];

    for (const call of response.toolCalls) {
      const project = options.currentProject ?? null;
      if (project && options.applyProject) {
        options.applyProject((p) => runToolCall(call, p).next);
        const { result } = runToolCall(call, project);
        toolResults.push(result);
        options.onToolResult?.(result);
        conversation = [
          ...conversation,
          { role: "tool", content: JSON.stringify(result), toolCallId: call.id, name: call.name },
        ];
      } else {
        const result: AIToolResult = {
          toolCallId: call.id,
          name: call.name,
          ok: false,
          error: "sem projeto ativo",
        };
        toolResults.push(result);
        options.onToolResult?.(result);
        conversation = [
          ...conversation,
          { role: "tool", content: JSON.stringify(result), toolCallId: call.id, name: call.name },
        ];
      }
    }
  }

  pushLog({
    provider: provider.config.id,
    model: provider.config.defaultModel,
    kind: "chat",
    message: `turno concluído (${toolResults.length} tool(s))`,
    durationMs: Date.now() - start,
    tokens: response.usage?.totalTokens,
  });

  return {
    finalMessage: {
      role: "assistant",
      content: response.content,
      createdAt: new Date().toISOString(),
    },
    response,
    toolResults,
  };
}
