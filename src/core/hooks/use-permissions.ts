import { useMemo } from "react";
import { useOptionalTenant } from "@/core/providers/TenantProvider";
import { can, type Permission } from "@/core/types/rbac";
import type { TenantRole } from "@/core/types/tenant";

export interface PermissionsAPI {
  role: TenantRole | null;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  canAll: (permissions: readonly Permission[]) => boolean;
}

/**
 * Hook central de RBAC — deriva do tenant ativo.
 * Não faz fetch nem cache paralelo; puro sobre o TenantProvider.
 */
export function usePermissions(): PermissionsAPI {
  const tenant = useOptionalTenant();
  const role = tenant?.role ?? null;
  return useMemo(
    () => ({
      role,
      can: (p) => can(role, p),
      canAny: (ps) => ps.some((p) => can(role, p)),
      canAll: (ps) => ps.every((p) => can(role, p)),
    }),
    [role],
  );
}
