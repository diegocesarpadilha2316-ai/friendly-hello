import type { AIProvider, AIProviderId } from "../types";
import { DeepSeekProvider } from "./deepseek";
import { LovableProvider } from "./lovable";
import { ClaudeProvider, GeminiProvider, MistralProvider, OSSProvider, OpenAIProvider } from "./stubs";

export { BaseAIProvider } from "./base";
export { DeepSeekProvider } from "./deepseek";
export { LovableProvider } from "./lovable";
export { ClaudeProvider, GeminiProvider, MistralProvider, OSSProvider, OpenAIProvider } from "./stubs";

export interface ProviderCreateOptions {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly defaultModel?: string;
}

export interface ProviderRegistryOptions {
  readonly lovable?: ProviderCreateOptions;
  readonly deepseek?: ProviderCreateOptions;
  readonly openai?: ProviderCreateOptions;
  readonly gemini?: ProviderCreateOptions;
  readonly claude?: ProviderCreateOptions;
  readonly mistral?: ProviderCreateOptions;
  readonly oss?: ProviderCreateOptions;
}

export function createProvider(id: AIProviderId, opts: ProviderRegistryOptions = {}): AIProvider {
  switch (id) {
    case "lovable":
      return new LovableProvider(opts.lovable);
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

export const DEFAULT_PROVIDER: AIProviderId = "lovable";

export function listProviders(): readonly AIProviderId[] {
  return ["lovable", "deepseek", "openai", "gemini", "claude", "mistral", "oss"] as const;
}