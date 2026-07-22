import { createServerFn } from "@tanstack/react-start";
import { requireTenant } from "@/core/middleware/require-tenant";
import type { DashboardSnapshot, PlanSummary, CreditsSummary } from "./types";
import { emptySnapshot } from "./snapshot";
import { composeBillingSummary } from "@/core/billing/billing.functions";

export const getDashboardSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<DashboardSnapshot> => {
    const base = emptySnapshot({ tenantId: context.tenantId });
    let credits: CreditsSummary = base.credits;
    let plan: PlanSummary = base.plan;
    try {
      const billing = await composeBillingSummary(context.supabase, context.tenantId);
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
      /* tolerante: dashboard nunca cai por falta de billing */
    }
    return { ...base, credits, plan, meta: { ...base.meta, warming: false } };
  });
