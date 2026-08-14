import { createMiddleware } from "@tanstack/react-start";
import { requireTenant } from "./require-tenant";
import { requiredRole, roleSatisfies, type Permission } from "@/core/types/rbac";

/**
 * Fábrica de middleware: exige tenant + permissão específica.
 * Uso:
 *   const fn = createServerFn().middleware([requirePermission("crm:manage")]).handler(...)
 */
export function requirePermission(permission: Permission) {
  return createMiddleware({ type: "function" })
    .middleware([requireTenant])
    .server(async ({ next, context }) => {
      if (!roleSatisfies(context.role, requiredRole(permission))) {
        throw new Response(`Forbidden: missing permission ${permission}`, { status: 403 });
      }
      return next();
    });
}
