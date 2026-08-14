import type { TenantRole } from "./tenant";
import { TENANT_ROLE_LEVEL } from "./tenant";

/**
 * Catálogo canônico de permissões da plataforma.
 * Formato: `<módulo>:<ação>` — módulos futuros adicionam entradas aqui.
 * Fase 1.4 mapeia cada permissão para um papel mínimo (role-based simples).
 * Fase futura poderá promover para permissões granulares em tabela.
 */
export const PERMISSIONS = {
  // Core / plataforma
  "company:view": "member",
  "company:update": "admin",
  "company:delete": "owner",
  "members:view": "member",
  "members:invite": "admin",
  "members:update-role": "admin",
  "members:remove": "admin",
  "billing:view": "admin",
  "billing:manage": "owner",
  // Módulos (placeholders — expandir nas fases funcionais)
  "planner:view": "member",
  "planner:manage": "manager",
  "sites:view": "member",
  "sites:manage": "manager",
  "systems:view": "member",
  "systems:manage": "admin",
  "crm:view": "member",
  "crm:manage": "manager",
  "finance:view": "manager",
  "finance:manage": "admin",
  "marketplace:view": "member",
  "marketplace:manage": "manager",
  "automation:view": "manager",
  "automation:manage": "admin",
  "ai:use": "member",
  "ai:manage": "admin",
} as const satisfies Record<string, TenantRole>;

export type Permission = keyof typeof PERMISSIONS;

export function requiredRole(permission: Permission): TenantRole {
  return PERMISSIONS[permission];
}

export function roleSatisfies(role: TenantRole, minimum: TenantRole): boolean {
  return TENANT_ROLE_LEVEL[role] >= TENANT_ROLE_LEVEL[minimum];
}

export function can(role: TenantRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return roleSatisfies(role, requiredRole(permission));
}
