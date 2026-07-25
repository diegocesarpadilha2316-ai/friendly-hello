/**
 * Cron endpoint público — avança a fila de render/vídeo.
 * Protegido por header `x-workers-secret: <WORKERS_CRON_SECRET>`.
 * Configurar em pg_cron ou scheduler externo para tickar a cada 15-30s.
 */
import { createFileRoute } from "@tanstack/react-router";

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-workers-secret",
  };
}

export const Route = createFileRoute("/api/public/v1/workers/render")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: cors() }),
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
          const { tickRenderWorkers } = await import(
            "@/core/workers/render-worker.server"
          );
          const result = await tickRenderWorkers({ maxJobs: 25 });
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