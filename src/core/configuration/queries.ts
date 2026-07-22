import { queryOptions } from "@tanstack/react-query";
import {
  apiKeysList,
  backupGet,
  brandingGet,
  companySettingsGet,
  configurationSnapshot,
  flagsList,
  integrationsList,
  localizationGet,
  platformGet,
  securityGet,
} from "./configuration.functions";

export const configurationKeys = {
  all: ["core", "configuration"] as const,
  snapshot: () => [...configurationKeys.all, "snapshot"] as const,
  platform: () => [...configurationKeys.all, "platform"] as const,
  company: () => [...configurationKeys.all, "company"] as const,
  flags: () => [...configurationKeys.all, "flags"] as const,
  integrations: () => [...configurationKeys.all, "integrations"] as const,
  branding: () => [...configurationKeys.all, "branding"] as const,
  localization: () => [...configurationKeys.all, "localization"] as const,
  security: () => [...configurationKeys.all, "security"] as const,
  backup: () => [...configurationKeys.all, "backup"] as const,
  apiKeys: () => [...configurationKeys.all, "api-keys"] as const,
};

export const configurationSnapshotQuery = () =>
  queryOptions({
    queryKey: configurationKeys.snapshot(),
    queryFn: () => configurationSnapshot(),
    staleTime: 60_000,
  });

export const platformQuery = () =>
  queryOptions({ queryKey: configurationKeys.platform(), queryFn: () => platformGet(), staleTime: 300_000 });
export const companySettingsQuery = () =>
  queryOptions({ queryKey: configurationKeys.company(), queryFn: () => companySettingsGet(), staleTime: 60_000 });
export const flagsQuery = () =>
  queryOptions({ queryKey: configurationKeys.flags(), queryFn: () => flagsList(), staleTime: 30_000 });
export const integrationsQuery = () =>
  queryOptions({ queryKey: configurationKeys.integrations(), queryFn: () => integrationsList(), staleTime: 30_000 });
export const brandingQuery = () =>
  queryOptions({ queryKey: configurationKeys.branding(), queryFn: () => brandingGet(), staleTime: 120_000 });
export const localizationQuery = () =>
  queryOptions({ queryKey: configurationKeys.localization(), queryFn: () => localizationGet(), staleTime: 120_000 });
export const securityQuery = () =>
  queryOptions({ queryKey: configurationKeys.security(), queryFn: () => securityGet(), staleTime: 60_000 });
export const backupQuery = () =>
  queryOptions({ queryKey: configurationKeys.backup(), queryFn: () => backupGet(), staleTime: 60_000 });
export const apiKeysQuery = () =>
  queryOptions({ queryKey: configurationKeys.apiKeys(), queryFn: () => apiKeysList(), staleTime: 30_000 });