import { queryOptions } from "@tanstack/react-query";
import { getBillingSummary, listPlans } from "./billing.functions";

export const billingKeys = {
  root: ["core", "billing"] as const,
  summary: (tenantId: string | null) =>
    ["core", "billing", "summary", tenantId] as const,
  plans: ["core", "billing", "plans"] as const,
};

export function billingSummaryQuery(tenantId: string | null) {
  return queryOptions({
    queryKey: billingKeys.summary(tenantId),
    queryFn: () => getBillingSummary(),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function plansCatalogQuery() {
  return queryOptions({
    queryKey: billingKeys.plans,
    queryFn: () => listPlans(),
    staleTime: 5 * 60_000,
  });
}
