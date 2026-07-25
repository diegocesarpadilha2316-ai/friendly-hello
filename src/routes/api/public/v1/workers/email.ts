/**
 * Cron endpoint — processa fila de emails (notification_deliveries).
 * Header: `x-workers-secret: <WORKERS_CRON_SECRET>`. Tick 1-5min.
 */
import { createFileRoute } from "@tanstack/react-router";

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-workers-secret",
  };
}

export const Route = createFileRoute("/api/public/v1/workers/email")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors() }),
      POST: async ({ request }) => {
        const expected = process.env.WORKERS_CRON_SECRET;
        if (!expected) {
          return new Response(JSON.stringify({ error: "worker_disabled" }), {
            status: 503,
            headers: { ...cors(), "Content-Type": "application/json" },
          });
        }
        const provided =
          request.headers.get("x-workers-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { ...cors(), "Content-Type": "application/json" },
          });
        }
        const started = Date.now();
        try {
          const { tickEmailWorker } = await import(
            "@/core/workers/email-worker.server"
          );
          const result = await tickEmailWorker({ maxJobs: 25 });
          return new Response(
            JSON.stringify({ ok: true, took_ms: Date.now() - started, ...result }),
            { status: 200, headers: { ...cors(), "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "worker_error",
            }),
            { status: 500, headers: { ...cors(), "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});