import { queryOptions } from "@tanstack/react-query";
import {
  assetsList,
  assetsListAudit,
  assetsListJobs,
  assetsStats,
} from "./assets.functions";

export const assetsQueryKeys = {
  all: ["core", "assets"] as const,
  list: (folderId?: string | null) => [...assetsQueryKeys.all, "list", folderId ?? null] as const,
  stats: () => [...assetsQueryKeys.all, "stats"] as const,
  jobs: () => [...assetsQueryKeys.all, "jobs"] as const,
  audit: () => [...assetsQueryKeys.all, "audit"] as const,
};

export const assetsListQuery = (folderId?: string | null) =>
  queryOptions({
    queryKey: assetsQueryKeys.list(folderId),
    queryFn: () => assetsList({ data: { folderId: folderId ?? undefined, limit: 100 } }),
    staleTime: 15_000,
  });

export const assetsStatsQuery = () =>
  queryOptions({
    queryKey: assetsQueryKeys.stats(),
    queryFn: () => assetsStats(),
    staleTime: 30_000,
  });

export const assetsJobsQuery = () =>
  queryOptions({
    queryKey: assetsQueryKeys.jobs(),
    queryFn: () => assetsListJobs(),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

export const assetsAuditQuery = () =>
  queryOptions({
    queryKey: assetsQueryKeys.audit(),
    queryFn: () => assetsListAudit(),
    staleTime: 30_000,
  });
