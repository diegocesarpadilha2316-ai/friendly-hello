/**
 * Admin-only server functions for the platform-wide payment providers config.
 * Requires the caller to be a platform_admin (verified via is_platform_admin RPC).
 * Table `payment_providers` — migration 042.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PaymentProviderDTO = {
  code: string;
  name: string;
  region: string;
  enabled: boolean;
  mode: "sandbox" | "live";
  publicKey: string | null;
  webhookUrl: string | null;
  secretEnvNames: string[];
  methods: string[];
  status: "not_configured" | "test" | "live" | "error" | "disabled";
  notes: string | null;
  sortOrder: number;
  updatedAt: string;
};

function mapRow(r: {
  code: string;
  name: string;
  region: string;
  enabled: boolean;
  mode: "sandbox" | "live";
  public_key: string | null;
  webhook_url: string | null;
  secret_env_names: string[];
  methods: string[];
  status: PaymentProviderDTO["status"];
  notes: string | null;
  sort_order: number;
  updated_at: string;
}): PaymentProviderDTO {
  return {
    code: r.code,
    name: r.name,
    region: r.region,
    enabled: r.enabled,
    mode: r.mode,
    publicKey: r.public_key,
    webhookUrl: r.webhook_url,
    secretEnvNames: r.secret_env_names ?? [],
    methods: r.methods ?? [],
    status: r.status,
    notes: r.notes,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

async function assertAdmin(ctx: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("is_platform_admin", { _user: ctx.userId });
  if (error) throw new Response(`Admin check failed: ${error.message}`, { status: 500 });
  if (!data) throw new Response("Forbidden: platform admin required", { status: 403 });
}

export const listPaymentProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("payment_providers")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Response(error.message, { status: 500 });
    return { providers: (data ?? []).map(mapRow) };
  });

const updateInput = z.object({
  code: z.string().min(1),
  enabled: z.boolean().optional(),
  mode: z.enum(["sandbox", "live"]).optional(),
  publicKey: z.string().nullable().optional(),
  webhookUrl: z.string().nullable().optional(),
  status: z.enum(["not_configured", "test", "live", "error", "disabled"]).optional(),
  notes: z.string().nullable().optional(),
});

export const updatePaymentProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => updateInput.parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = { updated_by: context.userId, updated_at: new Date().toISOString() };
    if (data.enabled !== undefined) patch.enabled = data.enabled;
    if (data.mode !== undefined) patch.mode = data.mode;
    if (data.publicKey !== undefined) patch.public_key = data.publicKey;
    if (data.webhookUrl !== undefined) patch.webhook_url = data.webhookUrl;
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;

    const { data: row, error } = await context.supabase
      .from("payment_providers")
      .update(patch)
      .eq("code", data.code)
      .select("*")
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    if (!row) throw new Response("Provider not found", { status: 404 });
    return { provider: mapRow(row) };
  });