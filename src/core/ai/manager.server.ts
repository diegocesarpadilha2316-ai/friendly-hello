import { AI_GATEWAY_CONFIG } from "./config";
import { AIRegistry } from "./registry.server";
import {
  AIGatewayError,
  type AICapability,
  type AIGatewayMetrics,
  type AIProvider,
  type AIProviderHealth,
  type AIProviderId,
  type AIRequest,
  type AIResponse,
  type AIStreamChunk,
  type AITaskType,
} from "./types";

/**
 * AIManager — orquestrador único do Gateway.
 *
 * Responsabilidades:
 *  - Seleção automática de provider por task hints
 *  - Prioridade, fallback, retry, timeout, cancelamento
 *  - Circuit breaker por provider
 *  - Limite de concorrência (fila)
 *  - Cache in-memory de respostas idempotentes
 *  - Métricas agregadas
 *
 * Nenhum módulo instancia providers — todos usam AIManager.
 */

interface CircuitState {
  failures: number;
  openedAt: number | null;
}

interface CacheEntry {
  value: AIResponse<unknown>;
  expiresAt: number;
}

const TASK_CAPABILITY: Record<AITaskType, AICapability> = {
  text: "text",
  json: "json",
  image: "image",
  embedding: "embedding",
  audio: "audio",
  video: "video",
};

class AIManagerImpl {
  private readonly circuits = new Map<AIProviderId, CircuitState>();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly metrics: {
    requests: number;
    errors: number;
    latencySum: number;
    creditsSpent: number;
    byProvider: Partial<Record<AIProviderId, number>>;
  } = { requests: 0, errors: 0, latencySum: 0, creditsSpent: 0, byProvider: {} };
  private inflight = 0;
  private queue: Array<() => void> = [];

  private circuit(id: AIProviderId): CircuitState {
    let s = this.circuits.get(id);
    if (!s) {
      s = { failures: 0, openedAt: null };
      this.circuits.set(id, s);
    }
    return s;
  }

  private isOpen(id: AIProviderId): boolean {
    const c = this.circuit(id);
    if (c.openedAt == null) return false;
    if (Date.now() - c.openedAt > AI_GATEWAY_CONFIG.circuitBreakerCooldownMs) {
      c.openedAt = null;
      c.failures = 0;
      return false;
    }
    return true;
  }

  private recordFailure(id: AIProviderId) {
    const c = this.circuit(id);
    c.failures += 1;
    if (c.failures >= AI_GATEWAY_CONFIG.circuitBreakerThreshold) {
      c.openedAt = Date.now();
    }
  }

  private recordSuccess(id: AIProviderId) {
    const c = this.circuit(id);
    c.failures = 0;
    c.openedAt = null;
  }

  private async acquire(): Promise<() => void> {
    if (this.inflight < AI_GATEWAY_CONFIG.concurrencyLimit) {
      this.inflight += 1;
      return () => this.release();
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.inflight += 1;
    return () => this.release();
  }

  private release() {
    this.inflight = Math.max(0, this.inflight - 1);
    const next = this.queue.shift();
    if (next) next();
  }

  private pickProviders(req: AIRequest): AIProvider[] {
    const cap = TASK_CAPABILITY[req.task.type];
    const all = AIRegistry.enabled().filter((p) => p.supports(cap));

    if (req.task.preferProvider) {
      const pref = AIRegistry.get(req.task.preferProvider);
      if (pref?.enabled && pref.supports(cap)) {
        return [pref, ...all.filter((p) => p.id !== pref.id)];
      }
    }

    const order = AI_GATEWAY_CONFIG.providerPriority;
    return [...all].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) + (a.priority - b.priority) * 0.01;
    });
  }

  private cacheKey(req: AIRequest): string | null {
    if (req.task.stream) return null;
    if (req.task.type === "image") return null;
    return JSON.stringify({
      t: req.task.type,
      m: req.task.preferModel,
      s: req.system,
      p: req.prompt,
      i: req.input,
      msg: req.messages,
    });
  }

  private async runWithRetry<T>(
    provider: AIProvider,
    fn: (p: AIProvider) => Promise<AIResponse<T>>,
  ): Promise<AIResponse<T>> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= AI_GATEWAY_CONFIG.retryAttempts; attempt++) {
      try {
        const out = await fn(provider);
        this.recordSuccess(provider.id);
        return out;
      } catch (e) {
        lastErr = e;
        const code = e instanceof AIGatewayError ? e.code : "provider_error";
        if (code === "credits_exhausted" || code === "unsupported" || code === "invalid_request") {
          throw e;
        }
        this.recordFailure(provider.id);
        if (attempt < AI_GATEWAY_CONFIG.retryAttempts) {
          await new Promise((r) => setTimeout(r, AI_GATEWAY_CONFIG.retryBackoffMs * (attempt + 1)));
        }
      }
    }
    throw lastErr;
  }

  private async dispatch<T>(
    req: AIRequest,
    call: (p: AIProvider) => Promise<AIResponse<T>>,
  ): Promise<AIResponse<T>> {
    const providers = this.pickProviders(req);
    if (!providers.length) throw new AIGatewayError("Nenhum provider disponível", "no_provider");

    const release = await this.acquire();
    const started = Date.now();
    this.metrics.requests += 1;

    try {
      const key = this.cacheKey(req);
      if (key) {
        const hit = this.cache.get(key);
        if (hit && hit.expiresAt > Date.now()) {
          return { ...(hit.value as AIResponse<T>), cached: true };
        }
      }

      let lastErr: unknown;
      for (const p of providers) {
        if (this.isOpen(p.id)) {
          lastErr = new AIGatewayError(`Circuito aberto: ${p.id}`, "circuit_open", p.id);
          continue;
        }
        try {
          const out = await this.runWithRetry(p, call);
          this.metrics.byProvider[p.id] = (this.metrics.byProvider[p.id] ?? 0) + 1;
          this.metrics.creditsSpent += out.usage.credits;
          if (key)
            this.cache.set(key, {
              value: out as AIResponse<unknown>,
              expiresAt: Date.now() + AI_GATEWAY_CONFIG.cacheTtlMs,
            });
          return out;
        } catch (e) {
          lastErr = e;
          if (!AI_GATEWAY_CONFIG.fallbackEnabled) break;
        }
      }
      this.metrics.errors += 1;
      throw lastErr instanceof Error
        ? lastErr
        : new AIGatewayError("Falha desconhecida", "provider_error");
    } finally {
      this.metrics.latencySum += Date.now() - started;
      release();
    }
  }

  /* ============== API pública ============== */

  generateText(req: AIRequest): Promise<AIResponse<string>> {
    return this.dispatch(req, (p) => p.generateText(req));
  }
  generateJson<T = unknown>(req: AIRequest): Promise<AIResponse<T>> {
    return this.dispatch<T>(req, (p) => p.generateJson<T>(req));
  }
  generateImage(req: AIRequest): Promise<AIResponse<{ url?: string; b64?: string }>> {
    return this.dispatch(req, (p) => p.generateImage(req));
  }
  generateEmbedding(req: AIRequest): Promise<AIResponse<readonly number[][]>> {
    return this.dispatch(req, (p) => p.generateEmbedding(req));
  }

  async *stream(req: AIRequest): AsyncIterable<AIStreamChunk> {
    const providers = this.pickProviders(req);
    if (!providers.length) throw new AIGatewayError("Nenhum provider disponível", "no_provider");
    for (const p of providers) {
      if (this.isOpen(p.id)) continue;
      try {
        yield* p.stream(req);
        return;
      } catch (e) {
        this.recordFailure(p.id);
        if (!AI_GATEWAY_CONFIG.fallbackEnabled) throw e;
      }
    }
    throw new AIGatewayError("Streaming falhou em todos os providers", "provider_error");
  }

  async healthAll(): Promise<readonly AIProviderHealth[]> {
    return Promise.all(AIRegistry.all().map((p) => p.health()));
  }

  getMetrics(): AIGatewayMetrics {
    const totalRequests = this.metrics.requests || 1;
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgLatencyMs: Math.round(this.metrics.latencySum / totalRequests),
      creditsSpent: this.metrics.creditsSpent,
      byProvider: this.metrics.byProvider as AIGatewayMetrics["byProvider"],
    };
  }
}

export const AIManager = new AIManagerImpl();
