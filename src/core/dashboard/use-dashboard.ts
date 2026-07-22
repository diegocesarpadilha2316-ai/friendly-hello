import { useQuery } from "@tanstack/react-query";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import { dashboardSnapshotQuery } from "./queries";
import { emptySnapshot } from "./snapshot";

/**
 * Hook único para leitura do snapshot do Dashboard.
 * - Escopo automático pelo tenant ativo (via TenantProvider).
 * - Nunca lança — devolve estado + snapshot vazio como fallback.
 * - Serve para qualquer widget sem duplicar `useQuery`.
 */
export function useDashboardSnapshot() {
  const tenant = useOptionalTenant();
  const tenantId = tenant?.activeId ?? null;
  const query = useQuery(dashboardSnapshotQuery(tenantId));
  return {
    tenantId,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    snapshot: query.data ?? emptySnapshot({ tenantId: tenantId ?? "" }),
    refetch: query.refetch,
  };
}
