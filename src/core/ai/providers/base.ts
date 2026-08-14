import type {
  AICapability,
  AIProvider,
  AIProviderHealth,
  AIProviderId,
  AIModel,
  AIRequest,
  AIResponse,
  AIStreamChunk,
} from "../types";
import { AIGatewayError } from "../types";

/**
 * Base abstrata — todo provider concreto herda daqui.
 * Métodos não suportados retornam AIGatewayError("unsupported").
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly id: AIProviderId;
  abstract readonly label: string;
  abstract readonly enabled: boolean;
  abstract readonly priority: number;
  abstract readonly models: readonly AIModel[];

  supports(capability: AICapability): boolean {
    return this.models.some((m) => m.capabilities.includes(capability));
  }

  async health(): Promise<AIProviderHealth> {
    return {
      provider: this.id,
      status: this.enabled ? "unknown" : "down",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }

  generateText(_req: AIRequest): Promise<AIResponse<string>> {
    throw new AIGatewayError(`${this.id}: text generation not implemented`, "unsupported", this.id);
  }
  generateJson<T = unknown>(_req: AIRequest): Promise<AIResponse<T>> {
    throw new AIGatewayError(`${this.id}: json generation not implemented`, "unsupported", this.id);
  }
  async *stream(_req: AIRequest): AsyncIterable<AIStreamChunk> {
    throw new AIGatewayError(`${this.id}: streaming not implemented`, "unsupported", this.id);
  }
  generateImage(_req: AIRequest): Promise<AIResponse<{ url?: string; b64?: string }>> {
    throw new AIGatewayError(
      `${this.id}: image generation not implemented`,
      "unsupported",
      this.id,
    );
  }
  generateEmbedding(_req: AIRequest): Promise<AIResponse<readonly number[][]>> {
    throw new AIGatewayError(`${this.id}: embeddings not implemented`, "unsupported", this.id);
  }
  countTokens(text: string): number {
    // Estimador heurístico ~ 4 chars/token. Providers podem sobrescrever.
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
