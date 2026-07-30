/**
 * Etapa 10 — Memória Inteligente do Projeto (barrel).
 * Sem banco, sem migration: runtime + localStorage por tenant/projeto.
 */
export * from "./types";
export * from "./store";
export * from "./extract";
export * from "./summary";
export * from "./service";
export { useProjectMemory } from "./use-project-memory";