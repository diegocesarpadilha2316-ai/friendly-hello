/**
 * AI Gateway — tipos canônicos.
 *
 * ⚠️ Único ponto de comunicação entre a plataforma Dioris e qualquer
 * modelo de IA. Nenhum módulo pode consumir APIs de IA diretamente —
 * tudo passa pelo Gateway (AIManager + AIRegistry).
 */

export type AIProviderId =
  | "lovable"
  | "openai"
  | "google"
  | "anthropic"
  | "openrouter"
  | "deepseek"
  | "mistral"
  | "grok"
  | "ollama";

export type AICapability =
  | "text"
  | "json"
  | "stream"
  | "image"
  | "embedding"
  | "audio"
  | "video"
  | "tools"
  | "multimodal"
  | "mcp";

export type AITaskType = "text" | "json" | "image" | "embedding" | "audio" | "video";

export type AIQuality = "draft" | "standard" | "premium" | "frontier";
export type AISpeed = "fast" | "balanced" | "slow";
export type AICost = "cheap" | "balanced" | "premium";

export interface AIModel {
  readonly id: string; // ex: "google/gemini-3.6-flash"
  readonly provider: AIProviderId;
  readonly label: string;
  readonly capabilities: readonly AICapability[];
  readonly quality: AIQuality;
  readonly speed: AISpeed;
  readonly cost: AICost;
  readonly contextTokens: number;
  readonly creditsPer1kInput: number;
  readonly creditsPer1kOutput: number;
  readonly enabled: boolean;
}

export interface AIProviderHealth {
  readonly provider: AIProviderId;
  readonly status: "healthy" | "degraded" | "down" | "unknown";
  readonly latencyMs: number | null;
  readonly checkedAt: string;
  readonly message?: string;
}

export interface AITaskHints {
  readonly type: AITaskType;
  readonly quality?: AIQuality;
  readonly speed?: AISpeed;
  readonly cost?: AICost;
  readonly stream?: boolean;
  readonly needs?: readonly AICapability[];
  readonly preferProvider?: AIProviderId;
  readonly preferModel?: string;
}

export interface AIRequest {
  readonly task: AITaskHints;
  readonly system?: string;
  readonly prompt?: string;
  readonly messages?: readonly AIMessage[];
  readonly input?: string | readonly string[]; // embeddings
  readonly image?: { prompt: string; size?: string };
  readonly jsonSchema?: unknown;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly metadata?: Record<string, string>;
}

export interface AIMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
}

export interface AIUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly credits: number;
}

export interface AIResponse<T = string> {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly output: T;
  readonly usage: AIUsage;
  readonly latencyMs: number;
  readonly cached: boolean;
  readonly finishReason: "stop" | "length" | "content_filter" | "error" | "unknown";
}

export interface AIStreamChunk {
  readonly delta: string;
  readonly done: boolean;
}

/** Contrato único que todo provider precisa implementar. */
export interface AIProvider {
  readonly id: AIProviderId;
  readonly label: string;
  readonly enabled: boolean;
  readonly priority: number; // menor = maior prioridade
  readonly models: readonly AIModel[];
  supports(capability: AICapability): boolean;
  health(): Promise<AIProviderHealth>;
  generateText(req: AIRequest): Promise<AIResponse<string>>;
  generateJson<T = unknown>(req: AIRequest): Promise<AIResponse<T>>;
  stream(req: AIRequest): AsyncIterable<AIStreamChunk>;
  generateImage(req: AIRequest): Promise<AIResponse<{ url?: string; b64?: string }>>;
  generateEmbedding(req: AIRequest): Promise<AIResponse<readonly number[][]>>;
  countTokens(text: string): number;
}

export interface AIGatewayMetrics {
  readonly requests: number;
  readonly errors: number;
  readonly avgLatencyMs: number;
  readonly creditsSpent: number;
  readonly byProvider: Readonly<Record<AIProviderId, number>>;
}

/** Erro base do Gateway — envelope estável para toda a plataforma. */
export class AIGatewayError extends Error {
  constructor(
    message: string,
    readonly code:
      | "no_provider"
      | "circuit_open"
      | "timeout"
      | "rate_limited"
      | "credits_exhausted"
      | "unsupported"
      | "provider_error"
      | "invalid_request",
    readonly provider?: AIProviderId,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIGatewayError";
  }
}
