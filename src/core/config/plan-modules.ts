import type { AppModule } from "./app";

/**
 * Mapa oficial de módulos incluídos em cada plano do Dioris Hub.
 * Consumido pelo Workspace para exibir apenas os módulos assinados
 * pelo cliente e revelar os demais como "Disponível ao fazer upgrade".
 */
export type PlanKey = "free" | "starter" | "pro" | "business" | "enterprise";

const PLAN_MODULES: Record<PlanKey, readonly AppModule[]> = {
  free: [],
  starter: ["planner"],
  pro: ["planner", "crm", "finance", "ai"],
  business: ["planner", "sites", "systems", "crm", "finance", "marketplace", "ai"],
  enterprise: ["planner", "sites", "systems", "crm", "finance", "marketplace", "automation", "ai"],
};

const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro", "business", "enterprise"];

export function getPlanModules(plan: string | null | undefined): readonly AppModule[] {
  const key = (plan ?? "free") as PlanKey;
  return PLAN_MODULES[key] ?? PLAN_MODULES.free;
}

export function hasModuleInPlan(plan: string | null | undefined, moduleId: AppModule): boolean {
  return getPlanModules(plan).includes(moduleId);
}

/** Menor plano no qual este módulo já vem incluído. */
export function firstPlanWithModule(moduleId: AppModule): PlanKey {
  for (const key of PLAN_ORDER) {
    if (PLAN_MODULES[key].includes(moduleId)) return key;
  }
  return "enterprise";
}

export const PLAN_LABEL: Record<PlanKey, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};
