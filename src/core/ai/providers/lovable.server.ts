import { BaseAIProvider } from "./base";
import { AI_MODEL_CATALOG } from "../catalog";
import {
  AIGatewayError,
  type AIModel,
  type AIProviderHealth,
  type AIProviderId,
  type AIRequest,
  type AIResponse,
  type AIStreamChunk,
} from "../types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

function buildMessages(req: AIRequest) {
  if (req.messages && req.messages.length) return req.messages;
  const msgs: { role: string; content: string }[] = [];
  if (req.system) msgs.push({ role: "system", content: req.system });
  if (req.prompt) msgs.push({ role: "user", content: req.prompt });
  return msgs;
}

function requireKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AIGatewayError("LOVABLE_API_KEY ausente", "provider_error", "lovable");
  return key;
}

function computeCredits(model: AIModel, inputTokens: number, outputTokens: number) {
  return Math.max(
    1,
    Math.round(
      (inputTokens / 1000) * model.creditsPer1kInput +
        (outputTokens / 1000) * model.creditsPer1kOutput,
    ),
  );
}

/**
 * Provider default do Gateway — usa Lovable AI Gateway como backend
 * unificado (modelos OpenAI, Google, etc. atrás da mesma API).
 * Server-only.
 */
export class LovableAIProvider extends BaseAIProvider {
  readonly id: AIProviderId = "lovable";
  readonly label = "Lovable AI Gateway";
  readonly enabled = true;
  readonly priority = 1;
  readonly models = AI_MODEL_CATALOG.filter((m) => m.provider === "lovable");

  private modelById(id: string): AIModel {
    const m = this.models.find((x) => x.id === id);
    if (!m) throw new AIGatewayError(`Modelo desconhecido: ${id}`, "invalid_request", this.id);
    return m;
  }

  async health(): Promise<AIProviderHealth> {
    const started = Date.now();
    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) {
        return {
          provider: this.id,
          status: "down",
          latencyMs: null,
          checkedAt: new Date().toISOString(),
          message: "LOVABLE_API_KEY ausente",
        };
      }
      return {
        provider: this.id,
        status: "healthy",
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
      };
    } catch (e) {
      return {
        provider: this.id,
        status: "down",
        latencyMs: null,
        checkedAt: new Date().toISOString(),
        message: (e as Error).message,
      };
    }
  }

  private async chat(req: AIRequest, jsonMode: boolean): Promise<AIResponse<string>> {
    const modelId = req.task.preferModel ?? "google/gemini-3.6-flash";
    const model = this.modelById(modelId);
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? 45_000);
    if (req.signal) req.signal.addEventListener("abort", () => controller.abort());

    try {
      const body: Record<string, unknown> = {
        model: modelId,
        messages: buildMessages(req),
      };
      if (jsonMode) body.response_format = { type: "json_object" };
      if (req.temperature !== undefined) body.temperature = req.temperature;
      if (req.maxTokens !== undefined) body.max_tokens = req.maxTokens;

      const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": requireKey(),
          "X-Lovable-AIG-SDK": "dioris-gateway",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 429) throw new AIGatewayError("Rate limit", "rate_limited", this.id);
      if (res.status === 402)
        throw new AIGatewayError("Créditos AI Gateway exauridos", "credits_exhausted", this.id);
      if (!res.ok) {
        const txt = await res.text();
        throw new AIGatewayError(`HTTP ${res.status}: ${txt}`, "provider_error", this.id);
      }

      const json = (await res.json()) as {
        choices: { message: { content: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const output = json.choices?.[0]?.message?.content ?? "";
      const inputTokens =
        json.usage?.prompt_tokens ?? this.countTokens(JSON.stringify(body.messages));
      const outputTokens = json.usage?.completion_tokens ?? this.countTokens(output);
      const finish = (json.choices?.[0]?.finish_reason ?? "stop") as AIResponse["finishReason"];

      return {
        provider: this.id,
        model: modelId,
        output,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          credits: computeCredits(model, inputTokens, outputTokens),
        },
        latencyMs: Date.now() - started,
        cached: false,
        finishReason: finish,
      };
    } catch (e) {
      if (e instanceof AIGatewayError) throw e;
      if ((e as Error).name === "AbortError")
        throw new AIGatewayError("Timeout", "timeout", this.id, e);
      throw new AIGatewayError((e as Error).message, "provider_error", this.id, e);
    } finally {
      clearTimeout(timeout);
    }
  }

  generateText(req: AIRequest): Promise<AIResponse<string>> {
    return this.chat(req, false);
  }

  async generateJson<T = unknown>(req: AIRequest): Promise<AIResponse<T>> {
    const raw = await this.chat(req, true);
    let parsed: T;
    try {
      parsed = JSON.parse(raw.output) as T;
    } catch (e) {
      throw new AIGatewayError("JSON inválido do modelo", "provider_error", this.id, e);
    }
    return { ...raw, output: parsed };
  }

  async *stream(req: AIRequest): AsyncIterable<AIStreamChunk> {
    // Streaming preparado — implementação SSE virá na fase de UI conversacional.
    const full = await this.chat(req, false);
    yield { delta: full.output, done: false };
    yield { delta: "", done: true };
  }

  async generateEmbedding(req: AIRequest): Promise<AIResponse<readonly number[][]>> {
    const modelId = req.task.preferModel ?? "google/gemini-embedding-001";
    const model = this.modelById(modelId);
    const started = Date.now();
    const input = Array.isArray(req.input) ? req.input : req.input ? [req.input] : [];
    if (!input.length)
      throw new AIGatewayError("input vazio para embedding", "invalid_request", this.id);

    const res = await fetch(`${GATEWAY_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": requireKey(),
        "X-Lovable-AIG-SDK": "dioris-gateway",
      },
      body: JSON.stringify({ model: modelId, input, encoding_format: "float" }),
    });
    if (!res.ok) {
      throw new AIGatewayError(
        `HTTP ${res.status}: ${await res.text()}`,
        "provider_error",
        this.id,
      );
    }
    const json = (await res.json()) as {
      data: { embedding: number[] }[];
      usage?: { prompt_tokens?: number };
    };
    const vectors = json.data.map((d) => d.embedding);
    const inputTokens = json.usage?.prompt_tokens ?? this.countTokens(input.join(" "));
    return {
      provider: this.id,
      model: modelId,
      output: vectors,
      usage: {
        inputTokens,
        outputTokens: 0,
        totalTokens: inputTokens,
        credits: computeCredits(model, inputTokens, 0),
      },
      latencyMs: Date.now() - started,
      cached: false,
      finishReason: "stop",
    };
  }
}
