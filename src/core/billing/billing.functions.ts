/**
 * Server functions de billing/créditos + helper interno reutilizável.
 *
 * IMPORTANTE: `composeBillingSummary(supabase, tenantId)` é a fonte única
 * da lógica — todas as server functions e outros server-side callers usam
 * este helper, evitando encadeamento de RPCs entre server functions.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  BillingSummary,
  PlanDefinition,
  TenantSubscription,
} from "./types";

const isMissingTable = (message: string | undefined) =>
  !!message && (message.includes("does not exist") || message.includes("schema cache"));

async function loadPlan(supabase: SupabaseClient, key: string): Promise<PlanDefinition | null> {
  const { data, error } = await supabase
    .from("plans")
    .select("key, label, monthly_credits, price_cents, currency, features, sort_order")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error.message)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  const rawFeatures = (data.features ?? []) as unknown;
  const features = Array.isArray(rawFeatures)
    ? rawFeatures.filter((v): v is string => typeof v === "string")
    : [];
  return {
    key: data.key,
    label: data.label,
    monthlyCredits: data.monthly_credits ?? 0,
    priceCents: data.price_cents ?? 0,
    currency: data.currency ?? "BRL",
    features,
    sortOrder: data.sort_order ?? 100,
  };
}

async function loadSubscription(
  supabase: SupabaseClient,
  companyId: string,
): Promise<TenantSubscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, company_id, plan_key, status, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, external_provider",
    )
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error.message)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    id: data.id,
    companyId: data.company_id,
    planKey: data.plan_key,
    status: data.status,
    trialEndsAt: data.trial_ends_at,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: !!data.cancel_at_period_end,
    externalProvider: data.external_provider ?? null,
  };
}

async function loadBalance(
  supabase: SupabaseClient,
  companyId: string,
): Promise<{ balance: number; used: number }> {
  const { data, error } = await supabase.rpc("credit_balance", { _company_id: companyId });
  if (error && !isMissingTable(error.message)) throw new Error(error.message);
  const balance = typeof data === "number" ? data : 0;

  const { data: usedRows, error: usedErr } = await supabase
    .from("credit_ledger")
    .select("amount")
    .eq("company_id", companyId)
    .eq("kind", "consume");
  if (usedErr && !isMissingTable(usedErr.message)) throw new Error(usedErr.message);
  const used = (usedRows ?? []).reduce(
    (acc: number, r: { amount: number }) => acc + Math.abs(r.amount),
    0,
  );
  return { balance, used };
}

/** Fonte única: consumida por server functions e helpers server-side. */
export async function composeBillingSummary(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<BillingSummary> {
  const subscription = await loadSubscription(supabase, tenantId);
  const planKey = subscription?.planKey ?? "free";
  const plan = await loadPlan(supabase, planKey);
  const { balance, used } = await loadBalance(supabase, tenantId);
  return {
    plan,
    subscription,
    balance,
    usedThisPeriod: used,
    resetsAt: subscription?.currentPeriodEnd ?? null,
  };
}

export const getBillingSummary = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(({ context }) => composeBillingSummary(context.supabase, context.tenantId));

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<ReadonlyArray<PlanDefinition>> => {
    const { data, error } = await context.supabase
      .from("plans")
      .select("key, label, monthly_credits, price_cents, currency, features, sort_order")
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingTable(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => {
      const rawFeatures = (row.features ?? []) as unknown;
      const features = Array.isArray(rawFeatures)
        ? rawFeatures.filter((v): v is string => typeof v === "string")
        : [];
      return {
        key: row.key,
        label: row.label,
        monthlyCredits: row.monthly_credits ?? 0,
        priceCents: row.price_cents ?? 0,
        currency: row.currency ?? "BRL",
        features,
        sortOrder: row.sort_order ?? 100,
      };
    });
  });

const consumeSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(120),
  reference: z.string().max(120).optional(),
});

export const consumeCredits = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => consumeSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true; balance: number }> => {
    const { supabase, tenantId, userId } = context;
    const { error } = await supabase.from("credit_ledger").insert({
      company_id: tenantId,
      kind: "consume",
      amount: -Math.abs(data.amount),
      reason: data.reason,
      reference: data.reference ?? null,
      actor_id: userId,
    });
    if (error) throw new Error(error.message);
    const { data: balance } = await supabase.rpc("credit_balance", { _company_id: tenantId });
    return { ok: true, balance: typeof balance === "number" ? balance : 0 };
  });
