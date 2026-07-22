export type TargetKind =
  | "database" | "storage" | "assets" | "configuration" | "sdk"
  | "plugins" | "cache" | "logs" | "events" | "notifications";

export type Destination =
  | "internal" | "s3" | "r2" | "gcs" | "azure_blob" | "b2" | "supabase_pitr";

export type BackupStrategy = "full" | "incremental" | "differential";
export type BackupTrigger = "manual" | "scheduled" | "event" | "disaster";
export type BackupStatus =
  | "queued" | "running" | "completed" | "failed" | "verified" | "expired" | "cancelled";

export type RestoreMode = "full" | "partial" | "tenant" | "pit" | "snapshot";
export type RestoreStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type SnapshotScope = "tenant" | "module" | "table" | "file";

export type IntegrityKind = "checksum" | "restore_test" | "structural" | "deep";
export type IntegrityStatus = "pass" | "fail" | "warn" | "unknown";

export type Replication = "none" | "async" | "sync" | "multi_region";
export type Failover = "manual" | "automatic" | "warm_standby" | "pilot_light";
export type DrPlanStatus = "draft" | "active" | "testing" | "failing" | "archived";

export interface Target {
  id: string; slug: string; name: string;
  kind: TargetKind; destination: Destination;
  retentionDays: number; encryption: string; enabled: boolean;
  createdAt: string; updatedAt: string;
}

export interface Schedule {
  id: string; targetId: string; cron: string;
  strategy: BackupStrategy; enabled: boolean;
  nextRunAt: string | null; lastRunAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface Backup {
  id: string; targetId: string | null; targetSlug: string; kind: TargetKind;
  strategy: BackupStrategy; trigger: BackupTrigger; status: BackupStatus;
  sizeBytes: number | null; checksum: string | null; storageUri: string | null;
  parentBackupId: string | null; correlationId: string | null;
  startedAt: string | null; finishedAt: string | null; expiresAt: string | null;
  createdAt: string;
}

export interface Snapshot {
  id: string; backupId: string | null;
  scope: SnapshotScope; target: string; version: string | null;
  sizeBytes: number | null; checksum: string | null; storageUri: string | null;
  createdAt: string;
}

export interface Restore {
  id: string; backupId: string | null; snapshotId: string | null;
  mode: RestoreMode; status: RestoreStatus;
  pointInTime: string | null; targetScope: string | null;
  requestedBy: string | null; correlationId: string | null;
  startedAt: string | null; finishedAt: string | null;
  createdAt: string;
}

export interface IntegrityCheck {
  id: string; backupId: string;
  checkKind: IntegrityKind; status: IntegrityStatus;
  detail: string | null; durationMs: number | null; checkedAt: string;
}

export interface DrPlan {
  id: string; slug: string; name: string;
  rtoMinutes: number; rpoMinutes: number;
  replication: Replication; failover: Failover;
  status: DrPlanStatus;
  lastDrillAt: string | null; lastDrillStatus: string | null;
  createdAt: string; updatedAt: string;
}

export interface RecoveryHistoryPoint {
  id: string; bucketAt: string;
  backups: number; restores: number; failed: number; verified: number;
  bytes: number;
}

export interface RecoveryHealth {
  totalTargets: number; enabledTargets: number;
  totalBackups: number; verifiedBackups: number;
  totalRestores: number; restoreSuccessRate: number;
  activeSchedules: number; failingPlans: number;
  lastBackupAt: string | null; lastRestoreAt: string | null;
  totalBytes: number;
}

export interface RecoverySnapshot {
  targets: Target[]; schedules: Schedule[];
  backups: Backup[]; snapshots: Snapshot[];
  restores: Restore[]; integrity: IntegrityCheck[];
  plans: DrPlan[]; history: RecoveryHistoryPoint[];
  health: RecoveryHealth;
}
