import type { SupabaseClient } from "@supabase/supabase-js";
import { nextCronRun } from "./cron.server";
import { QueueManager } from "./queue.server";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const Scheduler = {
  async tick(ctx: Ctx): Promise<number> {
    const now = new Date().toISOString();
    const { data } = await ctx.supabase
      .from("cron_jobs")
      .select("*")
      .eq("company_id", ctx.tenantId)
      .eq("active", true)
      .lte("next_run_at", now);
    let count = 0;
    for (const row of data ?? []) {
      await QueueManager.enqueue(ctx, {
        kind: row.kind as string,
        queue: (row.queue as string) ?? "default",
        payload: (row.payload as Record<string, unknown>) ?? {},
      });
      const next = nextCronRun(row.cron_expr as string).toISOString();
      await ctx.supabase
        .from("cron_jobs")
        .update({ last_run_at: now, next_run_at: next, updated_at: now })
        .eq("id", row.id);
      count++;
    }
    return count;
  },
};