import { queryOptions } from "@tanstack/react-query";
import { eventsList, eventsMetrics, eventDeliveriesList } from "./events.functions";

export const eventsQueryKeys = {
  all: ["core", "events"] as const,
  list: () => [...eventsQueryKeys.all, "list"] as const,
  metrics: () => [...eventsQueryKeys.all, "metrics"] as const,
  deliveries: () => [...eventsQueryKeys.all, "deliveries"] as const,
};

export const eventsListQuery = () =>
  queryOptions({
    queryKey: eventsQueryKeys.list(),
    queryFn: () => eventsList({ data: { limit: 100 } }),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

export const eventsMetricsQuery = () =>
  queryOptions({
    queryKey: eventsQueryKeys.metrics(),
    queryFn: () => eventsMetrics(),
    staleTime: 15_000,
  });

export const eventDeliveriesQuery = () =>
  queryOptions({
    queryKey: eventsQueryKeys.deliveries(),
    queryFn: () => eventDeliveriesList(),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
