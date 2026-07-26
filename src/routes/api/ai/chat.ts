import { createFileRoute } from "@tanstack/react-router";

/**
 * Proxy do Copiloto IA para o Lovable AI Gateway.
 *
 * Encaminha o payload OpenAI-compatível ao endpoint oficial da Lovable,
 * mantendo `LOVABLE_API_KEY` server-side. Suporta streaming SSE.
 */
export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        const body = await request.text();
        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "dioris-planner",
            },
            body,
          },
        );
        // Repassa headers relevantes e o corpo (stream ou JSON).
        const headers = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) headers.set("Content-Type", ct);
        headers.set("Cache-Control", "no-cache");
        return new Response(upstream.body, {
          status: upstream.status,
          headers,
        });
      },
    },
  },
});