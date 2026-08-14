import * as React from "react";
import { usePermissions } from "@/core/hooks/use-permissions";
import type { Permission } from "@/core/types/rbac";

export interface CanProps {
  permission?: Permission;
  anyOf?: readonly Permission[];
  allOf?: readonly Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Gating declarativo de UI baseado em permissões do tenant ativo.
 * Uso: `<Can permission="crm:manage">…</Can>`.
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const perms = usePermissions();
  const allowed =
    (permission ? perms.can(permission) : true) &&
    (anyOf ? perms.canAny(anyOf) : true) &&
    (allOf ? perms.canAll(allOf) : true);
  return <>{allowed ? children : fallback}</>;
}
