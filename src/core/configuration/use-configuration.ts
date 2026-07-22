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

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof companySettingsUpsert>[0]["data"]) =>
      companySettingsUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof flagUpsert>[0]["data"]) => flagUpsert({ data: input }),
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
    mutationFn: (input: Parameters<typeof integrationUpsert>[0]["data"]) =>
      integrationUpsert({ data: input }),
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
    mutationFn: (input: Parameters<typeof brandingUpsert>[0]["data"]) =>
      brandingUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertLocalization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof localizationUpsert>[0]["data"]) =>
      localizationUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertSecurity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof securityUpsert>[0]["data"]) =>
      securityUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useUpsertBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof backupUpsert>[0]["data"]) =>
      backupUpsert({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}
export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof apiKeyCreate>[0]["data"]) =>
      apiKeyCreate({ data: input }),
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