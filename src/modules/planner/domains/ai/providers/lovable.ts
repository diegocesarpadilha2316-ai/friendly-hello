import type {
  AIChatChunk,
  AIChatOptions,
  AIChatResponse,
  AIMessage,
  AIProviderConfig,
} from "../types";
import { DeepSeekProvider } from "./deepseek";
import { AI_PROXY_ENDPOINT, buildAiProxyHeaders } from "../proxy";

/**
 * Provider Lovable AI — reutiliza a implementação OpenAI-compatível do
 * DeepSeek, mas aponta para a rota canônica protegida `/api/ai/chat`, que
 * injeta `LOVABLE_API_KEY` server-side. Modelo padrão: google/gemini-3.6-flash.
 *
 * O proxy é autenticado: cada chamada envia o access token do Supabase e o
 * tenant ativo, exatamente como o `functionMiddleware` faz para server fns.
 */
export class LovableProvider extends DeepSeekProvider {
  private readonly endpoint: string;

  constructor(opts: { baseUrl?: string; defaultModel?: string } = {}) {
    super({
      baseUrl: opts.baseUrl ?? AI_PROXY_ENDPOINT,
      defaultModel: opts.defaultModel ?? "deepseek-chat",
      apiKey: undefined,
    });
    this.endpoint = opts.baseUrl ?? AI_PROXY_ENDPOINT;
    (this.config as { id: AIProviderConfig["id"]; label: string }).id = "lovable";
    (this.config as { label: string }).label = "Lovable AI";
  }

  /** A rota canônica já é a URL completa — sem sufixo `/v1/chat/completions`. */
  protected override chatEndpoint(): string {
    return this.endpoint;
  }

  /** Recarrega Authorization + tenant antes de cada requisição. */
  private async refreshAuthHeaders(): Promise<void> {
    if (typeof window === "undefined") return;
    this.extraHeaders = await buildAiProxyHeaders();
  }

  override async chat(
    messages: readonly AIMessage[],
    options?: AIChatOptions,
  ): Promise<AIChatResponse> {
    await this.refreshAuthHeaders();
    return super.chat(messages, options);
  }

  override async stream(
    messages: readonly AIMessage[],
    onChunk: (chunk: AIChatChunk) => void,
    options?: AIChatOptions,
  ): Promise<AIChatResponse> {
    await this.refreshAuthHeaders();
    return super.stream(messages, onChunk, options);
  }
}
