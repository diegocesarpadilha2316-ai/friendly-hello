import type {
  AIChatChunk,
  AIChatOptions,
  AIChatResponse,
  AIMessage,
  AIProviderConfig,
  AIToolCall,
} from "../types";
import { BaseAIProvider, withTimeout } from "./base";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

interface DeepSeekOptions {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly defaultModel?: string;
}

/**
 * Provider DeepSeek — ativo por padrão.
 * API compatível com OpenAI Chat Completions.
 */
export class DeepSeekProvider extends BaseAIProvider {
  constructor(opts: DeepSeekOptions = {}) {
    const config: AIProviderConfig = {
      id: "deepseek",
      label: "DeepSeek",
      baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? DEFAULT_MODEL,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    };
    super(config);
  }

  /** Headers extras injetados por subclasses (ex.: auth do proxy interno). */
  protected extraHeaders: Record<string, string> = {};

  protected headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.apiKey) h.Authorization = `Bearer ${this.config.apiKey}`;
    return { ...h, ...this.extraHeaders };
  }

  /**
   * URL final de chat completions. Subclasses que falam com um proxy
   * interno (rota canônica própria) sobrescrevem este método.
   */
  protected chatEndpoint(): string {
    return `${this.config.baseUrl}/v1/chat/completions`;
  }

  private buildBody(
    messages: readonly AIMessage[],
    options: AIChatOptions | undefined,
    stream: boolean,
  ): string {
    return JSON.stringify({
      model: options?.model ?? this.config.defaultModel,
      stream,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.arguments) },
        })),
      })),
      tools: options?.tools?.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    });
  }

  async chat(messages: readonly AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const signal = withTimeout(options?.signal, options?.timeoutMs ?? 60_000);
    const res = await fetch(this.chatEndpoint(), {
      method: "POST",
      headers: this.headers(),
      body: this.buildBody(messages, options, false),
      signal,
    });
    if (!res.ok) {
      throw new Error(`[deepseek] ${res.status} ${await res.text().catch(() => "")}`.trim());
    }
    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
        finish_reason?: string;
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const choice = json.choices?.[0];
    const toolCalls: AIToolCall[] =
      choice?.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: safeParse(tc.function.arguments),
      })) ?? [];
    return {
      content: choice?.message?.content ?? "",
      toolCalls,
      finishReason: normalizeFinish(choice?.finish_reason),
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
    };
  }

  async stream(
    messages: readonly AIMessage[],
    onChunk: (chunk: AIChatChunk) => void,
    options?: AIChatOptions,
  ): Promise<AIChatResponse> {
    const signal = withTimeout(options?.signal, options?.timeoutMs ?? 120_000);
    const res = await fetch(this.chatEndpoint(), {
      method: "POST",
      headers: this.headers(),
      body: this.buildBody(messages, options, true),
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`[deepseek] ${res.status} ${await res.text().catch(() => "")}`.trim());
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    const rawArgs: Record<number, string> = {};
    const toolCalls: AIToolCall[] = [];
    let finish: AIChatResponse["finishReason"] = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        const parsed = safeParse(payload) as {
          choices?: Array<{
            delta?: {
              content?: string;
              tool_calls?: Array<{
                index: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
            finish_reason?: string;
          }>;
        };
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          onChunk({ delta: delta.content });
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCalls[tc.index]) {
              toolCalls[tc.index] = {
                id: tc.id ?? `tc_${tc.index}`,
                name: tc.function?.name ?? "",
                arguments: {},
              };
              rawArgs[tc.index] = "";
            }
            if (tc.function?.name) {
              toolCalls[tc.index] = { ...toolCalls[tc.index], name: tc.function.name };
            }
            if (tc.function?.arguments) {
              rawArgs[tc.index] = (rawArgs[tc.index] ?? "") + tc.function.arguments;
              toolCalls[tc.index] = {
                ...toolCalls[tc.index],
                arguments: safeParse(rawArgs[tc.index]),
              };
            }
          }
        }
        const fr = parsed.choices?.[0]?.finish_reason;
        if (fr) finish = normalizeFinish(fr);
      }
    }
    onChunk({ finishReason: finish ?? "stop" });
    return { content, toolCalls, finishReason: finish ?? "stop" };
  }
}

function safeParse(input: string | undefined): Record<string, unknown> {
  if (!input) return {};
  try {
    const v = JSON.parse(input) as unknown;
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function normalizeFinish(fr: string | undefined | null): AIChatResponse["finishReason"] {
  if (!fr) return null;
  if (fr === "stop" || fr === "length" || fr === "tool_calls") return fr;
  return "stop";
}
