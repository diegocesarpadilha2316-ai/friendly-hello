import type { SupabaseClient } from "@supabase/supabase-js";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const WorkerRegistry = {
  async register(ctx: Ctx, name: string, capacity = 1): Promise<string> {
    const { data, error } = await ctx.supabase
      .from("worker_nodes")
      .upsert(
        {
          company_id: ctx.tenantId,
          name,
          capacity,
          status: "idle",
          last_heartbeat_at: new Date().toISOString(),
        },
        { onConflict: "company_id,name" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id as string;
  },
  async heartbeat(ctx: Ctx, workerId: string, running = 0): Promise<void> {
    await ctx.supabase
      .from("worker_nodes")
      .update({
        last_heartbeat_at: new Date().toISOString(),
        running_jobs: running,
        status: running > 0 ? "busy" : "idle",
      })
      .eq("id", workerId)
      .eq("company_id", ctx.tenantId);
  },
  async offline(ctx: Ctx, workerId: string): Promise<void> {
    await ctx.supabase
      .from("worker_nodes")
      .update({ status: "offline" })
      .eq("id", workerId)
      .eq("company_id", ctx.tenantId);
  },
};