import type { SupabaseClient } from "@supabase/supabase-js";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const JobRunner = {
  async claimNext(ctx: Ctx, queue = "default", workerId: string): Promise<string | null> {
    const now = new Date().toISOString();
    const { data: q } = await ctx.supabase
      .from("job_queue")
      .select("paused")
      .eq("company_id", ctx.tenantId)
      .eq("name", queue)
      .maybeSingle();
    if (q?.paused) return null;
    const { data: candidates } = await ctx.supabase
      .from("jobs")
      .select("id")
      .eq("company_id", ctx.tenantId)
      .eq("queue", queue)
      .eq("status", "queued")
      .lte("scheduled_at", now)
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: true })
      .limit(1);
    const id = candidates?.[0]?.id as string | undefined;
    if (!id) return null;
    const { data: claimed } = await ctx.supabase
      .from("jobs")
      .update({
        status: "running",
        started_at: now,
        heartbeat_at: now,
        worker_id: workerId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("company_id", ctx.tenantId)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    return (claimed?.id as string | undefined) ?? null;
  },
};
