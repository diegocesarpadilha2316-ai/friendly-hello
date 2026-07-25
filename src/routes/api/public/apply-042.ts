import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const Route = createFileRoute("/api/public/apply-042")({
  server: {
    handlers: {
      POST: async () => {
        const url = process.env.EXTERNAL_SUPABASE_URL!;
        const key = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY!;
        const sql = readFileSync(resolve(process.cwd(), "db/migrations/042_payment_providers.sql"), "utf8");
        const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ sql }),
        });
        const text = await res.text();
        return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: text }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});