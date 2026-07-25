/**
 * Logger server-only — grava em `public.logs` via service role.
 * Nunca lança: observabilidade não pode derrubar o request principal.
 */
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
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

export async function logEvent(entry: LogEntry): Promise<void> {
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