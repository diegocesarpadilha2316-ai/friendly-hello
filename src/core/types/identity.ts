/**
 * Tipos base de identidade — consumidos por todos os módulos.
 * `CompanyId` vive em `./tenant`; aqui ficam apenas identidade humana.
 */
export type UserId = string & { readonly __brand: "UserId" };

export interface CoreUser {
  id: UserId;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
