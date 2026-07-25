/**
 * Admin-only observability aggregates.
 * Requires platform_admin (via is_platform_admin RPC).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireTenant } from "@/core/middleware/require-tenant";

export type ObservabilitySnapshot = {
  window: "24h";
  logs: { total: number; errors: number; warnings: number };
  jobs: { pending: number; running: number; failed24h: number; completed24h: number };
  notifications: { pending: number; failed24h: number; sent24h: number };
  payments: { pending: number; approved24h: number; grossCents24h: number };
  ai: { requests24h: number; errors24h: number };
  recentErrors: Array<{ id: string; module: string; message: string | null; createdAt: string }>;
};

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("is_platform_admin", { _user: ctx.userId });
  if (error) throw new Response(`Admin check failed: ${error.message}`, { status: 500 });
  if (!data) throw new Response("Forbidden: platform admin required", { status: 403 });
}

const H24 = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

async function count(sb: any, table: string, filters: Array<[string, string, unknown]>): Promise<number> {
  let q = sb.from(table).select("id", { count: "exact", head: true });
  for (const [col, op, val] of filters) q = (q as any)[op](col, val);
  const { count: c, error } = await q;
  if (error) return 0;
  return c ?? 0;
}

export const getObservabilitySnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<ObservabilitySnapshot> => {
    await assertAdmin(context);
    const sb = context.supabase;
    const since = H24();

    const [
      logsTotal, logsErr, logsWarn,
      jobsPending, jobsRunning, jobsFailed, jobsDone,
      notifPending, notifFailed, notifSent,
      payPending, payApproved,
      aiReq, aiErr,
    ] = await Promise.all([
      count(sb, "logs", [["created_at", "gte", since]]),
      count(sb, "logs", [["created_at", "gte", since], ["level", "eq", "error"]]),
      count(sb, "logs", [["created_at", "gte", since], ["level", "eq", "warn"]]),
      count(sb, "jobs", [["status", "eq", "pending"]]),
      count(sb, "jobs", [["status", "eq", "running"]]),
      count(sb, "jobs", [["status", "eq", "failed"], ["created_at", "gte", since]]),
      count(sb, "jobs", [["status", "eq", "completed"], ["created_at", "gte", since]]),
      count(sb, "notifications", [["status", "eq", "pending"]]),
      count(sb, "notifications", [["status", "eq", "failed"], ["created_at", "gte", since]]),
      count(sb, "notifications", [["status", "eq", "sent"], ["created_at", "gte", since]]),
      count(sb, "payment_orders", [["status", "eq", "pending"]]),
      count(sb, "payment_orders", [["status", "eq", "approved"], ["updated_at", "gte", since]]),
      count(sb, "logs", [["created_at", "gte", since], ["module", "eq", "ai"]]),
      count(sb, "logs", [["created_at", "gte", since], ["module", "eq", "ai"], ["level", "eq", "error"]]),
    ]);

    // Bruto aprovado 24h
    const { data: paidRows } = await sb
      .from("payment_orders")
      .select("amount_cents,status,updated_at")
      .eq("status", "approved")
      .gte("updated_at", since)
      .limit(1000);
    const grossCents24h = (paidRows ?? []).reduce((s: number, r: any) => s + (r.amount_cents ?? 0), 0);

    const { data: errRows } = await sb
      .from("logs")
      .select("id,module,message,created_at")
      .eq("level", "error")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      window: "24h",
      logs: { total: logsTotal, errors: logsErr, warnings: logsWarn },
      jobs: { pending: jobsPending, running: jobsRunning, failed24h: jobsFailed, completed24h: jobsDone },
      notifications: { pending: notifPending, failed24h: notifFailed, sent24h: notifSent },
      payments: { pending: payPending, approved24h: payApproved, grossCents24h },
      ai: { requests24h: aiReq, errors24h: aiErr },
      recentErrors: (errRows ?? []).map((r: any) => ({
        id: r.id, module: r.module, message: r.message, createdAt: r.created_at,
      })),
    };
  });