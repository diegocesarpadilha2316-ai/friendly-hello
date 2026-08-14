/**
 * PluginManager — orquestração server-side de ciclo de vida.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PluginStatus } from "./types";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const PluginManager = {
  async setStatus(ctx: Ctx, pluginId: string, status: PluginStatus, enabled?: boolean) {
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (typeof enabled === "boolean") patch.enabled = enabled;
    const { error } = await ctx.supabase
      .from("plugins")
      .update(patch)
      .eq("id", pluginId)
      .eq("company_id", ctx.tenantId);
    if (error) throw new Error(error.message);
    await this.log(ctx, pluginId, "lifecycle", `status=${status}`);
  },
  async log(ctx: Ctx, pluginId: string | null, action: string, message?: string) {
    await ctx.supabase.from("plugin_logs").insert({
      company_id: ctx.tenantId,
      plugin_id: pluginId,
      level: "info",
      action,
      message: message ?? null,
    });
  },
};
