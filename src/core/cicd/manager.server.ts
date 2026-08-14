import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Approval,
  Artifact,
  Build,
  CicdHealth,
  CicdHistoryPoint,
  Deploy,
  Environment,
  Pipeline,
  PipelineStage,
  Release,
} from "./types";

/**
 * CIManager (server-side) — Único ponto de gestão de pipelines, builds,
 * deploys, releases, artefatos, aprovações e ambientes. Reutilizado por
 * Core, Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.
 * Não introduz motor paralelo: apenas persiste + emite auditoria via
 * Observability/EventBus quando invocado pelos Jobs.
 */

export function mapEnvironment(r: Record<string, unknown>): Environment {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    kind: r.kind as Environment["kind"],
    url: (r.url as string | null) ?? null,
    protected: Boolean(r.protected),
    requiresApproval: Boolean(r.requires_approval),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function mapPipeline(r: Record<string, unknown>): Pipeline {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    module: (r.module as string | null) ?? null,
    provider: r.provider as Pipeline["provider"],
    stages: ((r.stages as PipelineStage[] | null) ?? []) as PipelineStage[],
    enabled: Boolean(r.enabled),
    description: (r.description as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export function mapBuild(r: Record<string, unknown>): Build {
  return {
    id: String(r.id),
    pipelineId: (r.pipeline_id as string | null) ?? null,
    pipelineSlug: String(r.pipeline_slug),
    version: (r.version as string | null) ?? null,
    commitSha: (r.commit_sha as string | null) ?? null,
    branch: (r.branch as string | null) ?? null,
    trigger: r.trigger as Build["trigger"],
    status: r.status as Build["status"],
    durationMs: (r.duration_ms as number | null) ?? null,
    logsUrl: (r.logs_url as string | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapDeploy(r: Record<string, unknown>): Deploy {
  return {
    id: String(r.id),
    buildId: (r.build_id as string | null) ?? null,
    environmentId: (r.environment_id as string | null) ?? null,
    environmentSlug: String(r.environment_slug),
    version: (r.version as string | null) ?? null,
    status: r.status as Deploy["status"],
    strategy: r.strategy as Deploy["strategy"],
    approvedBy: (r.approved_by as string | null) ?? null,
    approvedAt: (r.approved_at as string | null) ?? null,
    rollbackOf: (r.rollback_of as string | null) ?? null,
    durationMs: (r.duration_ms as number | null) ?? null,
    correlationId: (r.correlation_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapRelease(r: Record<string, unknown>): Release {
  return {
    id: String(r.id),
    version: String(r.version),
    channel: r.channel as Release["channel"],
    tag: (r.tag as string | null) ?? null,
    changelog: (r.changelog as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    buildId: (r.build_id as string | null) ?? null,
    publishedAt: (r.published_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapArtifact(r: Record<string, unknown>): Artifact {
  return {
    id: String(r.id),
    buildId: (r.build_id as string | null) ?? null,
    releaseId: (r.release_id as string | null) ?? null,
    kind: r.kind as Artifact["kind"],
    name: String(r.name),
    uri: (r.uri as string | null) ?? null,
    sizeBytes: r.size_bytes == null ? null : Number(r.size_bytes),
    checksum: (r.checksum as string | null) ?? null,
    contentType: (r.content_type as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapApproval(r: Record<string, unknown>): Approval {
  return {
    id: String(r.id),
    deployId: String(r.deploy_id),
    requestedBy: (r.requested_by as string | null) ?? null,
    approver: (r.approver as string | null) ?? null,
    status: r.status as Approval["status"],
    reason: (r.reason as string | null) ?? null,
    decidedAt: (r.decided_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export function mapHistory(r: Record<string, unknown>): CicdHistoryPoint {
  return {
    id: String(r.id),
    bucketAt: String(r.bucket_at),
    builds: Number(r.builds ?? 0),
    deploys: Number(r.deploys ?? 0),
    rollbacks: Number(r.rollbacks ?? 0),
    failed: Number(r.failed ?? 0),
    avgDurationMs: r.avg_duration_ms == null ? null : Number(r.avg_duration_ms),
  };
}

export function computeHealth(input: {
  environments: Environment[];
  pipelines: Pipeline[];
  builds: Build[];
  deploys: Deploy[];
  releases: Release[];
  approvals: Approval[];
}): CicdHealth {
  const totalBuilds = input.builds.length;
  const passedBuilds = input.builds.filter((b) => b.status === "passed").length;
  const buildSuccessRate = totalBuilds === 0 ? 100 : Math.round((passedBuilds / totalBuilds) * 100);
  const totalDeploys = input.deploys.length;
  const succeeded = input.deploys.filter((d) => d.status === "succeeded").length;
  const deploySuccessRate = totalDeploys === 0 ? 100 : Math.round((succeeded / totalDeploys) * 100);
  const last = input.releases[0] ?? null;
  return {
    totalPipelines: input.pipelines.length,
    enabledPipelines: input.pipelines.filter((p) => p.enabled).length,
    totalBuilds,
    buildSuccessRate,
    totalDeploys,
    deploySuccessRate,
    activeEnvironments: input.environments.length,
    pendingApprovals: input.approvals.filter((a) => a.status === "pending").length,
    lastReleaseVersion: last?.version ?? null,
    lastReleaseAt: last?.createdAt ?? null,
  };
}

/** Registra rollback como deploy espelho — reutiliza tabela cicd_deploys. */
export async function rollbackDeploy(
  supabase: SupabaseClient,
  tenantId: string,
  deployId: string,
): Promise<Deploy> {
  const { data: target, error: e1 } = await supabase
    .from("cicd_deploys")
    .select("*")
    .eq("company_id", tenantId)
    .eq("id", deployId)
    .single();
  if (e1) throw new Error(e1.message);
  const src = target as Record<string, unknown>;
  const { data: row, error } = await supabase
    .from("cicd_deploys")
    .insert({
      company_id: tenantId,
      build_id: src.build_id ?? null,
      environment_id: src.environment_id ?? null,
      environment_slug: src.environment_slug,
      version: src.version,
      status: "queued",
      strategy: "recreate",
      rollback_of: deployId,
      metadata: { reason: "rollback", from: deployId },
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabase
    .from("cicd_deploys")
    .update({ status: "rolled_back", finished_at: new Date().toISOString() })
    .eq("company_id", tenantId)
    .eq("id", deployId);
  return mapDeploy(row as Record<string, unknown>);
}
