import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async () => {
        return new Response(JSON.stringify({ error: "Temporarily disabled for maintenance" }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      },
    },
  },
});
