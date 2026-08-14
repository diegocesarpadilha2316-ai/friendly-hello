import type { AIProviderConfig } from "../types";
import { BaseAIProvider } from "./base";

/**
 * Stubs para providers ainda não integrados. Preservam a interface —
 * substituir por implementação real não exige refatoração.
 */

interface StubOptions {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly defaultModel?: string;
}

export class OpenAIProvider extends BaseAIProvider {
  constructor(opts: StubOptions = {}) {
    const config: AIProviderConfig = {
      id: "openai",
      label: "OpenAI (stub)",
      baseUrl: opts.baseUrl ?? "https://api.openai.com",
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? "gpt-4o-mini",
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    };
    super(config);
  }
}

export class GeminiProvider extends BaseAIProvider {
  constructor(opts: StubOptions = {}) {
    super({
      id: "gemini",
      label: "Google Gemini (stub)",
      baseUrl: opts.baseUrl ?? "https://generativelanguage.googleapis.com",
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? "gemini-2.5-flash",
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    });
  }
}

export class ClaudeProvider extends BaseAIProvider {
  constructor(opts: StubOptions = {}) {
    super({
      id: "claude",
      label: "Anthropic Claude (stub)",
      baseUrl: opts.baseUrl ?? "https://api.anthropic.com",
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? "claude-3-5-sonnet-latest",
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    });
  }
}

export class MistralProvider extends BaseAIProvider {
  constructor(opts: StubOptions = {}) {
    super({
      id: "mistral",
      label: "Mistral (stub)",
      baseUrl: opts.baseUrl ?? "https://api.mistral.ai",
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? "mistral-large-latest",
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    });
  }
}

export class OSSProvider extends BaseAIProvider {
  constructor(opts: StubOptions = {}) {
    super({
      id: "oss",
      label: "Open Source (stub)",
      baseUrl: opts.baseUrl ?? "http://localhost:11434",
      apiKey: opts.apiKey,
      defaultModel: opts.defaultModel ?? "llama3.1",
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false,
    });
  }
}
