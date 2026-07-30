/**
 * Planner / domínio: ia — Fase 3.6.
 *
 * IA conversacional do Planner. Consome exclusivamente o Core
 * (`@/core/*`) e o `PlannerEditorProvider` de `@/modules/planner/shared`.
 * Nenhum provider/store/manager novo — todas as mutações fluem pelo
 * canal único do editor (Undo/Redo/Autosave/Histórico).
 *
 * Camadas:
 *  - types/       Mensagem, tool-call, quick actions
 *  - services/    interpreter (pt-BR), tools puras, agent orquestrador
 *  - hooks/       `usePlannerChat`
 *  - components/  `PlannerAIPanel`, `PlannerAIFab`
 *
 * Interface pronta para receber GPT/Gemini/Claude/Open Source: basta
 * substituir `interpret()` por uma chamada estruturada equivalente.
 */
export * from "./types";
export * from "./services";
export * from "./agents";
export * from "./hooks";
export * from "./components";
