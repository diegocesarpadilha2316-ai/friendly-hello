/**
 * Fase 3.17 — Hooks IA (sem integrar nenhuma API).
 */
import type { RealtimeAiHook, RealtimeAiProviderId } from "./types";

export const REALTIME_AI_HOOKS: Record<RealtimeAiProviderId, RealtimeAiHook> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    capability: "chat",
    ready: false,
    notes: "Reservado — integração futura.",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    capability: "chat",
    ready: false,
    notes: "Reservado — integração futura.",
  },
  claude: {
    id: "claude",
    label: "Anthropic Claude",
    capability: "chat",
    ready: false,
    notes: "Reservado — integração futura.",
  },
  runway: {
    id: "runway",
    label: "Runway",
    capability: "video",
    ready: false,
    notes: "Reservado — integração futura.",
  },
  kling: {
    id: "kling",
    label: "Kling",
    capability: "video",
    ready: false,
    notes: "Reservado — integração futura.",
  },
  luma: {
    id: "luma",
    label: "Luma",
    capability: "video",
    ready: false,
    notes: "Reservado — integração futura.",
  },
};

export const REALTIME_AI_HOOK_LIST: readonly RealtimeAiHook[] = Object.values(REALTIME_AI_HOOKS);
