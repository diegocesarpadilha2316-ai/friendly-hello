import { useQuery } from "@tanstack/react-query";
import {
  assetsAuditQuery,
  assetsJobsQuery,
  assetsListQuery,
  assetsStatsQuery,
} from "./queries";

export function useAssetsList(folderId?: string | null) {
  return useQuery(assetsListQuery(folderId));
}
export function useAssetsStats() {
  return useQuery(assetsStatsQuery());
}
export function useAssetsJobs() {
  return useQuery(assetsJobsQuery());
}
export function useAssetsAudit() {
  return useQuery(assetsAuditQuery());
}
