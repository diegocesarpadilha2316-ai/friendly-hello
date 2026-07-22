import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  recoveryBackupRecord, recoveryIntegrityRecord, recoveryPlanDelete,
  recoveryPlanDrill, recoveryPlanUpsert, recoveryRestoreRun,
  recoveryScheduleDelete, recoveryScheduleUpsert, recoverySnapshotRecord,
  recoveryTargetDelete, recoveryTargetUpsert,
} from "./recovery.functions";
import { recoveryKeys, recoverySnapshotQuery } from "./queries";
import type {
  BackupStatus, BackupStrategy, BackupTrigger, Destination, Failover,
  IntegrityKind, IntegrityStatus, Replication, RestoreMode,
  SnapshotScope, TargetKind,
} from "./types";

export function useRecoverySnapshot() {
  return useSuspenseQuery(recoverySnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: recoveryKeys.all });
}

export type TargetInput = {
  id?: string; slug: string; name: string; kind: TargetKind;
  destination?: Destination; retentionDays?: number; encryption?: string;
  enabled?: boolean; metadata?: Record<string, unknown>;
};

export function useUpsertTarget() {
  const fn = useServerFn(recoveryTargetUpsert); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: TargetInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export function useDeleteTarget() {
  const fn = useServerFn(recoveryTargetDelete); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => fn({ data: { id } }), onSuccess: () => invalidate() });
}

export type ScheduleInput = {
  id?: string; targetId: string; cron: string;
  strategy?: BackupStrategy; enabled?: boolean; nextRunAt?: string | null;
};

export function useUpsertSchedule() {
  const fn = useServerFn(recoveryScheduleUpsert); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: ScheduleInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export function useDeleteSchedule() {
  const fn = useServerFn(recoveryScheduleDelete); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => fn({ data: { id } }), onSuccess: () => invalidate() });
}

export type BackupInput = {
  targetSlug: string; kind: TargetKind; targetId?: string | null;
  strategy?: BackupStrategy; trigger?: BackupTrigger; status?: BackupStatus;
  sizeBytes?: number | null; checksum?: string | null; storageUri?: string | null;
  parentBackupId?: string | null; correlationId?: string | null;
  expiresAt?: string | null; metadata?: Record<string, unknown>;
};

export function useRecordBackup() {
  const fn = useServerFn(recoveryBackupRecord); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: BackupInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export type SnapshotInput = {
  scope?: SnapshotScope; target: string; backupId?: string | null;
  version?: string | null; sizeBytes?: number | null;
  checksum?: string | null; storageUri?: string | null;
  metadata?: Record<string, unknown>;
};

export function useRecordSnapshot() {
  const fn = useServerFn(recoverySnapshotRecord); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: SnapshotInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export type RestoreInput = {
  mode: RestoreMode; backupId?: string | null; snapshotId?: string | null;
  pointInTime?: string | null; targetScope?: string | null;
  correlationId?: string | null; metadata?: Record<string, unknown>;
};

export function useRunRestore() {
  const fn = useServerFn(recoveryRestoreRun); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: RestoreInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export type IntegrityInput = {
  backupId: string; checkKind?: IntegrityKind; status: IntegrityStatus;
  detail?: string | null; durationMs?: number | null;
};

export function useRecordIntegrity() {
  const fn = useServerFn(recoveryIntegrityRecord); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: IntegrityInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export type PlanInput = {
  id?: string; slug: string; name: string;
  rtoMinutes?: number; rpoMinutes?: number;
  replication?: Replication; failover?: Failover;
  status?: "draft" | "active" | "testing" | "failing" | "archived";
  metadata?: Record<string, unknown>;
};

export function useUpsertPlan() {
  const fn = useServerFn(recoveryPlanUpsert); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (data: PlanInput) => fn({ data } as never), onSuccess: () => invalidate() });
}

export function useDeletePlan() {
  const fn = useServerFn(recoveryPlanDelete); const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => fn({ data: { id } }), onSuccess: () => invalidate() });
}

export function useRunDrill() {
  const fn = useServerFn(recoveryPlanDrill); const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: { id: string; status?: "success" | "partial" | "failed" }) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}
