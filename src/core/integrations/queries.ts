import { queryOptions } from "@tanstack/react-query";
import {
  integrationsEventsList,
  integrationsHealthList,
  integrationsList,
  integrationsLogsList,
  integrationsProviders,
  integrationsSnapshot,
  integrationsSyncsList,
  integrationsWebhooksList,
} from "./integrations.functions";

export const integrationsKeys = {
  all: ["core", "integrations"] as const,
  snapshot: () => [...integrationsKeys.all, "snapshot"] as const,
  providers: () => [...integrationsKeys.all, "providers"] as const,
  list: () => [...integrationsKeys.all, "list"] as const,
  health: () => [...integrationsKeys.all, "health"] as const,
  webhooks: () => [...integrationsKeys.all, "webhooks"] as const,
  logs: () => [...integrationsKeys.all, "logs"] as const,
  syncs: () => [...integrationsKeys.all, "syncs"] as const,
  events: () => [...integrationsKeys.all, "events"] as const,
};

export const integrationsSnapshotQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.snapshot(),
    queryFn: () => integrationsSnapshot(),
    staleTime: 30_000,
  });

export const integrationsProvidersQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.providers(),
    queryFn: () => integrationsProviders(),
    staleTime: 300_000,
  });

export const integrationsListQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.list(),
    queryFn: () => integrationsList(),
    staleTime: 30_000,
  });

export const integrationsHealthQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.health(),
    queryFn: () => integrationsHealthList(),
    staleTime: 15_000,
  });

export const integrationsWebhooksQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.webhooks(),
    queryFn: () => integrationsWebhooksList(),
    staleTime: 30_000,
  });

export const integrationsLogsQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.logs(),
    queryFn: () => integrationsLogsList(),
    staleTime: 15_000,
  });

export const integrationsSyncsQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.syncs(),
    queryFn: () => integrationsSyncsList(),
    staleTime: 15_000,
  });

export const integrationsEventsQuery = () =>
  queryOptions({
    queryKey: integrationsKeys.events(),
    queryFn: () => integrationsEventsList(),
    staleTime: 15_000,
  });