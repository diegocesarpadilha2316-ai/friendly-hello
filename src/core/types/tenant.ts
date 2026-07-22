/**
 * Tipos canônicos de tenant (empresa) — consumidos por todos os módulos.
 */
export type CompanyId = string & { readonly __brand: "CompanyId" };

export type TenantRole = "owner" | "admin" | "manager" | "member";
export type TenantPlan = "free" | "starter" | "pro" | "business" | "enterprise";
export type TenantStatus = "active" | "suspended" | "canceled";

export const TENANT_ROLES: readonly TenantRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
] as const;

export const TENANT_ROLE_LEVEL: Record<TenantRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

export interface Company {
  id: CompanyId;
  name: string;
  slug: string;
  cnpj: string | null;
  logo_url: string | null;
  plan: TenantPlan;
  status: TenantStatus;
  custom_domain: string | null;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: CompanyId;
  user_id: string;
  role: TenantRole;
  active: boolean;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvitation {
  id: string;
  company_id: CompanyId;
  email: string;
  role: TenantRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

/** Empresa + role do usuário atual (retorno de listMyCompanies). */
export interface CompanyWithRole extends Company {
  role: TenantRole;
}