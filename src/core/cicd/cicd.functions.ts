import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import {
  computeHealth,
  mapApproval,
  mapArtifact,
  mapBuild,
  mapDeploy,
  mapEnvironment,
  mapHistory,
  mapPipeline,
  mapRelease,
  rollbackDeploy,
} from "./manager.server";
import type { CicdSnapshot } from "./types";

export const cicdSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<CicdSnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [envs, pipes, builds, deploys, releases, artifacts, approvals, history] =
      await Promise.all([
        s.from("cicd_environments").select("*").eq("company_id", t).order("kind").limit(100),
        s
          .from("cicd_pipelines")
          .select("*")
          .eq("company_id", t)
          .order("updated_at", { ascending: false })
          .limit(100),
        s
          .from("cicd_builds")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("cicd_deploys")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("cicd_releases")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(50),
        s
          .from("cicd_artifacts")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(200),
        s
          .from("cicd_approvals")
          .select("*")
          .eq("company_id", t)
          .order("created_at", { ascending: false })
          .limit(100),
        s
          .from("cicd_history")
          .select("*")
          .eq("company_id", t)
          .order("bucket_at", { ascending: false })
          .limit(120),
      ]);
    const environments = (envs.data ?? []).map(mapEnvironment);
    const pipelines = (pipes.data ?? []).map(mapPipeline);
    const buildList = (builds.data ?? []).map(mapBuild);
    const deployList = (deploys.data ?? []).map(mapDeploy);
    const releaseList = (releases.data ?? []).map(mapRelease);
    const approvalList = (approvals.data ?? []).map(mapApproval);
    return {
      environments,
      pipelines,
      builds: buildList,
      deploys: deployList,
      releases: releaseList,
      artifacts: (artifacts.data ?? []).map(mapArtifact),
      approvals: approvalList,
      history: (history.data ?? []).map(mapHistory),
      health: computeHealth({
        environments,
        pipelines,
        builds: buildList,
        deploys: deployList,
        releases: releaseList,
        approvals: approvalList,
      }),
    };
  });

const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_.:-]+$/i, "slug inválido");
const id = z.object({ id: z.string().uuid() });

const envSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().min(1).max(160),
  kind: z.enum(["local", "development", "staging", "production", "preview"]),
  url: z.string().url().nullish(),
  protected: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
});

export const cicdEnvironmentUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => envSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      kind: data.kind,
      url: data.url ?? null,
      protected: data.protected,
      requires_approval: data.requiresApproval,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("cicd_environments")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("cicd_environments")
          .upsert(payload, { onConflict: "company_id,slug" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapEnvironment(row as Record<string, unknown>);
  });

export const cicdEnvironmentDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => id.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("cicd_environments")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

const pipelineSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().min(1).max(160),
  module: z.string().max(120).nullish(),
  provider: z
    .enum([
      "internal",
      "github_actions",
      "gitlab_ci",
      "azure_devops",
      "jenkins",
      "vercel",
      "cloudflare",
      "supabase",
      "docker",
      "kubernetes",
      "custom",
    ])
    .default("internal"),
  stages: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        name: z.string().min(1).max(120),
        kind: z.enum([
          "build",
          "test",
          "quality",
          "security",
          "performance",
          "deploy",
          "release",
          "rollback",
          "custom",
        ]),
        enabled: z.boolean().optional(),
      }),
    )
    .default([]),
  enabled: z.boolean().default(true),
  description: z.string().max(500).nullish(),
});

export const cicdPipelineUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => pipelineSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      slug: data.slug,
      name: data.name,
      module: data.module ?? null,
      provider: data.provider,
      stages: data.stages,
      enabled: data.enabled,
      description: data.description ?? null,
      updated_at: new Date().toISOString(),
    };
    const q = data.id
      ? context.supabase
          .from("cicd_pipelines")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("cicd_pipelines")
          .upsert(payload, { onConflict: "company_id,slug" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapPipeline(row as Record<string, unknown>);
  });

export const cicdPipelineDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => id.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("cicd_pipelines")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

const buildSchema = z.object({
  pipelineSlug: z.string().min(1),
  pipelineId: z.string().uuid().nullish(),
  version: z.string().max(80).nullish(),
  commitSha: z.string().max(64).nullish(),
  branch: z.string().max(120).nullish(),
  trigger: z
    .enum(["manual", "push", "pr", "tag", "cron", "event", "webhook", "rollback"])
    .default("manual"),
  status: z
    .enum(["queued", "running", "passed", "failed", "cancelled", "skipped"])
    .default("passed"),
  durationMs: z.number().int().min(0).nullish(),
  logsUrl: z.string().url().nullish(),
  correlationId: z.string().max(120).nullish(),
});

export const cicdBuildRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => buildSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    const finished = data.status === "queued" || data.status === "running" ? null : now;
    const { data: row, error } = await context.supabase
      .from("cicd_builds")
      .insert({
        company_id: context.tenantId,
        pipeline_id: data.pipelineId ?? null,
        pipeline_slug: data.pipelineSlug,
        version: data.version ?? null,
        commit_sha: data.commitSha ?? null,
        branch: data.branch ?? null,
        trigger: data.trigger,
        status: data.status,
        duration_ms: data.durationMs ?? null,
        logs_url: data.logsUrl ?? null,
        correlation_id: data.correlationId ?? null,
        started_at: now,
        finished_at: finished,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapBuild(row as Record<string, unknown>);
  });

const deploySchema = z.object({
  buildId: z.string().uuid().nullish(),
  environmentSlug: z.string().min(1),
  environmentId: z.string().uuid().nullish(),
  version: z.string().max(80).nullish(),
  status: z
    .enum(["queued", "running", "succeeded", "failed", "cancelled", "rolled_back"])
    .default("succeeded"),
  strategy: z.enum(["rolling", "blue_green", "canary", "recreate", "preview"]).default("rolling"),
  durationMs: z.number().int().min(0).nullish(),
  correlationId: z.string().max(120).nullish(),
});

export const cicdDeployRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => deploySchema.parse(raw))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    const finished = data.status === "queued" || data.status === "running" ? null : now;
    const { data: row, error } = await context.supabase
      .from("cicd_deploys")
      .insert({
        company_id: context.tenantId,
        build_id: data.buildId ?? null,
        environment_id: data.environmentId ?? null,
        environment_slug: data.environmentSlug,
        version: data.version ?? null,
        status: data.status,
        strategy: data.strategy,
        duration_ms: data.durationMs ?? null,
        correlation_id: data.correlationId ?? null,
        started_at: now,
        finished_at: finished,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapDeploy(row as Record<string, unknown>);
  });

export const cicdDeployRollback = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => id.parse(raw))
  .handler(async ({ context, data }) => {
    return rollbackDeploy(context.supabase, context.tenantId, data.id);
  });

const releaseSchema = z.object({
  id: z.string().uuid().optional(),
  version: z.string().min(1).max(80),
  channel: z.enum(["stable", "beta", "alpha", "preview", "hotfix"]).default("stable"),
  tag: z.string().max(120).nullish(),
  changelog: z.string().max(20000).nullish(),
  notes: z.string().max(20000).nullish(),
  buildId: z.string().uuid().nullish(),
  publish: z.boolean().default(false),
});

export const cicdReleaseUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => releaseSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const payload = {
      company_id: context.tenantId,
      version: data.version,
      channel: data.channel,
      tag: data.tag ?? null,
      changelog: data.changelog ?? null,
      notes: data.notes ?? null,
      build_id: data.buildId ?? null,
      published_at: data.publish ? new Date().toISOString() : null,
    };
    const q = data.id
      ? context.supabase
          .from("cicd_releases")
          .update(payload)
          .eq("id", data.id)
          .eq("company_id", context.tenantId)
          .select("*")
          .single()
      : context.supabase
          .from("cicd_releases")
          .upsert(payload, { onConflict: "company_id,version" })
          .select("*")
          .single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapRelease(row as Record<string, unknown>);
  });

export const cicdReleaseDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => id.parse(raw))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("cicd_releases")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    return { ok: true as const };
  });

const artifactSchema = z.object({
  buildId: z.string().uuid().nullish(),
  releaseId: z.string().uuid().nullish(),
  kind: z.enum(["asset", "log", "package", "container", "export", "snapshot", "other"]),
  name: z.string().min(1).max(240),
  uri: z.string().max(800).nullish(),
  sizeBytes: z.number().int().min(0).nullish(),
  checksum: z.string().max(160).nullish(),
  contentType: z.string().max(160).nullish(),
});

export const cicdArtifactRecord = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => artifactSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("cicd_artifacts")
      .insert({
        company_id: context.tenantId,
        build_id: data.buildId ?? null,
        release_id: data.releaseId ?? null,
        kind: data.kind,
        name: data.name,
        uri: data.uri ?? null,
        size_bytes: data.sizeBytes ?? null,
        checksum: data.checksum ?? null,
        content_type: data.contentType ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapArtifact(row as Record<string, unknown>);
  });

const approvalDecisionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).nullish(),
});

export const cicdApprovalDecide = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => approvalDecisionSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("cicd_approvals")
      .update({
        status: data.status,
        reason: data.reason ?? null,
        approver: context.userId ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("company_id", context.tenantId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapApproval(row as Record<string, unknown>);
  });
