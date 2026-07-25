import type {
  AIChatChunk,
  AIChatOptions,
  AIChatResponse,
  AIMessage,
  AIProvider,
  AIProviderConfig,
} from "../types";

/**
 * Base abstrata para todos os providers. Fornece implementações
 * seguras (no-op) para stubs — providers ativos sobrescrevem `chat`
 * e `stream`.
 */
export abstract class BaseAIProvider implements AIProvider {
  public readonly config: AIProviderConfig;

  protected constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async chat(_messages: readonly AIMessage[], _options?: AIChatOptions): Promise<AIChatResponse> {
    throw new Error(`[ai] provider '${this.config.id}' não implementa chat`);
  }

  async stream(
    messages: readonly AIMessage[],
    onChunk: (chunk: AIChatChunk) => void,
    options?: AIChatOptions,
  ): Promise<AIChatResponse> {
    const res = await this.chat(messages, options);
    if (res.content) onChunk({ delta: res.content });
    onChunk({ finishReason: res.finishReason ?? "stop" });
    return res;
  }
}

export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(new Error("timeout")), ms);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  const clear = () => clearTimeout(t);
  controller.signal.addEventListener("abort", clear, { once: true });
  return controller.signal;
}