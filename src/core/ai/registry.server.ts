import type { AIProvider, AIProviderId } from "./types";
import { LovableAIProvider } from "./providers/lovable.server";
import {
  AnthropicProvider,
  DeepSeekProvider,
  GoogleProvider,
  GrokProvider,
  MistralProvider,
  OllamaProvider,
  OpenAIProvider,
  OpenRouterProvider,
} from "./providers/stubs";

/**
 * AIRegistry — registro único de providers do Gateway.
 * Server-only. Providers concretos são registrados aqui.
 */
class AIRegistryImpl {
  private readonly map = new Map<AIProviderId, AIProvider>();

  register(provider: AIProvider): void {
    this.map.set(provider.id, provider);
  }
  get(id: AIProviderId): AIProvider | undefined {
    return this.map.get(id);
  }
  all(): readonly AIProvider[] {
    return Array.from(this.map.values());
  }
  enabled(): readonly AIProvider[] {
    return this.all().filter((p) => p.enabled);
  }
}

export const AIRegistry = new AIRegistryImpl();

// Registro default — Lovable como provider ativo. Outros preparados/desativados.
AIRegistry.register(new LovableAIProvider());
AIRegistry.register(OpenAIProvider);
AIRegistry.register(GoogleProvider);
AIRegistry.register(AnthropicProvider);
AIRegistry.register(OpenRouterProvider);
AIRegistry.register(DeepSeekProvider);
AIRegistry.register(MistralProvider);
AIRegistry.register(GrokProvider);
AIRegistry.register(OllamaProvider);
