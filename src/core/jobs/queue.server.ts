/**
 * QueueManager — motor único de execução assíncrona.
 * Todos os módulos (Planner, Render, IA, Storage, etc.) usam este manager.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { nextRetryAt } from "./retry.server";
import { DeadLetter } from "./dead-letter.server";
import type { EnqueueJobInput, JsonRecord } from "./types";

type Ctx = { supabase: SupabaseClient; tenantId: string; userId: string };

export const QueueManager = {
  async enqueue(ctx: Ctx, input: EnqueueJobInput): Promise<string> {
    const scheduledAt = input.scheduledAt ?? new Date().toISOString();
    const { data, error } = await ctx.supabase
      .from("jobs")
      .insert({
        company_id: ctx.tenantId,
        queue: input.queue ?? "default",
        kind: input.kind,
        priority: input.priority ?? 5,
        max_attempts: input.maxAttempts ?? 5,
        timeout_ms: input.timeoutMs ?? 60_000,
        payload: (input.payload ?? {}) as JsonRecord,
        correlation_id: input.correlationId ?? null,
        parent_job_id: input.parentJobId ?? null,
        scheduled_at: scheduledAt,
        status: scheduledAt > new Date().toISOString() ? "scheduled" : "queued",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await this.log(ctx, data.id, "info", `Job ${input.kind} enfileirado`);
    return data.id as string;
  },

  async cancel(ctx: Ctx, jobId: string): Promise<void> {
    await ctx.supabase
      .from("jobs")
      .update({ status: "canceled", finished_at: new Date().toISOString() })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId)
      .in("status", ["queued", "scheduled", "running", "paused"]);
  },

  async pause(ctx: Ctx, jobId: string): Promise<void> {
    await ctx.supabase
      .from("jobs")
      .update({ status: "paused" })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId)
      .in("status", ["queued", "scheduled", "running"]);
  },

  async resume(ctx: Ctx, jobId: string): Promise<void> {
    await ctx.supabase
      .from("jobs")
      .update({ status: "queued" })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId)
      .eq("status", "paused");
  },

  async setProgress(ctx: Ctx, jobId: string, progress: number): Promise<void> {
    await ctx.supabase
      .from("jobs")
      .update({
        progress: Math.max(0, Math.min(100, Math.round(progress))),
        heartbeat_at: new Date().toISOString(),
      })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId);
  },

  async heartbeat(ctx: Ctx, jobId: string): Promise<void> {
    await ctx.supabase
      .from("jobs")
      .update({ heartbeat_at: new Date().toISOString() })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId);
  },

  async complete(ctx: Ctx, jobId: string, result: JsonRecord): Promise<void> {
    const finishedAt = new Date().toISOString();
    const { data } = await ctx.supabase
      .from("jobs")
      .update({ status: "completed", result, progress: 100, finished_at: finishedAt })
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId)
      .select("kind, attempts, started_at")
      .single();
    if (data) {
      await ctx.supabase.from("job_history").insert({
        company_id: ctx.tenantId,
        job_id: jobId,
        kind: data.kind,
        status: "completed",
        attempts: data.attempts,
        duration_ms: data.started_at
          ? new Date(finishedAt).getTime() - new Date(data.started_at as string).getTime()
          : null,
      });
    }
  },

  async fail(ctx: Ctx, jobId: string, error: string): Promise<void> {
    const { data: job } = await ctx.supabase
      .from("jobs")
      .select("*")
      .eq("company_id", ctx.tenantId)
      .eq("id", jobId)
      .maybeSingle();
    if (!job) return;
    const attempts = (job.attempts as number) + 1;
    const max = job.max_attempts as number;
    if (attempts >= max) {
      await ctx.supabase
        .from("jobs")
        .update({ status: "dead", attempts, error, finished_at: new Date().toISOString() })
        .eq("id", jobId)
        .eq("company_id", ctx.tenantId);
      await DeadLetter.move(
        ctx.supabase,
        ctx.tenantId,
        jobId,
        job.kind as string,
        attempts,
        error,
        (job.payload ?? {}) as Record<string, unknown>,
      );
    } else {
      const nextAt = nextRetryAt(attempts);
      await ctx.supabase
        .from("jobs")
        .update({ status: "queued", attempts, error, scheduled_at: nextAt })
        .eq("id", jobId)
        .eq("company_id", ctx.tenantId);
      await ctx.supabase.from("retry_queue").insert({
        company_id: ctx.tenantId,
        job_id: jobId,
        attempt: attempts,
        next_run_at: nextAt,
        reason: error,
      });
    }
  },

  async log(
    ctx: Ctx,
    jobId: string | null,
    level: "debug" | "info" | "warn" | "error",
    message: string,
    metadata: JsonRecord = {},
  ): Promise<void> {
    await ctx.supabase.from("job_logs").insert({
      company_id: ctx.tenantId,
      job_id: jobId,
      level,
      message,
      metadata,
    });
  },
};
