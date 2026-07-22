import { queryOptions } from "@tanstack/react-query";
import { getDashboardSnapshot } from "./dashboard.functions";

export const dashboardKeys = {
  root: ["core", "dashboard"] as const,
  snapshot: (tenantId: string | null) =>
    ["core", "dashboard", "snapshot", tenantId] as const,
};

export function dashboardSnapshotQuery(tenantId: string | null) {
  return queryOptions({
    queryKey: dashboardKeys.snapshot(tenantId),
    queryFn: () => getDashboardSnapshot(),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}
