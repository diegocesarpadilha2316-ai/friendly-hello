/**
 * StorageManager — orquestrador único de Storage/Uploads/Assets.
 * Nenhum módulo instancia providers ou grava em storage.objects diretamente.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ASSETS_CONFIG, classifyMime } from "./config";
import { StorageRegistry } from "./registry.server";
import { enqueueProcessing } from "./pipeline/processor.server";
import {
  StorageError,
  type Asset,
  type AssetVisibility,
  type SignedUrl,
  type StorageProviderId,
  type StorageStats,
  type UploadJob,
} from "./types";

interface Ctx {
  supabase: SupabaseClient;
  tenantId: string;
  userId: string;
}

function buildObjectKey(tenantId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]+/g, "_").slice(-180);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${tenantId}/${stamp}-${rand}-${safe}`;
}

function validateMime(mime: string) {
  if (!ASSETS_CONFIG.mime.allowlist.includes(mime)) {
    throw new StorageError(`MIME não permitido: ${mime}`, "unsupported_mime");
  }
}
function validateSize(sizeBytes: number) {
  if (sizeBytes <= 0) throw new StorageError("sizeBytes inválido", "invalid_request");
  if (sizeBytes > ASSETS_CONFIG.maxFileSizeBytes) {
    throw new StorageError("Arquivo excede tamanho máximo", "size_exceeded");
  }
}
function provider(id?: StorageProviderId) {
  const p = StorageRegistry.get(id ?? ASSETS_CONFIG.defaultProvider);
  if (!p || !p.enabled)
    throw new StorageError(`Provider indisponível: ${id ?? "default"}`, "provider_error", id);
  return p;
}
async function auditLog(
  ctx: Ctx,
  action: string,
  assetId: string | null,
  detail: Record<string, unknown>,
) {
  if (!ASSETS_CONFIG.featureFlags.audit) return;
  await ctx.supabase.from("asset_audit").insert({
    company_id: ctx.tenantId,
    asset_id: assetId,
    actor_id: ctx.userId,
    action,
    detail,
  });
}
async function ensureQuota(ctx: Ctx, extraBytes: number) {
  const { data } = await ctx.supabase.rpc("tenant_storage_bytes", { _company: ctx.tenantId });
  const used = typeof data === "number" ? data : 0;
  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("plan_key")
    .eq("company_id", ctx.tenantId)
    .maybeSingle();
  const planKey = (sub?.plan_key as keyof typeof ASSETS_CONFIG.quotaBytesPerPlan) ?? "free";
  const quota = ASSETS_CONFIG.quotaBytesPerPlan[planKey] ?? null;
  if (quota != null && used + extraBytes > quota) {
    throw new StorageError("Quota de armazenamento excedida para o plano", "quota_exceeded");
  }
}

export const StorageManager = {
  async createUpload(
    ctx: Ctx,
    input: {
      filename: string;
      mime: string;
      sizeBytes: number;
      folderId?: string | null;
      visibility?: AssetVisibility;
      providerId?: StorageProviderId;
    },
  ): Promise<{ job: UploadJob; upload: SignedUrl; asset: Asset }> {
    validateMime(input.mime);
    validateSize(input.sizeBytes);
    await ensureQuota(ctx, input.sizeBytes);

    const p = provider(input.providerId);
    const objectKey = buildObjectKey(ctx.tenantId, input.filename);
    const bucket = ASSETS_CONFIG.defaultBucket;

    const { data: assetRow, error: assetErr } = await ctx.supabase
      .from("assets")
      .insert({
        company_id: ctx.tenantId,
        folder_id: input.folderId ?? null,
        provider: p.id,
        bucket,
        object_key: objectKey,
        filename: input.filename,
        mime: input.mime,
        kind: classifyMime(input.mime),
        visibility: input.visibility ?? "tenant",
        size_bytes: input.sizeBytes,
        created_by: ctx.userId,
      })
      .select("*")
      .single();
    if (assetErr || !assetRow)
      throw new StorageError(assetErr?.message ?? "asset insert failed", "provider_error");

    const { data: jobRow, error: jobErr } = await ctx.supabase
      .from("upload_jobs")
      .insert({
        company_id: ctx.tenantId,
        asset_id: assetRow.id,
        provider: p.id,
        bucket,
        object_key: objectKey,
        filename: input.filename,
        mime: input.mime,
        size_bytes: input.sizeBytes,
        status: "pending",
        created_by: ctx.userId,
      })
      .select("*")
      .single();
    if (jobErr || !jobRow)
      throw new StorageError(jobErr?.message ?? "upload job insert failed", "provider_error");

    const upload = await p.createSignedUploadUrl({
      bucket,
      objectKey,
      mime: input.mime,
      sizeBytes: input.sizeBytes,
    });

    await auditLog(ctx, "asset:upload_created", assetRow.id as string, {
      objectKey,
      size: input.sizeBytes,
    });

    return { job: mapJob(jobRow), upload, asset: mapAsset(assetRow) };
  },

  async completeUpload(ctx: Ctx, jobId: string): Promise<Asset> {
    const { data: job } = await ctx.supabase
      .from("upload_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("company_id", ctx.tenantId)
      .maybeSingle();
    if (!job) throw new StorageError("upload job not found", "not_found");

    const p = provider(job.provider as StorageProviderId);
    const head = await p.headObject({ bucket: job.bucket, objectKey: job.object_key });
    if (!head) throw new StorageError("Objeto não encontrado no provider", "not_found");

    await ctx.supabase
      .from("upload_jobs")
      .update({
        status: "processing",
        bytes_uploaded: head.sizeBytes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    const { data: asset } = await ctx.supabase
      .from("assets")
      .update({ size_bytes: head.sizeBytes, updated_at: new Date().toISOString() })
      .eq("id", job.asset_id)
      .select("*")
      .single();
    if (!asset) throw new StorageError("asset not found after upload", "not_found");

    await enqueueProcessing({ id: asset.id as string, kind: asset.kind as Asset["kind"] });

    await ctx.supabase
      .from("upload_jobs")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    await auditLog(ctx, "asset:upload_completed", asset.id as string, {
      jobId,
      size: head.sizeBytes,
    });
    return mapAsset(asset);
  },

  async signDownload(
    ctx: Ctx,
    assetId: string,
    opts: { downloadName?: string; expiresInSec?: number } = {},
  ): Promise<SignedUrl> {
    const { data: asset } = await ctx.supabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .eq("company_id", ctx.tenantId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!asset) throw new StorageError("Asset não encontrado", "not_found");
    const p = provider(asset.provider as StorageProviderId);
    const signed = await p.createSignedDownloadUrl({
      bucket: asset.bucket,
      objectKey: asset.object_key,
      expiresInSec: opts.expiresInSec,
      downloadName: opts.downloadName ?? asset.filename,
    });
    await auditLog(ctx, "asset:download_signed", assetId, { ttl: opts.expiresInSec ?? null });
    return signed;
  },

  async softDelete(ctx: Ctx, assetId: string): Promise<void> {
    const { error } = await ctx.supabase
      .from("assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", assetId)
      .eq("company_id", ctx.tenantId);
    if (error) throw new StorageError(error.message, "provider_error");
    await auditLog(ctx, "asset:soft_delete", assetId, {});
  },

  async restore(ctx: Ctx, assetId: string): Promise<void> {
    const { error } = await ctx.supabase
      .from("assets")
      .update({ deleted_at: null })
      .eq("id", assetId)
      .eq("company_id", ctx.tenantId);
    if (error) throw new StorageError(error.message, "provider_error");
    await auditLog(ctx, "asset:restore", assetId, {});
  },

  async hardDelete(ctx: Ctx, assetId: string): Promise<void> {
    const { data: asset } = await ctx.supabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .eq("company_id", ctx.tenantId)
      .maybeSingle();
    if (!asset) return;
    const p = provider(asset.provider as StorageProviderId);
    await p.deleteObject({ bucket: asset.bucket, objectKey: asset.object_key });
    await ctx.supabase.from("assets").delete().eq("id", assetId);
    await auditLog(ctx, "asset:hard_delete", assetId, { objectKey: asset.object_key });
  },

  async stats(ctx: Ctx): Promise<StorageStats> {
    const { data: used } = await ctx.supabase.rpc("tenant_storage_bytes", {
      _company: ctx.tenantId,
    });
    const { count } = await ctx.supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.tenantId)
      .is("deleted_at", null);
    const { data: sub } = await ctx.supabase
      .from("subscriptions")
      .select("plan_key")
      .eq("company_id", ctx.tenantId)
      .maybeSingle();
    const planKey = (sub?.plan_key as keyof typeof ASSETS_CONFIG.quotaBytesPerPlan) ?? "free";
    return {
      usedBytes: typeof used === "number" ? used : 0,
      assetCount: count ?? 0,
      quotaBytes: ASSETS_CONFIG.quotaBytesPerPlan[planKey] ?? null,
    };
  },
};

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    folderId: (row.folder_id as string | null) ?? null,
    provider: row.provider as StorageProviderId,
    bucket: row.bucket as string,
    objectKey: row.object_key as string,
    filename: row.filename as string,
    mime: row.mime as string,
    kind: row.kind as Asset["kind"],
    visibility: row.visibility as AssetVisibility,
    sizeBytes: (row.size_bytes as number) ?? 0,
    sha256: (row.sha256 as string | null) ?? null,
    width: (row.width as number | null) ?? null,
    height: (row.height as number | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    metadata: (row.metadata as Asset["metadata"]) ?? {},
    deletedAt: (row.deleted_at as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
function mapJob(row: Record<string, unknown>): UploadJob {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    assetId: (row.asset_id as string | null) ?? null,
    status: row.status as UploadJob["status"],
    provider: row.provider as StorageProviderId,
    bucket: row.bucket as string,
    objectKey: row.object_key as string,
    filename: row.filename as string,
    mime: row.mime as string,
    sizeBytes: (row.size_bytes as number) ?? 0,
    bytesUploaded: (row.bytes_uploaded as number) ?? 0,
    partsTotal: (row.parts_total as number | null) ?? null,
    partsDone: (row.parts_done as number) ?? 0,
    error: (row.error as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
