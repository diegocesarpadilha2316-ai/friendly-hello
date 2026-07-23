import { useQuery } from "@tanstack/react-query";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import { billingSummaryQuery, creditLedgerQuery, plansCatalogQuery } from "./queries";
import type { BillingSummary } from "./types";

const FALLBACK: BillingSummary = {
  plan: null,
  subscription: null,
  balance: 0,
  usedThisPeriod: 0,
  resetsAt: null,
};

export function useBillingSummary() {
  const tenant = useOptionalTenant();
  const tenantId = tenant?.activeId ?? null;
  const q = useQuery(billingSummaryQuery(tenantId));
  return {
    tenantId,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error as Error | null,
    summary: q.data ?? FALLBACK,
    refetch: q.refetch,
  };
}

export function useCreditLedger() {
  const tenant = useOptionalTenant();
  const tenantId = tenant?.activeId ?? null;
  const q = useQuery(creditLedgerQuery(tenantId));
  return {
    tenantId,
    isLoading: q.isLoading,
    isError: q.isError,
    entries: q.data ?? [],
    refetch: q.refetch,
  };
}

export function usePlansCatalog() {
  const q = useQuery(plansCatalogQuery());
  return {
    isLoading: q.isLoading,
    plans: q.data ?? [],
  };
}
