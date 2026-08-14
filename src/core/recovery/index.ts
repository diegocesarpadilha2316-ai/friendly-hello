/**
 * Fase 1.20 — Backup, Disaster Recovery & Business Continuity
 * RecoveryManager único: backups, snapshots, restore, PITR, integridade,
 * planos de DR e histórico. Reutiliza Auth, Tenant, RBAC, Storage,
 * Jobs, Observability, Security, CI/CD, Notifications, Event Center e
 * API Gateway — sem motores paralelos.
 */
export * from "./types";
export { recoveryKeys, recoverySnapshotQuery } from "./queries";
export {
  useRecoverySnapshot,
  useUpsertTarget,
  useDeleteTarget,
  useUpsertSchedule,
  useDeleteSchedule,
  useRecordBackup,
  useRecordSnapshot,
  useRunRestore,
  useRecordIntegrity,
  useUpsertPlan,
  useDeletePlan,
  useRunDrill,
  type TargetInput,
  type ScheduleInput,
  type BackupInput,
  type SnapshotInput,
  type RestoreInput,
  type IntegrityInput,
  type PlanInput,
} from "./use-recovery";
