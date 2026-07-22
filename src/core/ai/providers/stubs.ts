import { BaseAIProvider } from "./base";
import { AI_MODEL_CATALOG } from "../catalog";
import type { AIProviderId } from "../types";

/**
 * Providers preparados — arquitetura pronta, execução desativada até
 * receberem credenciais/config próprias. Herdam o contrato e retornam
 * "unsupported" via base até serem ativados.
 */
class StubProvider extends BaseAIProvider {
  constructor(
    readonly id: AIProviderId,
    readonly label: string,
    readonly priority: number,
  ) {
    super();
  }
  readonly enabled = false;
  readonly models = AI_MODEL_CATALOG.filter((m) => m.provider === this.id);
}

export const OpenAIProvider = new StubProvider("openai", "OpenAI (direct)", 10);
export const GoogleProvider = new StubProvider("google", "Google Gemini (direct)", 11);
export const AnthropicProvider = new StubProvider("anthropic", "Anthropic Claude", 12);
export const OpenRouterProvider = new StubProvider("openrouter", "OpenRouter", 13);
export const DeepSeekProvider = new StubProvider("deepseek", "DeepSeek", 14);
export const MistralProvider = new StubProvider("mistral", "Mistral", 15);
export const GrokProvider = new StubProvider("grok", "xAI Grok", 16);
export const OllamaProvider = new StubProvider("ollama", "Ollama (local)", 20);
