import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createUserScopedClient } from "@/core/lib/supabase/server-user.server";
import { debitCreditsOrThrow, refundCreditsBestEffort } from "@/core/billing/debit.server";
import { priceAiAssistantMessage } from "@/core/billing/pricing";
import { AI_MODEL_CATALOG } from "@/core/ai/catalog";

/**
 * Proxy autenticado do Copiloto IA para o Lovable AI Gateway.
 *
 * Segurança (Etapa 0/7):
 *  - exige Bearer token válido do Supabase (401 sem sessão);
 *  - exige tenant ativo em `company_members` (403 caso contrário);
 *  - valida formato e tamanho do payload (400 / 413);
 *  - whitelist estrita de campos e allowlist de modelos;
 *  - debita créditos ANTES de chamar o provedor (402 se saldo insuficiente);
 *  - estorna (`refund`) se o provedor falhar — nunca cobra sem entregar;
 *  - nunca retorna 2xx sem que o débito obrigatório tenha sido gravado;
 *  - nunca expõe `LOVABLE_API_KEY` nem detalhes internos nos erros.
 */

const MAX_BODY_BYTES = 256 * 1024; // 256 KB
const MAX_MESSAGE_CHARS = 24_000;
const MAX_MESSAGES = 80;
const MAX_TOTAL_CHARS = 200_000;

const ALLOWED_MODELS = new Set(AI_MODEL_CATALOG.filter((m) => m.enabled).map((m) => m.id));
const DEFAULT_MODEL = "google/gemini-3.6-flash";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(z.unknown()), z.null()]).optional(),
  name: z.string().max(120).optional(),
  tool_call_id: z.string().max(200).optional(),
  tool_calls: z.array(z.unknown()).max(40).optional(),
});

const toolSchema = z.object({
  type: z.literal("function"),
  function: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2_000).optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
});

const payloadSchema = z.object({
  model: z.string().min(1).max(200).optional(),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(32_000).nullable().optional(),
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  tools: z.array(toolSchema).max(80).optional(),
  client_message_id: z.string().max(120).optional(),
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function contentLength(content: unknown): number {
  if (typeof content === "string") return content.length;
  if (content == null) return 0;
  try {
    return JSON.stringify(content).length;
  } catch {
    return 0;
  }
}

function normalizeModel(model: string | null | undefined): string {
  const id = model ?? DEFAULT_MODEL;
  return ALLOWED_MODELS.has(id) ? id : DEFAULT_MODEL;
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /* ------------------------- 1. Autenticação ------------------------- */
        const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
        if (!auth?.startsWith("Bearer ")) {
          return json({ error: "unauthorized" }, 401);
        }

        let supabase;
        try {
          supabase = createUserScopedClient(auth.slice("Bearer ".length));
        } catch {
          return json({ error: "service_unavailable" }, 503);
        }

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
        const userId = userData.user.id;

        /* ---------------------------- 2. Tenant ---------------------------- */
        const rawTenant =
          request.headers.get("x-dioris-tenant") ?? request.headers.get("X-Dioris-Tenant") ?? "";
        const tenantParsed = z.string().uuid().safeParse(rawTenant);

        let tenantId: string | null = tenantParsed.success ? tenantParsed.data : null;

        // Fallback de compatibilidade: resolve o único tenant ativo do usuário.
        const memberQuery = supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", userId)
          .eq("active", true);

        const { data: memberships, error: memberErr } = tenantId
          ? await memberQuery.eq("company_id", tenantId).limit(1)
          : await memberQuery.limit(2);

        if (memberErr) return json({ error: "tenant_check_failed" }, 500);
        if (!memberships || memberships.length === 0) {
          return json({ error: "forbidden_no_tenant" }, 403);
        }
        if (!tenantId) {
          if (memberships.length > 1) return json({ error: "tenant_required" }, 403);
          tenantId = memberships[0].company_id as string;
        }

        /* ---------------------------- 3. Payload --------------------------- */
        const raw = await request.text();
        if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
          return json({ error: "payload_too_large" }, 413);
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = payloadSchema.safeParse(parsedJson);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);

        const messages = parsed.data.messages;
        let totalChars = 0;
        for (const m of messages) {
          const len = contentLength(m.content);
          if (len > MAX_MESSAGE_CHARS) return json({ error: "message_too_long" }, 413);
          totalChars += len;
        }
        if (totalChars > MAX_TOTAL_CHARS) return json({ error: "payload_too_large" }, 413);

        const model = normalizeModel(parsed.data.model);
        const stream = parsed.data.stream === true;

        /* --------------- 4. Débito obrigatório (antes do provedor) --------- */
        const estimatedTokensIn = Math.ceil(totalChars / 4);
        const cost = priceAiAssistantMessage({ tokensIn: estimatedTokensIn });
        const debitMeta = {
          surface: "planner.copilot",
          model,
          messages: messages.length,
          stream,
          estimated_tokens_in: estimatedTokensIn,
          client_message_id: parsed.data.client_message_id ?? null,
        };

        // Débito obrigatório: se falhar (saldo insuficiente ou erro do ledger),
        // a requisição termina aqui e o provedor nunca é chamado.
        try {
          await debitCreditsOrThrow(supabase, tenantId, userId, {
            amount: cost,
            reason: "ai.message.assistant",
            reference: model,
            metadata: debitMeta,
          });
        } catch (err) {
          if (err instanceof Response) {
            if (err.status === 402) {
              const body = await err.text().catch(() => "");
              return new Response(body || JSON.stringify({ code: "insufficient_credits" }), {
                status: 402,
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
              });
            }
            return json({ error: "billing_unavailable" }, 500);
          }
          return json({ error: "billing_unavailable" }, 500);
        }

        const refund = (stage: string) =>
          refundCreditsBestEffort(tenantId as string, userId, {
            amount: cost,
            reason: "ai.message.assistant.refund",
            reference: model,
            metadata: { ...debitMeta, refund_stage: stage },
          });

        /* --------------------------- 5. Provedor --------------------------- */
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          await refund("missing_api_key");
          return json({ error: "service_unavailable" }, 503);
        }

        const upstreamBody: Record<string, unknown> = {
          model,
          messages,
          stream,
        };
        if (parsed.data.temperature !== undefined)
          upstreamBody.temperature = parsed.data.temperature;
        if (parsed.data.max_tokens != null) upstreamBody.max_tokens = parsed.data.max_tokens;
        if (parsed.data.tools?.length) upstreamBody.tools = parsed.data.tools;

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "dioris-planner",
            },
            body: JSON.stringify(upstreamBody),
          });
        } catch {
          await refund("upstream_unreachable");
          return json({ error: "upstream_unavailable" }, 502);
        }

        if (!upstream.ok) {
          // Estorno integral: a chamada ao provedor não produziu resposta útil.
          await refund(`upstream_${upstream.status}`);
          const status = upstream.status === 429 ? 429 : 502;
          return json({ error: "upstream_error", status: upstream.status }, status);
        }

        /* ---------------------------- 6. Resposta -------------------------- */
        // Streaming: o débito já está gravado antes do primeiro byte. Uma queda
        // no meio do stream NÃO gera estorno automático (o provedor já foi
        // consumido) — apenas falhas antes do 2xx do upstream são estornadas.
        const headers = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) headers.set("Content-Type", ct);
        headers.set("Cache-Control", "no-store");
        headers.set("X-Dioris-AI-Model", model);
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
