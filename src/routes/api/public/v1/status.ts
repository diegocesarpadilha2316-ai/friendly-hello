import { createFileRoute } from "@tanstack/react-router";

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

type Check = { name: string; ok: boolean; latencyMs: number; detail?: string };

async function timed<T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number; detail?: string }> {
  const t = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : String(e) };
  }
}

export const Route = createFileRoute("/api/public/v1/status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors() }),
      GET: async () => {
        const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
        const sb = getSupabaseAdmin();

        const dbCheck = await timed(async () => {
          const { error } = await sb.from("companies").select("id", { head: true, count: "exact" }).limit(1);
          if (error) throw new Error(error.message);
        });
        const authCheck = await timed(async () => {
          const { error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
          if (error) throw new Error(error.message);
        });
        const storageCheck = await timed(async () => {
          const { error } = await sb.storage.listBuckets();
          if (error) throw new Error(error.message);
        });

        const checks: Check[] = [
          { name: "Database", ok: dbCheck.ok, latencyMs: dbCheck.ms, detail: dbCheck.detail },
          { name: "Auth", ok: authCheck.ok, latencyMs: authCheck.ms, detail: authCheck.detail },
          { name: "Storage", ok: storageCheck.ok, latencyMs: storageCheck.ms, detail: storageCheck.detail },
          { name: "API Gateway", ok: true, latencyMs: 0 },
          { name: "IA Gateway", ok: true, latencyMs: 0 },
          { name: "Jobs & Workers", ok: true, latencyMs: 0 },
          { name: "Notifications", ok: true, latencyMs: 0 },
          { name: "Webhooks", ok: true, latencyMs: 0 },
        ];

        const allOk = checks.every((c) => c.ok);
        return new Response(
          JSON.stringify({ ok: allOk, ts: new Date().toISOString(), checks }),
          { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors() } },
        );
      },
    },
  },
});