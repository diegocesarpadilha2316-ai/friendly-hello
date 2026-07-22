import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Backup, DrPlan, IntegrityCheck, RecoveryHealth, RecoveryHistoryPoint,
  Restore, Schedule, Snapshot, Target,
} from "./types";

/**
 * RecoveryManager (server-side) — motor único de backup, snapshots,
 * restore, PITR, verificação de integridade e planos de DR. Reutiliza
 * Storage, Jobs, Observability, Security, CI/CD, Notifications, Event
 * Center e API Gateway. Não introduz motor paralelo — apenas persiste e
 * expõe operações para os módulos.
 */

export function mapTarget(r: Record<string, unknown>): Target {
  return {
    id: String(r.id), slug: String(r.slug), name: String(r.name),
    kind: r.kind as Target["kind"], destination: r.destination as Target["destination"],
    retentionDays: Number(r.retention_days ?? 0),
    encryption: String(r.encryption ?? "aes256"),
    enabled: Boolean(r.enabled),
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

export function mapSchedule(r: Record<string, unknown>): Schedule {
  return {
    id: String(r.id), targetId: String(r.target_id), cron: String(r.cron),
    strategy: r.strategy as Schedule["strategy"], enabled: Boolean(r.enabled),
    nextRunAt: (r.next_run_at as string | null) ?? null,
    lastRunAt: (r.last_run_at as string | null) ?? null,
    createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

export function mapBackup(r: Record<string, unknown>): Backup {
  return {
    id: String(r.id),
    targetId: (r.target_id as string | null) ?? null,
    targetSlug: String(r.target_slug),
    kind: r.kind as Backup["kind"],
    strategy: r.strategy as Backup["strategy"],
    trigger: r.trigger as Backup["trigger"],
    status: r.status as Backup["status"],
    sizeBytes: r.size_bytes == null ? null : Number(r.size_bytes),
    checksum: (r.checksum as string | null) ?? null,
    storageUri: (r.storage_uri as string | null) ?? null,
    parentBackupId: (r.parent_backup_id as string | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    expiresAt: (r.expires_at as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at),
  };
}

export function mapSnapshot(r: Record<string, unknown>): Snapshot {
  return {
    id: String(r.id),
    backupId: (r.backup_id as string | null) ?? null,
    scope: r.scope as Snapshot["scope"],
    target: String(r.target),
    version: (r.version as string | null) ?? null,
    sizeBytes: r.size_bytes == null ? null : Number(r.size_bytes),
    checksum: (r.checksum as string | null) ?? null,
    storageUri: (r.storage_uri as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at),
  };
}

export function mapRestore(r: Record<string, unknown>): Restore {
  return {
    id: String(r.id),
    backupId: (r.backup_id as string | null) ?? null,
    snapshotId: (r.snapshot_id as string | null) ?? null,
    mode: r.mode as Restore["mode"],
    status: r.status as Restore["status"],
    pointInTime: (r.point_in_time as string | null) ?? null,
    targetScope: (r.target_scope as string | null) ?? null,
    requestedBy: (r.requested_by as string | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at),
  };
}

export function mapIntegrity(r: Record<string, unknown>): IntegrityCheck {
  return {
    id: String(r.id), backupId: String(r.backup_id),
    checkKind: r.check_kind as IntegrityCheck["checkKind"],
    status: r.status as IntegrityCheck["status"],
    detail: (r.detail as string | null) ?? null,
    durationMs: r.duration_ms == null ? null : Number(r.duration_ms),
    checkedAt: String(r.checked_at),
  };
}

export function mapPlan(r: Record<string, unknown>): DrPlan {
  return {
    id: String(r.id), slug: String(r.slug), name: String(r.name),
    rtoMinutes: Number(r.rto_minutes ?? 0), rpoMinutes: Number(r.rpo_minutes ?? 0),
    replication: r.replication as DrPlan["replication"],
    failover: r.failover as DrPlan["failover"],
    status: r.status as DrPlan["status"],
    lastDrillAt: (r.last_drill_at as string | null) ?? null,
    lastDrillStatus: (r.last_drill_status as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

export function mapHistory(r: Record<string, unknown>): RecoveryHistoryPoint {
  return {
    id: String(r.id), bucketAt: String(r.bucket_at),
    backups: Number(r.backups ?? 0), restores: Number(r.restores ?? 0),
    failed: Number(r.failed ?? 0), verified: Number(r.verified ?? 0),
    bytes: Number(r.bytes ?? 0),
  };
}

export function computeHealth(input: {
  targets: Target[]; schedules: Schedule[]; backups: Backup[];
  restores: Restore[]; plans: DrPlan[];
}): RecoveryHealth {
  const verified = input.backups.filter((b) => b.status === "verified" || b.status === "completed").length;
  const restoresOk = input.restores.filter((r) => r.status === "completed").length;
  const totalR = input.restores.length;
  const bytes = input.backups.reduce((sum, b) => sum + (b.sizeBytes ?? 0), 0);
  return {
    totalTargets: input.targets.length,
    enabledTargets: input.targets.filter((t) => t.enabled).length,
    totalBackups: input.backups.length,
    verifiedBackups: verified,
    totalRestores: totalR,
    restoreSuccessRate: totalR === 0 ? 100 : Math.round((restoresOk / totalR) * 100),
    activeSchedules: input.schedules.filter((s) => s.enabled).length,
    failingPlans: input.plans.filter((p) => p.status === "failing").length,
    lastBackupAt: input.backups[0]?.createdAt ?? null,
    lastRestoreAt: input.restores[0]?.createdAt ?? null,
    totalBytes: bytes,
  };
}

/** Simula PITR/restore reutilizando a própria tabela recovery_restores. */
export async function recordRestore(
  supabase: SupabaseClient,
  tenantId: string,
  input: {
    backupId?: string | null; snapshotId?: string | null;
    mode: Restore["mode"]; pointInTime?: string | null;
    targetScope?: string | null; requestedBy?: string | null;
    correlationId?: string | null; metadata?: Record<string, unknown>;
  },
): Promise<Restore> {
  const { data, error } = await supabase.from("recovery_restores").insert({
    company_id: tenantId,
    backup_id: input.backupId ?? null,
    snapshot_id: input.snapshotId ?? null,
    mode: input.mode,
    status: "queued",
    point_in_time: input.pointInTime ?? null,
    target_scope: input.targetScope ?? null,
    requested_by: input.requestedBy ?? null,
    correlation_id: input.correlationId ?? null,
    metadata: input.metadata ?? {},
    started_at: new Date().toISOString(),
  }).select("*").single();
  if (error) throw new Error(error.message);
  return mapRestore(data as Record<string, unknown>);
}
