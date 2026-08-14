import type { AIConversationState, AIMessage, AIMemorySummary } from "../types";

const DEFAULT_MAX_TURNS = 20;

export function createConversation(maxTurns: number = DEFAULT_MAX_TURNS): AIConversationState {
  return { messages: [], summary: null, maxTurns };
}

export function appendMessage(state: AIConversationState, message: AIMessage): AIConversationState {
  const next = [...state.messages, message];
  return { ...state, messages: next };
}

/**
 * Retorna a janela de mensagens que será enviada ao modelo — respeita
 * `maxTurns` (uma "turn" = par user/assistant) e injeta o sumário quando
 * a janela foi truncada.
 */
export function windowedMessages(state: AIConversationState): readonly AIMessage[] {
  const cap = Math.max(1, state.maxTurns) * 2;
  if (state.messages.length <= cap) {
    return state.summary ? [summaryAsMessage(state.summary), ...state.messages] : state.messages;
  }
  const tail = state.messages.slice(-cap);
  const summary = state.summary ?? autoSummary(state.messages.slice(0, -cap));
  return [summaryAsMessage(summary), ...tail];
}

export function summarize(state: AIConversationState): AIConversationState {
  const cap = Math.max(1, state.maxTurns) * 2;
  if (state.messages.length <= cap) return state;
  const older = state.messages.slice(0, -cap);
  return { ...state, summary: autoSummary(older) };
}

function autoSummary(messages: readonly AIMessage[]): AIMemorySummary {
  const lines = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20)
    .map((m) => `- (${m.role}) ${m.content.slice(0, 140)}`);
  return {
    summary: `Resumo automático da conversa anterior:\n${lines.join("\n")}`,
    turnsSummarized: Math.floor(messages.length / 2),
    updatedAt: new Date().toISOString(),
  };
}

function summaryAsMessage(summary: AIMemorySummary): AIMessage {
  return { role: "system", content: `[memory] ${summary.summary}` };
}

export function clearConversation(state: AIConversationState): AIConversationState {
  return { ...state, messages: [], summary: null };
}
