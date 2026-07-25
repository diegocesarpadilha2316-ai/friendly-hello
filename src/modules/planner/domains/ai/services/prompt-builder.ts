import type { AIMessage, AIPromptContext } from "../types";

const DEFAULT_SYSTEM = [
  "Você é o assistente de IA do Dioris Planner.",
  "Fale sempre em português do Brasil, claro e objetivo.",
  "Use as ferramentas disponíveis para modificar o projeto sempre que possível,",
  "em vez de descrever passos manualmente. Toda mutação passa pelo canal único",
  "do editor (Undo/Redo/Autosave/Histórico já são gerenciados).",
].join(" ");

const DEFAULT_DEVELOPER = [
  "Regras internas:",
  "- Não invente medidas: use as fornecidas ou peça confirmação.",
  "- Materiais/ferragens devem vir da Biblioteca Oficial Dioris.",
  "- Retorne respostas curtas quando executar tools.",
].join(" ");

export function buildPromptContext(ctx: AIPromptContext = {}): AIPromptContext {
  return {
    system: ctx.system ?? DEFAULT_SYSTEM,
    developer: ctx.developer ?? DEFAULT_DEVELOPER,
    ...ctx,
  };
}

export function composeSystemMessage(ctx: AIPromptContext): AIMessage {
  const parts: string[] = [];
  if (ctx.system) parts.push(ctx.system);
  if (ctx.developer) parts.push(`[developer] ${ctx.developer}`);
  const contextKeys: Array<keyof AIPromptContext> = [
    "project",
    "room",
    "selection",
    "library",
    "catalog",
    "budget",
    "production",
    "render",
    "video",
    "engineering",
    "importer",
    "realtime",
    "factory",
    "marketplace",
    "decorator",
    "conversation",
  ];
  for (const key of contextKeys) {
    const value = ctx[key];
    if (value) parts.push(`[${String(key)}] ${value}`);
  }
  return { role: "system", content: parts.join("\n\n") };
}

export function composeMessages(
  ctx: AIPromptContext,
  history: readonly AIMessage[],
  user: string,
): AIMessage[] {
  const sys = composeSystemMessage(ctx);
  const userMsg: AIMessage = { role: "user", content: user, createdAt: new Date().toISOString() };
  return [sys, ...history, userMsg];
}