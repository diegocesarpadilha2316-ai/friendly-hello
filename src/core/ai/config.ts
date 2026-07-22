import type { AIProviderId } from "./types";

/**
 * Configuração central do AI Gateway.
 * Nada de secrets aqui — apenas flags e defaults.
 */
export interface AIGatewayConfig {
  readonly defaultProvider: AIProviderId;
  readonly providerPriority: readonly AIProviderId[];
  readonly fallbackEnabled: boolean;
  readonly retryAttempts: number;
  readonly retryBackoffMs: number;
  readonly defaultTimeoutMs: number;
  readonly concurrencyLimit: number;
  readonly circuitBreakerThreshold: number; // erros consecutivos p/ abrir
  readonly circuitBreakerCooldownMs: number;
  readonly cacheTtlMs: number;
  readonly featureFlags: Readonly<{
    streaming: boolean;
    multimodal: boolean;
    tools: boolean;
    mcp: boolean;
    agents: boolean;
  }>;
}

export const AI_GATEWAY_CONFIG: AIGatewayConfig = {
  defaultProvider: "lovable",
  providerPriority: [
    "lovable",
    "openai",
    "google",
    "anthropic",
    "openrouter",
    "deepseek",
    "mistral",
    "grok",
    "ollama",
  ],
  fallbackEnabled: true,
  retryAttempts: 2,
  retryBackoffMs: 400,
  defaultTimeoutMs: 45_000,
  concurrencyLimit: 8,
  circuitBreakerThreshold: 5,
  circuitBreakerCooldownMs: 30_000,
  cacheTtlMs: 60_000,
  featureFlags: {
    streaming: true,
    multimodal: true,
    tools: false,
    mcp: false,
    agents: false,
  },
};
