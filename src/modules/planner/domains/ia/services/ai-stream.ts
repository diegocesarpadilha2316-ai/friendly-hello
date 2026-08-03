/**
 * Cliente de streaming canônico do Copiloto IA.
 *
 * Toda chamada de IA do Planner no browser passa por `/api/ai/chat`, que é
 * autenticado, valida tenant e debita créditos. Nenhuma chave de provedor
 * externo é usada no cliente.
 */
import { AI_PROXY_ENDPOINT, buildAiProxyHeaders } from "@/modules/planner/domains/ai/proxy";

export interface StreamMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
}

export interface StreamOptions {
  readonly messages: readonly StreamMessage[];
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly clientMessageId?: string;
  readonly signal?: AbortSignal;
}

export interface StreamChunk {
  readonly delta: string;
  readonly done: boolean;
}

export class AIStreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AIStreamError";
  }
}

function safeParseSSE(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return { done: true };
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractDelta(data: Record<string, unknown>): string {
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
  if (typeof delta?.content === "string") return delta.content;
  return "";
}

/**
 * Faz streaming SSE de uma conversa pelo proxy `/api/ai/chat`.
 * Gera deltas de texto (`string`) à medida que chegam do provedor.
 */
export async function* streamLovableReply(options: StreamOptions): AsyncGenerator<string> {
  const body: Record<string, unknown> = {
    model: options.model ?? "deepseek-chat",
    messages: options.messages,
    stream: true,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens != null) body.max_tokens = options.maxTokens;
  if (options.clientMessageId) body.client_message_id = options.clientMessageId;

  let res: Response;
  try {
    res = await fetch(AI_PROXY_ENDPOINT, {
      method: "POST",
      headers: await buildAiProxyHeaders(),
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (e) {
    throw new AIStreamError(e instanceof Error ? e.message : "Falha ao conectar com a IA");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIStreamError(`HTTP ${res.status}: ${text}`, res.status);
  }

  if (!res.body) {
    throw new AIStreamError("Resposta vazia do servidor");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = safeParseSSE(line);
        if (!data) continue;
        if (data.done === true) return;
        const delta = extractDelta(data);
        if (delta) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Chamada não-streaming para o proxy. Útil para tool-planning JSON e
 * respostas curtas onde o streaming não é necessário.
 */
export async function chatLovableReply(options: StreamOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: options.model ?? "deepseek-chat",
    messages: options.messages,
    stream: false,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens != null) body.max_tokens = options.maxTokens;
  if (options.clientMessageId) body.client_message_id = options.clientMessageId;

  const res = await fetch(AI_PROXY_ENDPOINT, {
    method: "POST",
    headers: await buildAiProxyHeaders(),
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIStreamError(`HTTP ${res.status}: ${text}`, res.status);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}
