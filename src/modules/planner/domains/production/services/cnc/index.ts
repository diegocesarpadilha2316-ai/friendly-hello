/**
 * Fase 3.19 — CNC Enterprise.
 * Ponto único de entrada, 100% aditivo. Reuso integral de Engenharia,
 * Produção, Plano de Corte, Fábrica 4.0 e Configurador.
 */
export * from "./types";
export * from "./machines";
export * from "./tooling";
export * from "./operations";
export * from "./drilling";
export * from "./grooves";
export * from "./postprocessors";
export * from "./program-generator";
export * from "./verification";
export * from "./simulation";
export * from "./exports";
export * from "./reports";

export * as cncAi from "./ai-hooks";
