import type { LogEntry, LogLevel, JsonRecord } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TenantContext = { supabase: any; tenantId: string; userId: string };

export interface LogInput {
  level?: LogLevel;
  module: string;
  action: string;
  message?: string;
  context?: JsonRecord;
  metadata?: JsonRecord;
  ip?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
  correlationId?: string | null;
  durationMs?: number | null;
  status?: string | null;
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const Logger = {
  newTraceId: randomId,
  newCorrelationId: randomId,

  async write(ctx: TenantContext, input: LogInput): Promise<void> {
    const { error } = await ctx.supabase.from("logs").insert({
      company_id: ctx.tenantId,
      user_id: ctx.userId,
      level: input.level ?? "info",
      module: input.module,
      action: input.action,
      message: input.message ?? null,
      context: input.context ?? {},
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      trace_id: input.traceId ?? null,
      correlation_id: input.correlationId ?? null,
      duration_ms: input.durationMs ?? null,
      status: input.status ?? null,
    });
    if (error) throw new Error(error.message);
  },

  info: (ctx: TenantContext, i: Omit<LogInput, "level">) =>
    Logger.write(ctx, { ...i, level: "info" }),
  warn: (ctx: TenantContext, i: Omit<LogInput, "level">) =>
    Logger.write(ctx, { ...i, level: "warn" }),
  error: (ctx: TenantContext, i: Omit<LogInput, "level">) =>
    Logger.write(ctx, { ...i, level: "error" }),
  fatal: (ctx: TenantContext, i: Omit<LogInput, "level">) =>
    Logger.write(ctx, { ...i, level: "fatal" }),
  debug: (ctx: TenantContext, i: Omit<LogInput, "level">) =>
    Logger.write(ctx, { ...i, level: "debug" }),
};

export function mapLog(row: Record<string, unknown>): LogEntry {
  return {
    id: String(row.id),
    companyId: (row.company_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    level: row.level as LogLevel,
    module: String(row.module),
    action: String(row.action),
    message: (row.message as string) ?? null,
    context: (row.context as JsonRecord) ?? {},
    metadata: (row.metadata as JsonRecord) ?? {},
    ip: (row.ip as string) ?? null,
    userAgent: (row.user_agent as string) ?? null,
    traceId: (row.trace_id as string) ?? null,
    correlationId: (row.correlation_id as string) ?? null,
    durationMs: (row.duration_ms as number) ?? null,
    status: (row.status as string) ?? null,
    createdAt: String(row.created_at),
  };
}