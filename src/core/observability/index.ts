/**
 * Observability — API pública única.
 * Todos os módulos escrevem via Logger/Audit e leem via hooks daqui.
 */
export * from "./types";
export * from "./queries";
export * from "./use-observability";
export {
  logsList,
  logsAppend,
  auditList,
  metricsList,
  observabilityMetrics,
  errorsList,
  errorResolve,
  tracesList,
  healthList,
  observabilityExport,
} from "./observability.functions";