/**
 * AI Gateway — API pública consumida por toda a plataforma.
 * Nenhum módulo deve importar providers diretamente — apenas este barrel.
 */
export * from "./types";
export { AI_GATEWAY_CONFIG } from "./config";
export { AI_MODEL_CATALOG } from "./catalog";
export {
  aiGenerateText,
  aiGenerateJson,
  aiGenerateEmbedding,
  aiHealthAll,
  aiMetrics,
  aiListModels,
} from "./ai.functions";
export * from "./queries";
export * from "./use-ai";
