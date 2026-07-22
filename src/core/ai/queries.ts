import { queryOptions } from "@tanstack/react-query";
import { aiHealthAll, aiListModels, aiMetrics } from "./ai.functions";

export const aiQueryKeys = {
  all: ["core", "ai"] as const,
  health: () => [...aiQueryKeys.all, "health"] as const,
  metrics: () => [...aiQueryKeys.all, "metrics"] as const,
  models: () => [...aiQueryKeys.all, "models"] as const,
};

export const aiHealthQuery = () =>
  queryOptions({
    queryKey: aiQueryKeys.health(),
    queryFn: () => aiHealthAll(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const aiMetricsQuery = () =>
  queryOptions({
    queryKey: aiQueryKeys.metrics(),
    queryFn: () => aiMetrics(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const aiModelsQuery = () =>
  queryOptions({
    queryKey: aiQueryKeys.models(),
    queryFn: () => aiListModels(),
    staleTime: 5 * 60_000,
  });
