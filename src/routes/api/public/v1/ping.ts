import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/ping")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});