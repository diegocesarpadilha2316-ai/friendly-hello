import { queryOptions } from "@tanstack/react-query";
import {
  auditList,
  errorsList,
  healthList,
  logsList,
  metricsList,
  observabilityMetrics,
  tracesList,
} from "./observability.functions";

export const observabilityKeys = {
  all: ["core", "observability"] as const,
  logs: (filter?: Record<string, unknown>) =>
    [...observabilityKeys.all, "logs", filter ?? {}] as const,
  audit: (filter?: Record<string, unknown>) =>
    [...observabilityKeys.all, "audit", filter ?? {}] as const,
  metrics: () => [...observabilityKeys.all, "metrics"] as const,
  summary: () => [...observabilityKeys.all, "summary"] as const,
  errors: () => [...observabilityKeys.all, "errors"] as const,
  traces: () => [...observabilityKeys.all, "traces"] as const,
  health: () => [...observabilityKeys.all, "health"] as const,
};

export const logsQuery = (filter?: { level?: string; module?: string; traceId?: string }) =>
  queryOptions({
    queryKey: observabilityKeys.logs(filter),
    queryFn: () => logsList({ data: filter ?? {} }),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

export const auditQuery = (filter?: { entity?: string; action?: string }) =>
  queryOptions({
    queryKey: observabilityKeys.audit(filter),
    queryFn: () => auditList({ data: filter ?? {} }),
    staleTime: 15_000,
  });

export const observabilityMetricsQuery = () =>
  queryOptions({
    queryKey: observabilityKeys.summary(),
    queryFn: () => observabilityMetrics(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const metricsQuery = () =>
  queryOptions({
    queryKey: observabilityKeys.metrics(),
    queryFn: () => metricsList(),
    staleTime: 30_000,
  });

export const errorsQuery = () =>
  queryOptions({
    queryKey: observabilityKeys.errors(),
    queryFn: () => errorsList(),
    staleTime: 20_000,
  });

export const tracesQuery = () =>
  queryOptions({
    queryKey: observabilityKeys.traces(),
    queryFn: () => tracesList(),
    staleTime: 20_000,
  });

export const healthQuery = () =>
  queryOptions({
    queryKey: observabilityKeys.health(),
    queryFn: () => healthList(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });