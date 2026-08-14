import { queryOptions } from "@tanstack/react-query";
import {
  marketplaceList,
  pluginLogs,
  pluginPermissionsList,
  pluginUpdatesList,
  pluginsList,
  sdkSnapshot,
} from "./plugin-functions";

export const sdkKeys = {
  all: ["core", "sdk"] as const,
  snapshot: () => [...sdkKeys.all, "snapshot"] as const,
  plugins: () => [...sdkKeys.all, "plugins"] as const,
  logs: () => [...sdkKeys.all, "logs"] as const,
  permissions: () => [...sdkKeys.all, "permissions"] as const,
  updates: () => [...sdkKeys.all, "updates"] as const,
  marketplace: () => [...sdkKeys.all, "marketplace"] as const,
};

export const sdkSnapshotQuery = () =>
  queryOptions({ queryKey: sdkKeys.snapshot(), queryFn: () => sdkSnapshot(), staleTime: 30_000 });

export const pluginsListQuery = () =>
  queryOptions({ queryKey: sdkKeys.plugins(), queryFn: () => pluginsList(), staleTime: 30_000 });

export const pluginLogsQuery = () =>
  queryOptions({ queryKey: sdkKeys.logs(), queryFn: () => pluginLogs(), staleTime: 15_000 });

export const pluginPermissionsQuery = () =>
  queryOptions({
    queryKey: sdkKeys.permissions(),
    queryFn: () => pluginPermissionsList(),
    staleTime: 60_000,
  });

export const pluginUpdatesQuery = () =>
  queryOptions({
    queryKey: sdkKeys.updates(),
    queryFn: () => pluginUpdatesList(),
    staleTime: 30_000,
  });

export const marketplaceQuery = () =>
  queryOptions({
    queryKey: sdkKeys.marketplace(),
    queryFn: () => marketplaceList(),
    staleTime: 300_000,
  });
