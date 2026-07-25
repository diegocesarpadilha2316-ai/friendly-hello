/**
 * Logger server-only — grava em `public.logs` via service role.
 * Nunca lança: observabilidade não pode derrubar o request principal.
 */
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";
import type { LogEntry, LogLevel as PersistedLogLevel, JsonRecord } from "./types";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogInput {
  level?: LogLevel;
  module: string;
  action: string;
  message?: string;
  companyId?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string | null;
  traceId?: string | null;
  durationMs?: number | null;
  status?: string | null;
}

export async function logEvent(entry: LogInput): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("logs").insert({
      level: entry.level ?? "info",
      module: entry.module,
      action: entry.action,
      message: entry.message ?? null,
      company_id: entry.companyId ?? null,
      user_id: entry.userId ?? null,
      context: entry.context ?? {},
      metadata: entry.metadata ?? {},
      correlation_id: entry.correlationId ?? null,
      trace_id: entry.traceId ?? null,
      duration_ms: entry.durationMs ?? null,
      status: entry.status ?? null,
    });
  } catch (err) {
    // Fallback: console. Nunca propaga.
    // eslint-disable-next-line no-console
    console.error("[observability] logEvent failed", err);
  }
}

/** Mapeia uma linha de `public.logs` para o formato LogEntry consumido pela UI. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLog(row: any): LogEntry {
  return {
    id: String(row.id),
    companyId: (row.company_id as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    level: (row.level as PersistedLogLevel) ?? "info",
    module: String(row.module ?? ""),
    action: String(row.action ?? ""),
    message: (row.message as string | null) ?? null,
    context: (row.context as JsonRecord) ?? {},
    metadata: (row.metadata as JsonRecord) ?? {},
    ip: (row.ip as string | null) ?? null,
    userAgent: (row.user_agent as string | null) ?? null,
    traceId: (row.trace_id as string | null) ?? null,
    correlationId: (row.correlation_id as string | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    status: (row.status as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
  };
}

/** Logger via cliente autenticado do tenant (usado pelas server functions da UI). */
export const Logger = {
  async write(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: { supabase: any; tenantId: string; userId: string | null },
    data: {
      level?: LogLevel;
      module: string;
      action: string;
      message?: string;
      context?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      correlationId?: string;
      traceId?: string;
      durationMs?: number;
      status?: string;
    },
  ): Promise<void> {
    try {
      await context.supabase.from("logs").insert({
        company_id: context.tenantId,
        user_id: context.userId,
        level: data.level ?? "info",
        module: data.module,
        action: data.action,
        message: data.message ?? null,
        context: data.context ?? {},
        metadata: data.metadata ?? {},
        trace_id: data.traceId ?? null,
        correlation_id: data.correlationId ?? null,
        duration_ms: data.durationMs ?? null,
        status: data.status ?? null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[observability] Logger.write failed", err);
    }
  },
};

export async function auditEvent(input: {
  companyId: string;
  userId?: string | null;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "EXPORT"
    | "IMPORT"
    | "PAYMENT"
    | "AI_USAGE"
    | "CREDIT_USAGE"
    | "PERMISSION_CHANGE"
    | "CONFIG_CHANGE";
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("audit_logs").insert({
      company_id: input.companyId,
      user_id: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[observability] auditEvent failed", err);
  }
}