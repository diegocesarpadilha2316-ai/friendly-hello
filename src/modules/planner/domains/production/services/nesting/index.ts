/**
 * Fase 3.18 — Nesting Enterprise.
 * Ponto único de entrada. Consumido pelo Production Studio existente.
 * 100% aditivo — nenhuma dependência de provider ou banco novo.
 */
export * from "./types";
export * from "./boards";
export * from "./parts";
export * from "./rotation";
export * from "./grain";
export * from "./offcuts";
export * from "./packing";
export * from "./optimizer";
export * from "./layout";
export * from "./preview";
export * from "./statistics";
export * from "./labels";
export * from "./exports";
export * from "./validator";

// Hooks de consulta para IA (respostas determinísticas, sem API).
export * as nestingAi from "./ai-hooks";
