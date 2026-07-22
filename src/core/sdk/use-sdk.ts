import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  marketplaceQuery,
  pluginLogsQuery,
  pluginPermissionsQuery,
  pluginUpdatesQuery,
  pluginsListQuery,
  sdkKeys,
  sdkSnapshotQuery,
} from "./queries";
import {
  marketplaceInstall,
  pluginDisable,
  pluginEnable,
  pluginInstall,
  pluginUninstall,
  sdkExport,
} from "./plugin-functions";

export const useSdkSnapshot = () => useQuery(sdkSnapshotQuery());
export const usePlugins = () => useQuery(pluginsListQuery());
export const usePluginLogs = () => useQuery(pluginLogsQuery());
export const usePluginPermissions = () => useQuery(pluginPermissionsQuery());
export const usePluginUpdates = () => useQuery(pluginUpdatesQuery());
export const useMarketplace = () => useQuery(marketplaceQuery());

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: sdkKeys.all });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInput = any;

export function useInstallPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnyInput) => pluginInstall({ data: input }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useEnablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pluginEnable({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDisablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pluginDisable({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUninstallPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pluginUninstall({ data: { id } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarketplaceInstall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (marketplaceId: string) => marketplaceInstall({ data: { marketplaceId } }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSdkExport() {
  return useMutation({
    mutationFn: (input: { format?: "json" | "csv" }) =>
      sdkExport({ data: { format: input.format ?? "json" } }),
  });
}