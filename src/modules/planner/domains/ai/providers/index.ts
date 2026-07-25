import type { AIProvider, AIProviderId } from "../types";
import { DeepSeekProvider } from "./deepseek";
import { ClaudeProvider, GeminiProvider, MistralProvider, OSSProvider, OpenAIProvider } from "./stubs";

export { BaseAIProvider } from "./base";
export { DeepSeekProvider } from "./deepseek";
export { ClaudeProvider, GeminiProvider, MistralProvider, OSSProvider, OpenAIProvider } from "./stubs";

export interface ProviderCreateOptions {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly defaultModel?: string;
}

export interface ProviderRegistryOptions {
  readonly deepseek?: ProviderCreateOptions;
  readonly openai?: ProviderCreateOptions;
  readonly gemini?: ProviderCreateOptions;
  readonly claude?: ProviderCreateOptions;
  readonly mistral?: ProviderCreateOptions;
  readonly oss?: ProviderCreateOptions;
}

export function createProvider(id: AIProviderId, opts: ProviderRegistryOptions = {}): AIProvider {
  switch (id) {
    case "deepseek":
      return new DeepSeekProvider(opts.deepseek);
    case "openai":
      return new OpenAIProvider(opts.openai);
    case "gemini":
      return new GeminiProvider(opts.gemini);
    case "claude":
      return new ClaudeProvider(opts.claude);
    case "mistral":
      return new MistralProvider(opts.mistral);
    case "oss":
      return new OSSProvider(opts.oss);
  }
}

export const DEFAULT_PROVIDER: AIProviderId = "deepseek";

export function listProviders(): readonly AIProviderId[] {
  return ["deepseek", "openai", "gemini", "claude", "mistral", "oss"] as const;
}