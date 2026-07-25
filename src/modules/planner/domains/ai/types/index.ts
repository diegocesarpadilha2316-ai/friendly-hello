/**
 * Planner / domínio: ai — Fase 3.28.
 *
 * Tipos comuns da camada de IA multi-provider (DeepSeek-first).
 * Todos os providers implementam a mesma interface — trocar provider
 * não exige refatoração dos serviços/hooks/UI.
 */

export type AIProviderId =
  | "deepseek"
  | "openai"
  | "gemini"
  | "claude"
  | "mistral"
  | "oss";

export type AIRole = "system" | "developer" | "user" | "assistant" | "tool";

export interface AIMessage {
  readonly id?: string;
  readonly role: AIRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly AIToolCall[];
  readonly createdAt?: string;
}

export interface AIToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface AIToolResult {
  readonly toolCallId: string;
  readonly name: string;
  readonly ok: boolean;
  readonly data?: unknown;
  readonly error?: string;
}

export interface AIToolSchema {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
}

export interface AIChatOptions {
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly tools?: readonly AIToolSchema[];
  readonly signal?: AbortSignal;
  readonly stream?: boolean;
  readonly timeoutMs?: number;
}

export interface AIChatChunk {
  readonly delta?: string;
  readonly toolCalls?: readonly AIToolCall[];
  readonly finishReason?: "stop" | "length" | "tool_calls" | "error" | null;
}

export interface AIChatResponse {
  readonly content: string;
  readonly toolCalls: readonly AIToolCall[];
  readonly finishReason: "stop" | "length" | "tool_calls" | "error" | null;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
    readonly totalTokens?: number;
  };
}

export interface AIProviderConfig {
  readonly id: AIProviderId;
  readonly label: string;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly defaultModel: string;
  readonly supportsStreaming: boolean;
  readonly supportsTools: boolean;
  readonly supportsVision: boolean;
}

export interface AIProvider {
  readonly config: AIProviderConfig;
  chat(messages: readonly AIMessage[], options?: AIChatOptions): Promise<AIChatResponse>;
  stream(
    messages: readonly AIMessage[],
    onChunk: (chunk: AIChatChunk) => void,
    options?: AIChatOptions,
  ): Promise<AIChatResponse>;
  embed?(input: readonly string[]): Promise<readonly (readonly number[])[]>;
}

export interface AIMemorySummary {
  readonly summary: string;
  readonly turnsSummarized: number;
  readonly updatedAt: string;
}

export interface AIConversationState {
  readonly messages: readonly AIMessage[];
  readonly summary: AIMemorySummary | null;
  readonly maxTurns: number;
}

export type AIVisionMediaKind =
  | "image"
  | "photo"
  | "pdf"
  | "dwg"
  | "dxf"
  | "ifc"
  | "obj"
  | "fbx"
  | "glb"
  | "gltf";

export interface AIVisionAttachment {
  readonly kind: AIVisionMediaKind;
  readonly mimeType: string;
  readonly url?: string;
  readonly dataBase64?: string;
  readonly name?: string;
}

export interface AIPromptContext {
  readonly system?: string;
  readonly developer?: string;
  readonly project?: string;
  readonly room?: string;
  readonly selection?: string;
  readonly conversation?: string;
  readonly library?: string;
  readonly catalog?: string;
  readonly budget?: string;
  readonly production?: string;
  readonly render?: string;
  readonly video?: string;
  readonly engineering?: string;
  readonly importer?: string;
  readonly realtime?: string;
  readonly factory?: string;
  readonly marketplace?: string;
  readonly decorator?: string;
}

export interface AILogEntry {
  readonly id: string;
  readonly at: string;
  readonly provider: AIProviderId;
  readonly model: string;
  readonly kind: "chat" | "stream" | "tool" | "embed" | "error";
  readonly message: string;
  readonly durationMs?: number;
  readonly tokens?: number;
}