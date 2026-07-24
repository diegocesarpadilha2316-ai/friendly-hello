/**
 * core/hooks — hooks compartilhados de todos os módulos.
 */
export { useAuth, useOptionalAuth } from "@/core/providers/AuthProvider";
export { useTenant, useOptionalTenant } from "@/core/providers/TenantProvider";
export { usePermissions } from "./use-permissions";
export { useIsPlatformAdmin } from "./use-platform-admin";
