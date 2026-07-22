/**
 * Tipos compartilhados entre domínios do Planner.
 * Nenhum domínio depende de outro diretamente — todos consomem
 * apenas estes tipos + contratos publicados em `../contracts`.
 */
import type { CompanyId } from "@/core/types/tenant";

export type PlannerProjectId = string & { readonly __brand: "PlannerProjectId" };
export type PlannerCatalogItemId = string & { readonly __brand: "PlannerCatalogItemId" };

export interface PlannerContext {
  readonly tenantId: CompanyId;
  readonly userId: string;
}

export type PlannerDomain =
  | "ia" | "render" | "catalog" | "production" | "cnc"
  | "executive" | "budget" | "library" | "rooms"
  | "materials" | "hardware" | "marketplace" | "api";
