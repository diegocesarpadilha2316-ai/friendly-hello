/**
 * Server function do Dashboard.
 * Compõe subsnapshots de vários domínios do Core sem duplicar lógica.
 * Billing vem de core/billing; demais permanecem em fallback vazio até que
 * os módulos correspondentes publiquem seus services (Planner, Render, etc.).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireTenant } from "@/core/middleware/require-tenant";
import type { DashboardSnapshot, PlanSummary, CreditsSummary } from "./types";
import { emptySnapshot } from "./snapshot";
import { getBillingSummary } from "@/core/billing/billing.functions";

export const getDashboardSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<DashboardSnapshot> => {
    const base = emptySnapshot({ tenantId: context.tenantId });
    // Billing (Fase 1.6) — compõe créditos + plano
    let credits: CreditsSummary = base.credits;
    let plan: PlanSummary = base.plan;
    try {
      const billing = await getBillingSummary();
      credits = {
        available: billing.balance,
        used: billing.usedThisPeriod,
        resetsAt: billing.resetsAt,
      };
      if (billing.plan) {
        plan = {
          key: billing.plan.key,
          label: billing.plan.label,
          status: billing.subscription?.status ?? "active",
          renewsAt: billing.subscription?.currentPeriodEnd ?? null,
        };
      }
    } catch {
      // Tolerante: dashboard nunca cai por falta de billing.
    }
    return {
      ...base,
      credits,
      plan,
      meta: { ...base.meta, warming: false },
    };
  });
