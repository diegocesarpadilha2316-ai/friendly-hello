/**
 * Tipos base de identidade — consumidos por todos os módulos.
 * Implementações concretas virão nas próximas fases.
 */
export type UserId = string & { readonly __brand: "UserId" };
export type CompanyId = string & { readonly __brand: "CompanyId" };

export interface CoreUser {
  id: UserId;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CoreCompany {
  id: CompanyId;
  name: string;
  slug: string;
  createdAt: string;
}

export type Permission = string;
export interface RoleGrant {
  userId: UserId;
  companyId: CompanyId;
  permissions: readonly Permission[];
}
