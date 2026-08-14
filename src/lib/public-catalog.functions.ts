/**
 * Server functions públicas para a landing/pricing.
 * Sem middleware de auth — usa cliente publishable server-side.
 * Reflete o catálogo real de planos + pacotes de crédito no Supabase externo.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type PublicPlanDTO = {
  key: string;
  label: string;
  monthlyCredits: number;
  priceCents: number;
  sortOrder: number;
  features: string[];
};

export type PublicCreditPackDTO = {
  key: string;
  label: string;
  credits: number;
  priceCents: number;
  currency: string;
  bonusPct: number;
  sortOrder: number;
};

function publicClient() {
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const key = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase externo não configurado.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const listPublicPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPlanDTO[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("plans")
      .select("key,label,monthly_credits,price_cents,sort_order,features")
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []).map(
      (r: {
        key: string;
        label: string;
        monthly_credits: number;
        price_cents: number;
        sort_order: number;
        features: unknown;
      }) => ({
        key: r.key,
        label: r.label,
        monthlyCredits: r.monthly_credits,
        priceCents: r.price_cents,
        sortOrder: r.sort_order,
        features: Array.isArray(r.features) ? (r.features as string[]) : [],
      }),
    );
  },
);

export const listPublicCreditPacks = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCreditPackDTO[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("credit_packs")
      .select("key,label,credits,price_cents,currency,bonus_pct,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data ?? []).map(
      (r: {
        key: string;
        label: string;
        credits: number;
        price_cents: number;
        currency: string;
        bonus_pct: number;
        sort_order: number;
      }) => ({
        key: r.key,
        label: r.label,
        credits: r.credits,
        priceCents: r.price_cents,
        currency: r.currency,
        bonusPct: r.bonus_pct,
        sortOrder: r.sort_order,
      }),
    );
  },
);
