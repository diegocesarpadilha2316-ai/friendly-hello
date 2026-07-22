import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  auditQuery,
  errorsQuery,
  healthQuery,
  logsQuery,
  metricsQuery,
  observabilityKeys,
  observabilityMetricsQuery,
  tracesQuery,
} from "./queries";
import { errorResolve, observabilityExport } from "./observability.functions";

export const useLogs = (filter?: { level?: string; module?: string; traceId?: string }) =>
  useQuery(logsQuery(filter));
export const useAudit = (filter?: { entity?: string; action?: string }) =>
  useQuery(auditQuery(filter));
export const useObservabilityMetrics = () => useQuery(observabilityMetricsQuery());
export const useMetrics = () => useQuery(metricsQuery());
export const useErrorReports = () => useQuery(errorsQuery());
export const useTraces = () => useQuery(tracesQuery());
export const useHealth = () => useQuery(healthQuery());

export function useResolveError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => errorResolve({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: observabilityKeys.errors() }),
  });
}

export function useObservabilityExport() {
  return useMutation({
    mutationFn: (input: {
      dataset: "logs" | "audit" | "errors" | "traces" | "metrics";
      format?: "json" | "csv";
      limit?: number;
    }) => observabilityExport({ data: input }),
  });
}