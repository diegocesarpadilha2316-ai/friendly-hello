import type {
  ErrorReport,
  HealthCheckEntry,
  HealthStatus,
  JsonRecord,
  MetricEntry,
  TraceSession,
} from "./types";

export function mapMetric(row: Record<string, unknown>): MetricEntry {
  return {
    id: String(row.id),
    companyId: (row.company_id as string) ?? null,
    name: String(row.name),
    value: Number(row.value),
    unit: (row.unit as string) ?? null,
    tags: (row.tags as JsonRecord) ?? {},
    createdAt: String(row.created_at),
  };
}

export function mapHealth(row: Record<string, unknown>): HealthCheckEntry {
  return {
    id: String(row.id),
    component: String(row.component),
    status: (row.status as HealthStatus) ?? "unknown",
    latencyMs: (row.latency_ms as number) ?? null,
    detail: (row.detail as JsonRecord) ?? {},
    createdAt: String(row.created_at),
  };
}

export function mapError(row: Record<string, unknown>): ErrorReport {
  return {
    id: String(row.id),
    companyId: (row.company_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    module: String(row.module),
    message: String(row.message),
    stack: (row.stack as string) ?? null,
    fingerprint: (row.fingerprint as string) ?? null,
    occurrences: Number(row.occurrences ?? 1),
    context: (row.context as JsonRecord) ?? {},
    traceId: (row.trace_id as string) ?? null,
    resolved: Boolean(row.resolved),
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
    createdAt: String(row.created_at),
  };
}

export function mapTrace(row: Record<string, unknown>): TraceSession {
  return {
    id: String(row.id),
    traceId: String(row.trace_id),
    companyId: (row.company_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    rootModule: (row.root_module as string) ?? null,
    rootAction: (row.root_action as string) ?? null,
    startedAt: String(row.started_at),
    endedAt: (row.ended_at as string) ?? null,
    durationMs: (row.duration_ms as number) ?? null,
    status: (row.status as string) ?? null,
    metadata: (row.metadata as JsonRecord) ?? {},
  };
}