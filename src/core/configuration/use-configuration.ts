import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiKeysQuery,
  backupQuery,
  brandingQuery,
  companySettingsQuery,
  configurationKeys,
  configurationSnapshotQuery,
  flagsQuery,
  integrationsQuery,
  localizationQuery,
  platformQuery,
  securityQuery,
} from "./queries";
import {
  apiKeyCreate,
  apiKeyRevoke,
  backupUpsert,
  brandingUpsert,
  companySettingsUpsert,
  configurationExport,
  flagDelete,
  flagUpsert,
  integrationTest,
  integrationUpsert,
  localizationUpsert,
  securityUpsert,
} from "./configuration.functions";
import type { FeatureFlag } from "./types";

export const useConfigurationSnapshot = () => useQuery(configurationSnapshotQuery());
export const usePlatformSettings = () => useQuery(platformQuery());
export const useCompanySettings = () => useQuery(companySettingsQuery());
export const useFeatureFlags = () => useQuery(flagsQuery());
export const useIntegrations = () => useQuery(integrationsQuery());
export const useBranding = () => useQuery(brandingQuery());
export const useLocalization = () => useQuery(localizationQuery());
export const useSecuritySettings = () => useQuery(securityQuery());
export const useBackupSettings = () => useQuery(backupQuery());
export const useApiKeys = () => useQuery(apiKeysQuery());

/** Consulta central de flag — módulos consomem apenas por aqui. */
export function useFeatureFlag(key: string): boolean {
  const q = useFeatureFlags();
  const list = (q.data ?? []) as readonly FeatureFlag[];
  return list.find((f) => f.key === key)?.enabled ?? false;
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: configurationKeys.all });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInput = any;

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => companySettingsUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => flagUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useDeleteFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flagDelete({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => integrationUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationTest({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => brandingUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertLocalization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => localizationUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertSecurity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => securityUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => backupUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => apiKeyCreate({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeyRevoke({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useConfigurationExport() {
  return useMutation({
    mutationFn: (input: { format?: "json" | "csv" }) =>
      configurationExport({ data: { format: input.format ?? "json" } }),
  });
}