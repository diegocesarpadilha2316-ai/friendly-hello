// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = Record<string, any>;

export type JobStatus =
  | "queued"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "canceled"
  | "dead";

export type JobPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Job {
  id: string;
  companyId: string;
  queue: string;
  kind: string;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  progress: number;
  timeoutMs: number;
  payload: JsonRecord;
  result: JsonRecord;
  error: string | null;
  correlationId: string | null;
  parentJobId: string | null;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  heartbeatAt: string | null;
  workerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobQueue {
  id: string;
  name: string;
  concurrency: number;
  paused: boolean;
  rateLimitPerMin: number | null;
}

export interface CronJob {
  id: string;
  name: string;
  cronExpr: string;
  kind: string;
  queue: string;
  payload: JsonRecord;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface JobLogEntry {
  id: string;
  jobId: string | null;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  createdAt: string;
}

export interface JobHistoryEntry {
  id: string;
  jobId: string;
  kind: string;
  status: JobStatus;
  durationMs: number | null;
  attempts: number;
  error: string | null;
  finishedAt: string;
}

export interface JobMetricBucket {
  id: string;
  queue: string;
  bucket: string;
  jobsCompleted: number;
  jobsFailed: number;
  jobsRetried: number;
  avgDurationMs: number;
  p95DurationMs: number;
}

export interface WorkerNode {
  id: string;
  name: string;
  hostname: string | null;
  region: string | null;
  status: "idle" | "busy" | "offline" | "draining";
  capacity: number;
  runningJobs: number;
  lastHeartbeatAt: string;
}

export interface DistributedLock {
  id: string;
  key: string;
  owner: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface DeadLetterEntry {
  id: string;
  jobId: string;
  kind: string;
  attempts: number;
  error: string | null;
  movedAt: string;
}

export interface RetryEntry {
  id: string;
  jobId: string;
  attempt: number;
  nextRunAt: string;
  reason: string | null;
}

export interface JobsSnapshot {
  jobs: readonly Job[];
  queues: readonly JobQueue[];
  crons: readonly CronJob[];
  history: readonly JobHistoryEntry[];
  metrics: readonly JobMetricBucket[];
  workers: readonly WorkerNode[];
  locks: readonly DistributedLock[];
  deadLetter: readonly DeadLetterEntry[];
  retries: readonly RetryEntry[];
}

export interface EnqueueJobInput {
  kind: string;
  queue?: string;
  priority?: number;
  maxAttempts?: number;
  timeoutMs?: number;
  payload?: JsonRecord;
  correlationId?: string;
  parentJobId?: string;
  scheduledAt?: string;
}