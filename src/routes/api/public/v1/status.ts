import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/status")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({ ok: true, maintenance: true }), {
          headers: { "Content-Type": "application/json" }
        });
      },
    },
  },
});
