import type { AiProviderStub } from "../types";

/**
 * Preparação para integração multi-provider — nenhuma chamada real de rede.
 * Serve apenas como registry declarativo consumido pela UI do Configurador.
 */
export const AI_PROVIDER_STUBS: readonly AiProviderStub[] = [
  { id: "openai", label: "OpenAI", status: "coming-soon", models: ["gpt-5.6-sol", "gpt-5.5", "gpt-5.4-mini"], capabilities: ["chat", "vision", "tools", "structured"] },
  { id: "gemini", label: "Google Gemini", status: "coming-soon", models: ["gemini-3.6-flash", "gemini-3.1-pro-preview"], capabilities: ["chat", "vision", "tools", "structured"] },
  { id: "claude", label: "Anthropic Claude", status: "coming-soon", models: ["claude-opus", "claude-sonnet"], capabilities: ["chat", "tools", "structured"] },
  { id: "mistral", label: "Mistral", status: "coming-soon", models: ["mistral-large", "codestral"], capabilities: ["chat", "tools"] },
  { id: "oss", label: "Open Source (Llama/Qwen)", status: "coming-soon", models: ["llama-3.3", "qwen-2.5-coder"], capabilities: ["chat", "tools"] },
];