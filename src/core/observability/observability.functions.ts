import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  AuditEntry,
  ErrorReport,
  HealthCheckEntry,
  LogEntry,
  LogLevel,
  MetricEntry,
  ObservabilityMetrics,
  TraceSession,
} from "./types";

const levelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);
const jsonRecord = z.record(z.string(), z.unknown());

export const logsList = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        level: levelSchema.optional(),
        module: z.string().optional(),
        traceId: z.string().optional(),
        limit: z.number().int().positive().max(500).default(200),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ context, data }): Promise<readonly LogEntry[]> => {
    let q = context.supabase
      .from("logs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.level) q = q.eq("level", data.level);
    if (data.module) q = q.eq("module", data.module);
    if (data.traceId) q = q.eq("trace_id", data.traceId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const { mapLog } = await import("./logger.server");
    return (rows ?? []).map(mapLog);
  });

export const logsAppend = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        level: levelSchema.optional(),
        module: z.string().min(1),
        action: z.string().min(1),
        message: z.string().optional(),
        context: jsonRecord.optional(),
        metadata: jsonRecord.optional(),
        traceId: z.string().optional(),
        correlationId: z.string().optional(),
        durationMs: z.number().int().optional(),
        status: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { Logger } = await import("./logger.server");
    await Logger.write(context, data);
    return { ok: true as const };
  });

export const auditList = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        entity: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().int().positive().max(500).default(200),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ context, data }): Promise<readonly AuditEntry[]> => {
    let q = context.supabase
      .from("audit_logs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.action) q = q.eq("action", data.action);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const { mapAudit } = await import("./audit.server");
    return (rows ?? []).map(mapAudit);
  });

export const metricsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly MetricEntry[]> => {
    const { data, error } = await context.supabase
      .from("metrics")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const { mapMetric } = await import("./metrics.server");
    return (data ?? []).map(mapMetric);
  });

export const observabilityMetrics = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<ObservabilityMetrics> => {
    const [{ data: summaryRows }, { data: logs }, { data: health }] = await Promise.all([
      context.supabase.rpc("observability_summary", { _company: context.tenantId }),
      context.supabase
        .from("logs")
        .select("level, duration_ms")
        .eq("company_id", context.tenantId)
        .order("created_at", { ascending: false })
        .limit(1000),
      context.supabase
        .from("health_checks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const s = (Array.isArray(summaryRows) ? summaryRows[0] : summaryRows) as Record<
      string,
      number
    > | null;
    const levels: Record<LogLevel, number> = {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    let durSum = 0;
    let durCount = 0;
    for (const row of logs ?? []) {
      const lvl = row.level as LogLevel;
      if (lvl in levels) levels[lvl] += 1;
      if (typeof row.duration_ms === "number") {
        durSum += row.duration_ms;
        durCount += 1;
      }
    }
    const total = (logs ?? []).length;
    const errs = levels.error + levels.fatal;
    const { mapHealth } = await import("./metrics.server");
    return {
      summary: {
        logsTotal: Number(s?.logs_total ?? 0),
        logsErrors: Number(s?.logs_errors ?? 0),
        auditTotal: Number(s?.audit_total ?? 0),
        errorsOpen: Number(s?.errors_open ?? 0),
        tracesTotal: Number(s?.traces_total ?? 0),
      },
      logsByLevel: levels,
      errorRatePct: total ? Math.round((errs / total) * 1000) / 10 : 0,
      avgLogDurationMs: durCount ? Math.round(durSum / durCount) : 0,
      health: (health ?? []).map(mapHealth),
    };
  });

export const errorsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly ErrorReport[]> => {
    const { data, error } = await context.supabase
      .from("error_reports")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("last_seen_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const { mapError } = await import("./metrics.server");
    return (data ?? []).map(mapError);
  });

export const errorResolve = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("error_reports")
      .update({ resolved: true })
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const tracesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly TraceSession[]> => {
    const { data, error } = await context.supabase
      .from("trace_sessions")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("started_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const { mapTrace } = await import("./metrics.server");
    return (data ?? []).map(mapTrace);
  });

export const healthList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly HealthCheckEntry[]> => {
    const { data, error } = await context.supabase
      .from("health_checks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const { mapHealth } = await import("./metrics.server");
    return (data ?? []).map(mapHealth);
  });

export const observabilityExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        dataset: z.enum(["logs", "audit", "errors", "traces", "metrics"]),
        format: z.enum(["json", "csv"]).default("json"),
        limit: z.number().int().positive().max(5000).default(1000),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const table =
      data.dataset === "logs"
        ? "logs"
        : data.dataset === "audit"
          ? "audit_logs"
          : data.dataset === "errors"
            ? "error_reports"
            : data.dataset === "traces"
              ? "trace_sessions"
              : "metrics";
    const { data: rows, error } = await context.supabase
      .from(table)
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    if (data.format === "csv") {
      const list = (rows ?? []) as Array<Record<string, unknown>>;
      if (!list.length) return { format: "csv" as const, content: "" };
      const headers = Object.keys(list[0]);
      const esc = (v: unknown) => {
        const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return JSON.stringify(s);
      };
      const csv = [
        headers.join(","),
        ...list.map((r) => headers.map((h) => esc(r[h])).join(",")),
      ].join("\n");
      return { format: "csv" as const, content: csv };
    }
    return { format: "json" as const, content: JSON.stringify(rows ?? [], null, 2) };
  });
