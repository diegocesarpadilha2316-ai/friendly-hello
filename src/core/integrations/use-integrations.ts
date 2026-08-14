import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  integrationsEventsQuery,
  integrationsHealthQuery,
  integrationsKeys,
  integrationsListQuery,
  integrationsLogsQuery,
  integrationsProvidersQuery,
  integrationsSnapshotQuery,
  integrationsSyncsQuery,
  integrationsWebhooksQuery,
} from "./queries";
import {
  integrationDelete,
  integrationTest,
  integrationUpsert,
  integrationsExport,
  webhookDelete,
  webhookRegister,
} from "./integrations.functions";

export const useIntegrationsSnapshot = () => useQuery(integrationsSnapshotQuery());
export const useIntegrationProviders = () => useQuery(integrationsProvidersQuery());
export const useIntegrations = () => useQuery(integrationsListQuery());
export const useIntegrationsHealth = () => useQuery(integrationsHealthQuery());
export const useIntegrationWebhooks = () => useQuery(integrationsWebhooksQuery());
export const useIntegrationLogs = () => useQuery(integrationsLogsQuery());
export const useIntegrationSyncs = () => useQuery(integrationsSyncsQuery());
export const useIntegrationEvents = () => useQuery(integrationsEventsQuery());

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: integrationsKeys.all });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInput = any;

export function useUpsertIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => integrationUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationDelete({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useTestIntegrationConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationTest({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRegisterWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => webhookRegister({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webhookDelete({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useIntegrationsExport() {
  return useMutation({
    mutationFn: (input: { format?: "json" | "csv" }) =>
      integrationsExport({ data: { format: input.format ?? "json" } }),
  });
}
