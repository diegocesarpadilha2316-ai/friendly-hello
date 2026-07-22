export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type AuditAction =
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

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
export type JsonRecord = Record<string, unknown>;

export interface LogEntry {
  id: string;
  companyId: string | null;
  userId: string | null;
  level: LogLevel;
  module: string;
  action: string;
  message: string | null;
  context: JsonRecord;
  metadata: JsonRecord;
  ip: string | null;
  userAgent: string | null;
  traceId: string | null;
  correlationId: string | null;
  durationMs: number | null;
  status: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  companyId: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  before: JsonRecord | null;
  after: JsonRecord | null;
  diff: JsonRecord | null;
  metadata: JsonRecord;
  ip: string | null;
  userAgent: string | null;
  traceId: string | null;
  createdAt: string;
}

export interface MetricEntry {
  id: string;
  companyId: string | null;
  name: string;
  value: number;
  unit: string | null;
  tags: JsonRecord;
  createdAt: string;
}

export interface HealthCheckEntry {
  id: string;
  component: string;
  status: HealthStatus;
  latencyMs: number | null;
  detail: JsonRecord;
  createdAt: string;
}

export interface ErrorReport {
  id: string;
  companyId: string | null;
  userId: string | null;
  module: string;
  message: string;
  stack: string | null;
  fingerprint: string | null;
  occurrences: number;
  context: JsonRecord;
  traceId: string | null;
  resolved: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface TraceSession {
  id: string;
  traceId: string;
  companyId: string | null;
  userId: string | null;
  rootModule: string | null;
  rootAction: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  status: string | null;
  metadata: JsonRecord;
}

export interface ObservabilitySummary {
  logsTotal: number;
  logsErrors: number;
  auditTotal: number;
  errorsOpen: number;
  tracesTotal: number;
}

export interface ObservabilityMetrics {
  summary: ObservabilitySummary;
  logsByLevel: Record<LogLevel, number>;
  errorRatePct: number;
  avgLogDurationMs: number;
  health: readonly HealthCheckEntry[];
}