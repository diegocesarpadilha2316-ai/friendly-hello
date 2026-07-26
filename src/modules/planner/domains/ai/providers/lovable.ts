import type { AIProviderConfig } from "../types";
import { DeepSeekProvider } from "./deepseek";

/**
 * Provider Lovable AI — reutiliza a implementação OpenAI-compatível do
 * DeepSeek, mas aponta para o proxy interno `/api/ai/chat`, que injeta
 * `LOVABLE_API_KEY` server-side. Modelo padrão: google/gemini-3.6-flash.
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
}