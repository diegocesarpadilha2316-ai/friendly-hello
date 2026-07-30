import type {
  AIChatChunk,
  AIChatOptions,
  AIChatResponse,
  AIMessage,
  AIProviderConfig,
} from "../types";
import { DeepSeekProvider } from "./deepseek";

/**
 * Provider Lovable AI — reutiliza a implementação OpenAI-compatível do
 * DeepSeek, mas aponta para o proxy interno `/api/ai`, que injeta
 * `LOVABLE_API_KEY` server-side. Modelo padrão: google/gemini-3.6-flash.
 *
 * O proxy é autenticado: cada chamada envia o access token do Supabase e o
 * tenant ativo, exatamente como o `functionMiddleware` faz para server fns.
 */
export class LovableProvider extends DeepSeekProvider {
  constructor(opts: { baseUrl?: string; defaultModel?: string } = {}) {
    super({
      baseUrl: opts.baseUrl ?? "/api/ai",
      defaultModel: opts.defaultModel ?? "google/gemini-3.6-flash",
      apiKey: undefined,
    });
    (this.config as { id: AIProviderConfig["id"]; label: string }).id = "lovable";
    (this.config as { label: string }).label = "Lovable AI";
  }

  /** Recarrega Authorization + tenant antes de cada requisição. */
  private async refreshAuthHeaders(): Promise<void> {
    if (typeof window === "undefined") return;
    const next: Record<string, string> = {};
    try {
      const { getSupabaseBrowser } = await import("@/core/lib/supabase/client");
      const { data } = await getSupabaseBrowser().auth.getSession();
      if (data.session?.access_token) {
        next.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch {
      /* sessão indisponível — servidor responderá 401 */
    }
    try {
      const { getActiveTenantIdFromStorage } = await import("@/core/providers/TenantProvider");
      const tenantId = getActiveTenantIdFromStorage();
      if (tenantId) next["x-dioris-tenant"] = tenantId;
    } catch {
      /* sem tenant selecionado — servidor resolve ou responde 403 */
    }
    this.extraHeaders = next;
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
