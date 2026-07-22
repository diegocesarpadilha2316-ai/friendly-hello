export type EnvironmentKind = "local" | "development" | "staging" | "production" | "preview";
export type PipelineProvider =
  | "internal" | "github_actions" | "gitlab_ci" | "azure_devops" | "jenkins"
  | "vercel" | "cloudflare" | "supabase" | "docker" | "kubernetes" | "custom";
export type BuildTrigger =
  | "manual" | "push" | "pr" | "tag" | "cron" | "event" | "webhook" | "rollback";
export type BuildStatus =
  | "queued" | "running" | "passed" | "failed" | "cancelled" | "skipped";
export type DeployStatus =
  | "queued" | "running" | "succeeded" | "failed" | "cancelled" | "rolled_back";
export type DeployStrategy = "rolling" | "blue_green" | "canary" | "recreate" | "preview";
export type ReleaseChannel = "stable" | "beta" | "alpha" | "preview" | "hotfix";
export type ArtifactKind = "asset" | "log" | "package" | "container" | "export" | "snapshot" | "other";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface PipelineStage {
  key: string;
  name: string;
  kind:
    | "build" | "test" | "quality" | "security" | "performance"
    | "deploy" | "release" | "rollback" | "custom";
  enabled?: boolean;
}

export interface Environment {
  id: string;
  slug: string;
  name: string;
  kind: EnvironmentKind;
  url: string | null;
  protected: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  slug: string;
  name: string;
  module: string | null;
  provider: PipelineProvider;
  stages: PipelineStage[];
  enabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: string;
  pipelineId: string | null;
  pipelineSlug: string;
  version: string | null;
  commitSha: string | null;
  branch: string | null;
  trigger: BuildTrigger;
  status: BuildStatus;
  durationMs: number | null;
  logsUrl: string | null;
  correlationId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface Deploy {
  id: string;
  buildId: string | null;
  environmentId: string | null;
  environmentSlug: string;
  version: string | null;
  status: DeployStatus;
  strategy: DeployStrategy;
  approvedBy: string | null;
  approvedAt: string | null;
  rollbackOf: string | null;
  durationMs: number | null;
  correlationId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface Release {
  id: string;
  version: string;
  channel: ReleaseChannel;
  tag: string | null;
  changelog: string | null;
  notes: string | null;
  buildId: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface Artifact {
  id: string;
  buildId: string | null;
  releaseId: string | null;
  kind: ArtifactKind;
  name: string;
  uri: string | null;
  sizeBytes: number | null;
  checksum: string | null;
  contentType: string | null;
  createdAt: string;
}

export interface Approval {
  id: string;
  deployId: string;
  requestedBy: string | null;
  approver: string | null;
  status: ApprovalStatus;
  reason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface CicdHistoryPoint {
  id: string;
  bucketAt: string;
  builds: number;
  deploys: number;
  rollbacks: number;
  failed: number;
  avgDurationMs: number | null;
}

export interface CicdHealth {
  totalPipelines: number;
  enabledPipelines: number;
  totalBuilds: number;
  buildSuccessRate: number;
  totalDeploys: number;
  deploySuccessRate: number;
  activeEnvironments: number;
  pendingApprovals: number;
  lastReleaseVersion: string | null;
  lastReleaseAt: string | null;
}

export interface CicdSnapshot {
  environments: Environment[];
  pipelines: Pipeline[];
  builds: Build[];
  deploys: Deploy[];
  releases: Release[];
  artifacts: Artifact[];
  approvals: Approval[];
  history: CicdHistoryPoint[];
  health: CicdHealth;
}
