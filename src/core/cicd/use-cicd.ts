import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  cicdApprovalDecide,
  cicdArtifactRecord,
  cicdBuildRecord,
  cicdDeployRecord,
  cicdDeployRollback,
  cicdEnvironmentDelete,
  cicdEnvironmentUpsert,
  cicdPipelineDelete,
  cicdPipelineUpsert,
  cicdReleaseDelete,
  cicdReleaseUpsert,
} from "./cicd.functions";
import { cicdKeys, cicdSnapshotQuery } from "./queries";
import type {
  ArtifactKind,
  BuildStatus,
  BuildTrigger,
  DeployStatus,
  DeployStrategy,
  EnvironmentKind,
  PipelineProvider,
  PipelineStage,
  ReleaseChannel,
} from "./types";

export function useCicdSnapshot() {
  return useSuspenseQuery(cicdSnapshotQuery());
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: cicdKeys.all });
}

export type EnvironmentInput = {
  id?: string;
  slug: string;
  name: string;
  kind: EnvironmentKind;
  url?: string | null;
  protected?: boolean;
  requiresApproval?: boolean;
};

export function useUpsertEnvironment() {
  const fn = useServerFn(cicdEnvironmentUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: EnvironmentInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteEnvironment() {
  const fn = useServerFn(cicdEnvironmentDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export type PipelineInput = {
  id?: string;
  slug: string;
  name: string;
  module?: string | null;
  provider?: PipelineProvider;
  stages?: PipelineStage[];
  enabled?: boolean;
  description?: string | null;
};

export function useUpsertPipeline() {
  const fn = useServerFn(cicdPipelineUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: PipelineInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePipeline() {
  const fn = useServerFn(cicdPipelineDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export type BuildInput = {
  pipelineSlug: string;
  pipelineId?: string | null;
  version?: string | null;
  commitSha?: string | null;
  branch?: string | null;
  trigger?: BuildTrigger;
  status?: BuildStatus;
  durationMs?: number | null;
  logsUrl?: string | null;
  correlationId?: string | null;
};

export function useRecordBuild() {
  const fn = useServerFn(cicdBuildRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: BuildInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export type DeployInput = {
  environmentSlug: string;
  buildId?: string | null;
  environmentId?: string | null;
  version?: string | null;
  status?: DeployStatus;
  strategy?: DeployStrategy;
  durationMs?: number | null;
  correlationId?: string | null;
};

export function useRecordDeploy() {
  const fn = useServerFn(cicdDeployRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: DeployInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useRollbackDeploy() {
  const fn = useServerFn(cicdDeployRollback);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export type ReleaseInput = {
  id?: string;
  version: string;
  channel?: ReleaseChannel;
  tag?: string | null;
  changelog?: string | null;
  notes?: string | null;
  buildId?: string | null;
  publish?: boolean;
};

export function useUpsertRelease() {
  const fn = useServerFn(cicdReleaseUpsert);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ReleaseInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteRelease() {
  const fn = useServerFn(cicdReleaseDelete);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => invalidate(),
  });
}

export type ArtifactInput = {
  buildId?: string | null;
  releaseId?: string | null;
  kind: ArtifactKind;
  name: string;
  uri?: string | null;
  sizeBytes?: number | null;
  checksum?: string | null;
  contentType?: string | null;
};

export function useRecordArtifact() {
  const fn = useServerFn(cicdArtifactRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ArtifactInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}

export type ApprovalDecisionInput = {
  id: string;
  status: "approved" | "rejected";
  reason?: string | null;
};

export function useDecideApproval() {
  const fn = useServerFn(cicdApprovalDecide);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ApprovalDecisionInput) => fn({ data } as never),
    onSuccess: () => invalidate(),
  });
}
