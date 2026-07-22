import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { QueueManager } from "./queue.server";
import { Scheduler } from "./scheduler.server";
import { DeadLetter } from "./dead-letter.server";
import { nextCronRun } from "./cron.server";
import type {
  CronJob,
  DeadLetterEntry,
  DistributedLock,
  Job,
  JobHistoryEntry,
  JobLogEntry,
  JobMetricBucket,
  JobQueue,
  JobsSnapshot,
  RetryEntry,
  WorkerNode,
} from "./types";

function mapJob(r: Record<string, unknown>): Job {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    queue: String(r.queue ?? "default"),
    kind: String(r.kind),
    status: r.status as Job["status"],
    priority: Number(r.priority ?? 5),
    attempts: Number(r.attempts ?? 0),
    maxAttempts: Number(r.max_attempts ?? 5),
    progress: Number(r.progress ?? 0),
    timeoutMs: Number(r.timeout_ms ?? 60_000),
    payload: (r.payload ?? {}) as Job["payload"],
    result: (r.result ?? {}) as Job["result"],
    error: (r.error as string) ?? null,
    correlationId: (r.correlation_id as string) ?? null,
    parentJobId: (r.parent_job_id as string) ?? null,
    scheduledAt: String(r.scheduled_at),
    startedAt: (r.started_at as string) ?? null,
    finishedAt: (r.finished_at as string) ?? null,
    heartbeatAt: (r.heartbeat_at as string) ?? null,
    workerId: (r.worker_id as string) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at ?? r.created_at),
  };
}

function mapQueue(r: Record<string, unknown>): JobQueue {
  return {
    id: String(r.id),
    name: String(r.name),
    concurrency: Number(r.concurrency ?? 5),
    paused: Boolean(r.paused),
    rateLimitPerMin: (r.rate_limit_per_min as number) ?? null,
  };
}

function mapCron(r: Record<string, unknown>): CronJob {
  return {
    id: String(r.id),
    name: String(r.name),
    cronExpr: String(r.cron_expr),
    kind: String(r.kind),
    queue: String(r.queue ?? "default"),
    payload: (r.payload ?? {}) as CronJob["payload"],
    active: Boolean(r.active),
    lastRunAt: (r.last_run_at as string) ?? null,
    nextRunAt: (r.next_run_at as string) ?? null,
  };
}

function mapLog(r: Record<string, unknown>): JobLogEntry {
  return {
    id: String(r.id),
    jobId: (r.job_id as string) ?? null,
    level: (r.level as JobLogEntry["level"]) ?? "info",
    message: String(r.message),
    createdAt: String(r.created_at),
  };
}

function mapHistory(r: Record<string, unknown>): JobHistoryEntry {
  return {
    id: String(r.id),
    jobId: String(r.job_id),
    kind: String(r.kind),
    status: r.status as JobHistoryEntry["status"],
    durationMs: (r.duration_ms as number) ?? null,
    attempts: Number(r.attempts ?? 0),
    error: (r.error as string) ?? null,
    finishedAt: String(r.finished_at),
  };
}

function mapMetric(r: Record<string, unknown>): JobMetricBucket {
  return {
    id: String(r.id),
    queue: String(r.queue ?? "default"),
    bucket: String(r.bucket),
    jobsCompleted: Number(r.jobs_completed ?? 0),
    jobsFailed: Number(r.jobs_failed ?? 0),
    jobsRetried: Number(r.jobs_retried ?? 0),
    avgDurationMs: Number(r.avg_duration_ms ?? 0),
    p95DurationMs: Number(r.p95_duration_ms ?? 0),
  };
}

function mapWorker(r: Record<string, unknown>): WorkerNode {
  return {
    id: String(r.id),
    name: String(r.name),
    hostname: (r.hostname as string) ?? null,
    region: (r.region as string) ?? null,
    status: (r.status as WorkerNode["status"]) ?? "idle",
    capacity: Number(r.capacity ?? 1),
    runningJobs: Number(r.running_jobs ?? 0),
    lastHeartbeatAt: String(r.last_heartbeat_at),
  };
}

function mapLock(r: Record<string, unknown>): DistributedLock {
  return {
    id: String(r.id),
    key: String(r.key),
    owner: String(r.owner),
    acquiredAt: String(r.acquired_at),
    expiresAt: String(r.expires_at),
  };
}

function mapDlq(r: Record<string, unknown>): DeadLetterEntry {
  return {
    id: String(r.id),
    jobId: String(r.job_id),
    kind: String(r.kind),
    attempts: Number(r.attempts ?? 0),
    error: (r.error as string) ?? null,
    movedAt: String(r.moved_at),
  };
}

function mapRetry(r: Record<string, unknown>): RetryEntry {
  return {
    id: String(r.id),
    jobId: String(r.job_id),
    attempt: Number(r.attempt ?? 0),
    nextRunAt: String(r.next_run_at),
    reason: (r.reason as string) ?? null,
  };
}

export const jobsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly Job[]> => {
    const { data } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map(mapJob);
  });

export const queuesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly JobQueue[]> => {
    const { data } = await context.supabase
      .from("job_queue")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("name");
    return (data ?? []).map(mapQueue);
  });

export const cronsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly CronJob[]> => {
    const { data } = await context.supabase
      .from("cron_jobs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("name");
    return (data ?? []).map(mapCron);
  });

export const jobLogs = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly JobLogEntry[]> => {
    const { data } = await context.supabase
      .from("job_logs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map(mapLog);
  });

export const jobHistoryList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly JobHistoryEntry[]> => {
    const { data } = await context.supabase
      .from("job_history")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("finished_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(mapHistory);
  });

export const jobsSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<JobsSnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [jobs, queues, crons, history, metrics, workers, locks, dlq, retries] = await Promise.all([
      s.from("jobs").select("*").eq("company_id", t).order("created_at", { ascending: false }).limit(200),
      s.from("job_queue").select("*").eq("company_id", t),
      s.from("cron_jobs").select("*").eq("company_id", t),
      s.from("job_history").select("*").eq("company_id", t).order("finished_at", { ascending: false }).limit(100),
      s.from("job_metrics").select("*").eq("company_id", t).order("bucket", { ascending: false }).limit(48),
      s.from("worker_nodes").select("*").eq("company_id", t).order("last_heartbeat_at", { ascending: false }),
      s.from("distributed_locks").select("*").eq("company_id", t),
      s.from("dead_letter_queue").select("*").eq("company_id", t).order("moved_at", { ascending: false }).limit(100),
      s.from("retry_queue").select("*").eq("company_id", t).order("next_run_at", { ascending: true }).limit(100),
    ]);
    return {
      jobs: (jobs.data ?? []).map(mapJob),
      queues: (queues.data ?? []).map(mapQueue),
      crons: (crons.data ?? []).map(mapCron),
      history: (history.data ?? []).map(mapHistory),
      metrics: (metrics.data ?? []).map(mapMetric),
      workers: (workers.data ?? []).map(mapWorker),
      locks: (locks.data ?? []).map(mapLock),
      deadLetter: (dlq.data ?? []).map(mapDlq),
      retries: (retries.data ?? []).map(mapRetry),
    };
  });

const enqueueSchema = z.object({
  kind: z.string().min(1),
  queue: z.string().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  maxAttempts: z.number().int().min(1).max(50).optional(),
  timeoutMs: z.number().int().min(1_000).max(3_600_000).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  correlationId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export const jobEnqueue = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => enqueueSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const id = await QueueManager.enqueue(context, data);
    return { id };
  });

const idSchema = z.object({ id: z.string().uuid() });

export const jobCancel = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await QueueManager.cancel(context, data.id);
    return { ok: true as const };
  });

export const jobPause = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await QueueManager.pause(context, data.id);
    return { ok: true as const };
  });

export const jobResume = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await QueueManager.resume(context, data.id);
    return { ok: true as const };
  });

const queueSchema = z.object({
  name: z.string().min(1),
  concurrency: z.number().int().min(1).max(1000).optional(),
  paused: z.boolean().optional(),
  rateLimitPerMin: z.number().int().min(1).optional(),
});

export const queueUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => queueSchema.parse(raw))
  .handler(async ({ context, data }): Promise<JobQueue> => {
    const { data: row, error } = await context.supabase
      .from("job_queue")
      .upsert(
        {
          company_id: context.tenantId,
          name: data.name,
          concurrency: data.concurrency ?? 5,
          paused: data.paused ?? false,
          rate_limit_per_min: data.rateLimitPerMin ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,name" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapQueue(row);
  });

const cronSchema = z.object({
  name: z.string().min(1),
  cronExpr: z.string().min(1),
  kind: z.string().min(1),
  queue: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const cronUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => cronSchema.parse(raw))
  .handler(async ({ context, data }): Promise<CronJob> => {
    const nextAt = nextCronRun(data.cronExpr).toISOString();
    const { data: row, error } = await context.supabase
      .from("cron_jobs")
      .upsert(
        {
          company_id: context.tenantId,
          name: data.name,
          cron_expr: data.cronExpr,
          kind: data.kind,
          queue: data.queue ?? "default",
          payload: data.payload ?? {},
          active: data.active ?? true,
          next_run_at: nextAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,name" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapCron(row);
  });

export const cronDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("cron_jobs")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

export const schedulerTick = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<{ dispatched: number }> => {
    const dispatched = await Scheduler.tick(context);
    return { dispatched };
  });

export const deadLetterRequeue = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await DeadLetter.requeue(context.supabase, context.tenantId, data.id);
    return { ok: true as const };
  });

export const jobsExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ format: z.enum(["json", "csv"]).default("json") }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<{ format: string; content: string }> => {
    const { data: rows } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(500);
    const list = (rows ?? []).map(mapJob);
    if (data.format === "csv") {
      const header = "id,kind,queue,status,priority,attempts,progress,createdAt,finishedAt";
      const body = list
        .map((j) =>
          [j.id, j.kind, j.queue, j.status, j.priority, j.attempts, j.progress, j.createdAt, j.finishedAt ?? ""].join(","),
        )
        .join("\n");
      return { format: "csv", content: `${header}\n${body}` };
    }
    return { format: "json", content: JSON.stringify(list, null, 2) };
  });