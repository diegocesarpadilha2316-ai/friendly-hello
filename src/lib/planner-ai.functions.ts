/**
 * Etapa 8 — IA (sessions, messages, tool calls, memory, usage).
 *
 * Persistência real para o domínio `ai` do Planner sobre as tabelas
 * `planner_ai_sessions`, `planner_ai_messages`, `planner_ai_tool_calls`,
 * `planner_ai_memory` e `ai_usage_daily`. RLS por `company_id` via
 * `requireTenant`. Sem novos providers/stores — o hook `useAi()` continua
 * consumindo estes wrappers.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { debitCreditsBestEffort } from "@/core/billing/debit.server";
import { priceAiAssistantMessage, CREDIT_PRICES } from "@/core/billing/pricing";

export type AiRole = "system" | "user" | "assistant" | "tool";
export type AiMemoryScope = "project" | "user" | "company";

/* ------------------------------ Sessions -------------------------------- */

const listSessionsInput = z.object({
  projectId: z.string().uuid().optional(),
  archived: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const listAiSessions = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listSessionsInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("planner_ai_sessions")
      .select(
        "id,project_id,user_id,model_id,title,summary,message_count,tokens_in,tokens_out,archived,created_at,updated_at",
      )
      .eq("company_id", context.tenantId)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 30);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    if (data.archived !== undefined) q = q.eq("archived", data.archived);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

const createSessionInput = z.object({
  projectId: z.string().uuid().nullish(),
  title: z.string().trim().max(240).optional(),
  modelId: z.string().max(80).nullish(),
  systemPrompt: z.string().max(8000).optional(),
  context: z.record(z.unknown()).optional(),
});

export const createAiSession = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => createSessionInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    // Segurança: o projeto informado precisa pertencer ao tenant ativo.
    if (data.projectId) {
      const owns = await context.supabase
        .from("planner_projects")
        .select("id")
        .eq("company_id", context.tenantId)
        .eq("id", data.projectId)
        .maybeSingle();
      if (owns.error || !owns.data) throw new Response("Forbidden", { status: 403 });
    }
    const { data: row, error } = await context.supabase
      .from("planner_ai_sessions")
      .insert({
        company_id: context.tenantId,
        user_id: context.userId,
        project_id: data.projectId ?? null,
        model_id: data.modelId ?? null,
        title: data.title ?? "Nova conversa",
        summary: null,
        context: data.context ?? null,
        message_count: 0,
        tokens_in: 0,
        tokens_out: 0,
        archived: false,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    if (data.systemPrompt) {
      await context.supabase.from("planner_ai_messages").insert({
        session_id: row.id,
        company_id: context.tenantId,
        role: "system",
        content: data.systemPrompt,
        status: "ok",
      });
    }
    return row;
  });

export const getAiSession = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const [sessRes, msgsRes, toolRes] = await Promise.all([
      context.supabase
        .from("planner_ai_sessions")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("planner_ai_messages")
        .select(
          "id,role,content,status,tokens_in,tokens_out,latency_ms,metadata,edited,created_at",
        )
        .eq("session_id", data.id)
        .eq("company_id", context.tenantId)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("planner_ai_tool_calls")
        .select(
          "id,message_id,tool_name,args,result,status,summary,affected_ids,duration_ms,executed_at",
        )
        .eq("session_id", data.id)
        .eq("company_id", context.tenantId)
        .order("executed_at", { ascending: true }),
    ]);
    if (sessRes.error) throw new Response(sessRes.error.message, { status: 400 });
    if (!sessRes.data) throw new Response("Not found", { status: 404 });
    return {
      session: sessRes.data,
      messages: msgsRes.data ?? [],
      toolCalls: toolRes.data ?? [],
    };
  });

const updateSessionInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(240).optional(),
  summary: z.string().max(4000).optional(),
  archived: z.boolean().optional(),
  context: z.record(z.unknown()).optional(),
});

export const updateAiSession = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => updateSessionInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.summary !== undefined) patch.summary = data.summary;
    if (data.archived !== undefined) patch.archived = data.archived;
    if (data.context !== undefined) patch.context = data.context;
    const { error } = await context.supabase
      .from("planner_ai_sessions")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

export const deleteAiSession = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("planner_ai_sessions")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* ------------------------------ Messages -------------------------------- */

const appendMessageInput = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1).max(200_000),
  tokensIn: z.number().int().min(0).optional(),
  tokensOut: z.number().int().min(0).optional(),
  latencyMs: z.number().int().min(0).optional(),
  status: z.string().max(40).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const appendAiMessage = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => appendMessageInput.parse(data))
  .handler(async ({ data, context }) => {
    // Verify session tenancy.
    const own = await context.supabase
      .from("planner_ai_sessions")
      .select("id,message_count,tokens_in,tokens_out")
      .eq("company_id", context.tenantId)
      .eq("id", data.sessionId)
      .maybeSingle();
    if (own.error || !own.data) throw new Response("Forbidden", { status: 403 });

    const { data: row, error } = await context.supabase
      .from("planner_ai_messages")
      .insert({
        session_id: data.sessionId,
        company_id: context.tenantId,
        role: data.role,
        content: data.content,
        status: data.status ?? "ok",
        tokens_in: data.tokensIn ?? 0,
        tokens_out: data.tokensOut ?? 0,
        latency_ms: data.latencyMs ?? null,
        metadata: data.metadata ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    // Débito automático apenas em mensagens do assistente (respostas do modelo).
    if (data.role === "assistant" && (data.status ?? "ok") === "ok") {
      const charge = priceAiAssistantMessage({
        tokensIn: data.tokensIn ?? 0,
        tokensOut: data.tokensOut ?? 0,
      });
      await debitCreditsBestEffort(context.supabase, context.tenantId, context.userId, {
        amount: charge,
        reason: "ai.message.assistant",
        reference: data.sessionId,
        metadata: {
          messageId: row.id,
          tokensIn: data.tokensIn ?? 0,
          tokensOut: data.tokensOut ?? 0,
        },
      });
    }

    await context.supabase
      .from("planner_ai_sessions")
      .update({
        message_count: (own.data.message_count ?? 0) + 1,
        tokens_in: (own.data.tokens_in ?? 0) + (data.tokensIn ?? 0),
        tokens_out: (own.data.tokens_out ?? 0) + (data.tokensOut ?? 0),
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", context.tenantId)
      .eq("id", data.sessionId);

    return row;
  });

/* ----------------------------- Tool calls ------------------------------- */

const recordToolCallInput = z.object({
  sessionId: z.string().uuid(),
  messageId: z.string().uuid().nullish(),
  toolName: z.string().min(1).max(120),
  args: z.record(z.unknown()).optional(),
  result: z.record(z.unknown()).nullish(),
  status: z.enum(["ok", "error", "pending", "denied"]).default("ok"),
  summary: z.string().max(2000).nullish(),
  affectedIds: z.array(z.string()).max(500).optional(),
  durationMs: z.number().int().min(0).optional(),
});

export const recordAiToolCall = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => recordToolCallInput.parse(data))
  .handler(async ({ data, context }) => {
    const own = await context.supabase
      .from("planner_ai_sessions")
      .select("id")
      .eq("company_id", context.tenantId)
      .eq("id", data.sessionId)
      .maybeSingle();
    if (own.error || !own.data) throw new Response("Forbidden", { status: 403 });

    const { data: row, error } = await context.supabase
      .from("planner_ai_tool_calls")
      .insert({
        session_id: data.sessionId,
        message_id: data.messageId ?? null,
        company_id: context.tenantId,
        tool_name: data.toolName,
        // Auditoria: tool calls são auto-declaradas pelo cliente. Marcamos a
        // origem para que o histórico não seja confundido com execução server-side.
        args: { ...(data.args ?? {}), _origin: "client", _reportedBy: context.userId },
        result: data.result ?? null,
        status: data.status,
        summary: data.summary ?? null,
        affected_ids: data.affectedIds ?? null,
        duration_ms: data.durationMs ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    if (data.status === "ok") {
      await debitCreditsBestEffort(context.supabase, context.tenantId, context.userId, {
        amount: CREDIT_PRICES["ai.tool_call"],
        reason: "ai.tool_call",
        reference: data.sessionId,
        metadata: { toolName: data.toolName, messageId: data.messageId ?? null },
      });
    }
    return row;
  });

/* -------------------------------- Memory -------------------------------- */

const memoryUpsertInput = z.object({
  scope: z.enum(["project", "user", "company"]),
  projectId: z.string().uuid().nullish(),
  key: z.string().trim().min(1).max(120),
  value: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]),
  importance: z.number().int().min(0).max(10).optional(),
});

export const listAiMemory = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        scope: z.enum(["project", "user", "company"]).optional(),
        projectId: z.string().uuid().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("planner_ai_memory")
      .select("id,scope,project_id,user_id,key,value,importance,updated_at")
      .eq("company_id", context.tenantId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false });
    if (data.scope) q = q.eq("scope", data.scope);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

export const upsertAiMemory = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => memoryUpsertInput.parse(data))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: context.tenantId,
      scope: data.scope,
      project_id: data.scope === "project" ? (data.projectId ?? null) : null,
      user_id: data.scope === "user" ? context.userId : null,
      key: data.key,
      value: typeof data.value === "string" ? { text: data.value } : data.value,
      importance: data.importance ?? 5,
    };
    const { data: row, error } = await context.supabase
      .from("planner_ai_memory")
      .upsert(payload, {
        onConflict: "company_id,scope,project_id,user_id,key",
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });

export const deleteAiMemory = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("planner_ai_memory")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* -------------------------------- Usage --------------------------------- */

export const aiUsageStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({ days: z.number().int().min(1).max(90).optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const days = data.days ?? 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data: rows, error } = await context.supabase
      .from("ai_usage_daily")
      .select("day,provider,model_key,tokens_in,tokens_out,credits_spent,calls_ok,calls_error")
      .eq("company_id", context.tenantId)
      .gte("day", from)
      .order("day", { ascending: true });
    if (error) throw new Response(error.message, { status: 400 });
    const list = rows ?? [];
    return {
      series: list,
      totalTokensIn: list.reduce((a, r) => a + (r.tokens_in ?? 0), 0),
      totalTokensOut: list.reduce((a, r) => a + (r.tokens_out ?? 0), 0),
      totalCredits: list.reduce((a, r) => a + (Number(r.credits_spent) || 0), 0),
      totalCallsOk: list.reduce((a, r) => a + (r.calls_ok ?? 0), 0),
      totalCallsError: list.reduce((a, r) => a + (r.calls_error ?? 0), 0),
    };
  });

/* -------------------------------- Models -------------------------------- */

export const listAiModels = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_models")
      .select(
        "id,provider,model_key,display_name,kind,context_window,credits_per_1k_in,credits_per_1k_out,is_active",
      )
      .eq("is_active", true)
      .order("provider", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });