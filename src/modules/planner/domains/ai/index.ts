/**
 * Planner / domínio: ai — Fase 3.28.
 *
 * Camada de IA multi-provider (DeepSeek-first) 100% ADITIVA. Não cria
 * providers/stores/managers/contexts novos: consome exclusivamente o
 * PlannerEditorProvider via `updateProject()`, preservando Undo/Redo/
 * Autosave/Histórico/Versionamento.
 *
 * Providers suportados (mesma interface AIProvider):
 *   - DeepSeek  (ATIVO)
 *   - OpenAI    (stub)
 *   - Gemini    (stub)
 *   - Claude    (stub)
 *   - Mistral   (stub)
 *   - OSS       (stub)
 *
 * Camadas:
 *   - types/       tipos comuns
 *   - providers/   interface AIProvider + implementações
 *   - services/    chat, streaming, tools, memória, prompt builder,
 *                  contextos por domínio, visão, embeddings, logs, agent
 *   - hooks/       useAi (composicional, session-only)
 *   - components/  AIStudio (12 abas)
 */
export * from "./types";
export * from "./providers";
export * from "./services";
export * from "./hooks";
export { AIStudio } from "./components";
