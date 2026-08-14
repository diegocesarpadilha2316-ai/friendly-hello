import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { ASSETS_CONFIG } from "./config";
import type {
  Asset,
  AssetAuditEntry,
  SignedUrl,
  StorageProviderId,
  StorageStats,
  UploadJob,
} from "./types";

const providerEnum = z.enum(["supabase", "r2", "s3", "gcs", "azure", "b2", "local"]);

const createUploadSchema = z.object({
  filename: z.string().min(1).max(240),
  mime: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  folderId: z.string().uuid().optional().nullable(),
  visibility: z.enum(["private", "tenant", "public"]).optional(),
  providerId: providerEnum.optional(),
});

export const assetsCreateUpload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => createUploadSchema.parse(raw))
  .handler(
    async ({ context, data }): Promise<{ job: UploadJob; upload: SignedUrl; asset: Asset }> => {
      const { StorageManager } = await import("./manager.server");
      return StorageManager.createUpload(context, {
        ...data,
        providerId: data.providerId as StorageProviderId | undefined,
      });
    },
  );

export const assetsCompleteUpload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ jobId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<Asset> => {
    const { StorageManager } = await import("./manager.server");
    return StorageManager.completeUpload(context, data.jobId);
  });

export const assetsSignDownload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        assetId: z.string().uuid(),
        downloadName: z.string().max(240).optional(),
        expiresInSec: z
          .number()
          .int()
          .positive()
          .max(60 * 60 * 24)
          .optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }): Promise<SignedUrl> => {
    const { StorageManager } = await import("./manager.server");
    return StorageManager.signDownload(context, data.assetId, {
      downloadName: data.downloadName,
      expiresInSec: data.expiresInSec,
    });
  });

export const assetsSoftDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ assetId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { StorageManager } = await import("./manager.server");
    await StorageManager.softDelete(context, data.assetId);
    return { ok: true };
  });

export const assetsRestore = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ assetId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { StorageManager } = await import("./manager.server");
    await StorageManager.restore(context, data.assetId);
    return { ok: true };
  });

export const assetsHardDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ assetId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { StorageManager } = await import("./manager.server");
    await StorageManager.hardDelete(context, data.assetId);
    return { ok: true };
  });

const listSchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
  includeDeleted: z.boolean().optional(),
  limit: z.number().int().positive().max(200).default(50),
});

export const assetsList = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => listSchema.parse(raw ?? {}))
  .handler(async ({ context, data }): Promise<readonly Asset[]> => {
    let q = context.supabase
      .from("assets")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.folderId !== undefined) q = q.eq("folder_id", data.folderId);
    if (!data.includeDeleted) q = q.is("deleted_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapAssetRow);
  });

export const assetsStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<StorageStats> => {
    const { StorageManager } = await import("./manager.server");
    return StorageManager.stats(context);
  });

export const assetsListJobs = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly UploadJob[]> => {
    const { data, error } = await context.supabase
      .from("upload_jobs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapJobRow);
  });

export const assetsListAudit = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly AssetAuditEntry[]> => {
    const { data, error } = await context.supabase
      .from("asset_audit")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      assetId: (r.asset_id as string | null) ?? null,
      actorId: (r.actor_id as string | null) ?? null,
      action: r.action as string,
      detail: (r.detail as AssetAuditEntry["detail"]) ?? {},
      createdAt: r.created_at as string,
    }));
  });

export const assetsConfig = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler((): typeof ASSETS_CONFIG => ASSETS_CONFIG);

function mapAssetRow(r: Record<string, unknown>): Asset {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    folderId: (r.folder_id as string | null) ?? null,
    provider: r.provider as StorageProviderId,
    bucket: r.bucket as string,
    objectKey: r.object_key as string,
    filename: r.filename as string,
    mime: r.mime as string,
    kind: r.kind as Asset["kind"],
    visibility: r.visibility as Asset["visibility"],
    sizeBytes: (r.size_bytes as number) ?? 0,
    sha256: (r.sha256 as string | null) ?? null,
    width: (r.width as number | null) ?? null,
    height: (r.height as number | null) ?? null,
    durationMs: (r.duration_ms as number | null) ?? null,
    metadata: (r.metadata as Asset["metadata"]) ?? {},
    deletedAt: (r.deleted_at as string | null) ?? null,
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
function mapJobRow(r: Record<string, unknown>): UploadJob {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    assetId: (r.asset_id as string | null) ?? null,
    status: r.status as UploadJob["status"],
    provider: r.provider as StorageProviderId,
    bucket: r.bucket as string,
    objectKey: r.object_key as string,
    filename: r.filename as string,
    mime: r.mime as string,
    sizeBytes: (r.size_bytes as number) ?? 0,
    bytesUploaded: (r.bytes_uploaded as number) ?? 0,
    partsTotal: (r.parts_total as number | null) ?? null,
    partsDone: (r.parts_done as number) ?? 0,
    error: (r.error as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}
