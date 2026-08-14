/**
 * Etapa 9 — Storage / Assets.
 *
 * Wrapper thin sobre `assets`, `asset_folders`, `asset_versions`,
 * `asset_permissions`, `asset_downloads`, `asset_thumbnails`,
 * `asset_usage`, `upload_jobs` e `digital_assets`. Todos os writes ficam
 * escopados por `company_id` via `requireTenant`; o objeto binário em si
 * é enviado pelo cliente ao Storage (via `supabase.storage.from(bucket)`) —
 * aqui persistimos apenas o metadado e o pipeline de upload.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type AssetKind =
  "image" | "video" | "audio" | "document" | "model3d" | "texture" | "hdri" | "render" | "other";

export type AssetVisibility = "private" | "tenant" | "public";

function num(v: unknown, d = 0): number {
  if (v == null) return d;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

/* ------------------------------- Folders -------------------------------- */

export const listAssetFolders = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ parentId: z.string().uuid().nullish() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("asset_folders")
      .select("id,parent_id,name,path,created_at,updated_at")
      .eq("company_id", context.tenantId)
      .order("name", { ascending: true });
    q = data.parentId ? q.eq("parent_id", data.parentId) : q.is("parent_id", null);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

export const createAssetFolder = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        parentId: z.string().uuid().nullish(),
        name: z.string().trim().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // Compute a materialized path from parent.
    let path = `/${data.name}`;
    if (data.parentId) {
      const parent = await context.supabase
        .from("asset_folders")
        .select("path")
        .eq("company_id", context.tenantId)
        .eq("id", data.parentId)
        .maybeSingle();
      if (parent.error || !parent.data) throw new Response("Parent not found", { status: 404 });
      path = `${parent.data.path === "/" ? "" : parent.data.path}/${data.name}`;
    }
    const { data: row, error } = await context.supabase
      .from("asset_folders")
      .insert({
        company_id: context.tenantId,
        parent_id: data.parentId ?? null,
        name: data.name,
        path,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });

/* -------------------------------- Assets -------------------------------- */

const listAssetsInput = z.object({
  folderId: z.string().uuid().nullish(),
  kind: z
    .enum(["image", "video", "audio", "document", "model3d", "texture", "hdri", "render", "other"])
    .optional(),
  query: z.string().trim().max(120).optional(),
  visibility: z.enum(["private", "tenant", "public"]).optional(),
  includeDeleted: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listAssetsInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("assets")
      .select(
        "id,folder_id,provider,bucket,object_key,filename,mime,kind,visibility,size_bytes,width,height,duration_ms,metadata,created_at,updated_at",
      )
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (!data.includeDeleted) q = q.is("deleted_at", null);
    if (data.folderId !== undefined) {
      q = data.folderId ? q.eq("folder_id", data.folderId) : q.is("folder_id", null);
    }
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.visibility) q = q.eq("visibility", data.visibility);
    if (data.query) q = q.ilike("filename", `%${data.query}%`);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

export const getAsset = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const [assetRes, versionsRes, thumbsRes, permsRes] = await Promise.all([
      context.supabase
        .from("assets")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("asset_versions")
        .select("id,version,storage_path,size_bytes,checksum_sha256,metadata,created_at")
        .eq("asset_id", data.id)
        .order("version", { ascending: false }),
      context.supabase
        .from("asset_thumbnails")
        .select("id,variant,object_key,width,height,size_bytes")
        .eq("asset_id", data.id),
      context.supabase
        .from("asset_permissions")
        .select("id,subject_type,subject_id,can_read,can_write,can_delete")
        .eq("asset_id", data.id),
    ]);
    if (assetRes.error) throw new Response(assetRes.error.message, { status: 400 });
    if (!assetRes.data) throw new Response("Not found", { status: 404 });
    return {
      asset: assetRes.data,
      versions: versionsRes.data ?? [],
      thumbnails: thumbsRes.data ?? [],
      permissions: permsRes.data ?? [],
    };
  });

/* -------------------------- Upload orchestration ------------------------ */

const startUploadInput = z.object({
  filename: z.string().trim().min(1).max(240),
  mime: z.string().min(1).max(180),
  sizeBytes: z.number().int().min(0),
  kind: z
    .enum(["image", "video", "audio", "document", "model3d", "texture", "hdri", "render", "other"])
    .default("other"),
  visibility: z.enum(["private", "tenant", "public"]).default("tenant"),
  folderId: z.string().uuid().nullish(),
  bucket: z.string().max(80).default("assets"),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Cria o metadado de asset + upload job e devolve o `objectKey` que o
 * cliente deve usar em `supabase.storage.from(bucket).upload(objectKey, file)`.
 */
export const startAssetUpload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => startUploadInput.parse(data))
  .handler(async ({ data, context }) => {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    const safeName = data.filename.replace(/[^\w.\-]+/g, "_");
    const objectKey = `${context.tenantId}/${new Date().toISOString().slice(0, 10)}/${stamp}-${rand}-${safeName}`;

    const { data: asset, error: aErr } = await context.supabase
      .from("assets")
      .insert({
        company_id: context.tenantId,
        folder_id: data.folderId ?? null,
        provider: "supabase",
        bucket: data.bucket,
        object_key: objectKey,
        filename: data.filename,
        mime: data.mime,
        kind: data.kind,
        visibility: data.visibility,
        size_bytes: data.sizeBytes,
        metadata: data.metadata ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (aErr) throw new Response(aErr.message, { status: 400 });

    const { data: job, error: jErr } = await context.supabase
      .from("upload_jobs")
      .insert({
        company_id: context.tenantId,
        asset_id: asset.id,
        status: "pending",
        provider: "supabase",
        bucket: data.bucket,
        object_key: objectKey,
        filename: data.filename,
        mime: data.mime,
        size_bytes: data.sizeBytes,
        bytes_uploaded: 0,
        parts_total: 1,
        parts_done: 0,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (jErr) throw new Response(jErr.message, { status: 400 });

    await context.supabase.from("asset_audit").insert({
      company_id: context.tenantId,
      asset_id: asset.id,
      actor_id: context.userId,
      action: "upload.started",
      detail: { objectKey, bucket: data.bucket, sizeBytes: data.sizeBytes },
    });

    return { asset, job, bucket: data.bucket, objectKey };
  });

const completeUploadInput = z.object({
  jobId: z.string().uuid(),
  checksumSha256: z.string().max(128).optional(),
  width: z.number().int().min(0).nullish(),
  height: z.number().int().min(0).nullish(),
  durationMs: z.number().int().min(0).nullish(),
});

export const completeAssetUpload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => completeUploadInput.parse(data))
  .handler(async ({ data, context }) => {
    const jobRes = await context.supabase
      .from("upload_jobs")
      .select("*")
      .eq("company_id", context.tenantId)
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobRes.error || !jobRes.data) throw new Response("Not found", { status: 404 });
    const job = jobRes.data;

    const now = new Date().toISOString();
    const patchJob = await context.supabase
      .from("upload_jobs")
      .update({
        status: "completed",
        bytes_uploaded: job.size_bytes,
        parts_done: job.parts_total ?? 1,
        updated_at: now,
      })
      .eq("id", job.id);
    if (patchJob.error) throw new Response(patchJob.error.message, { status: 400 });

    if (job.asset_id) {
      const patchAsset: Record<string, unknown> = { updated_at: now };
      if (data.checksumSha256) patchAsset.sha256 = data.checksumSha256;
      if (data.width != null) patchAsset.width = data.width;
      if (data.height != null) patchAsset.height = data.height;
      if (data.durationMs != null) patchAsset.duration_ms = data.durationMs;
      await context.supabase
        .from("assets")
        .update(patchAsset)
        .eq("company_id", context.tenantId)
        .eq("id", job.asset_id);

      // Version 1 record.
      await context.supabase.from("asset_versions").insert({
        asset_id: job.asset_id,
        version: 1,
        storage_path: job.object_key,
        size_bytes: job.size_bytes,
        checksum_sha256: data.checksumSha256 ?? null,
        metadata: null,
        created_by: context.userId,
      });

      await context.supabase.from("asset_audit").insert({
        company_id: context.tenantId,
        asset_id: job.asset_id,
        actor_id: context.userId,
        action: "upload.completed",
        detail: { objectKey: job.object_key },
      });
    }
    return { ok: true as const };
  });

export const failAssetUpload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        error: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("upload_jobs")
      .update({ status: "failed", error: data.error ?? null })
      .eq("company_id", context.tenantId)
      .eq("id", data.jobId);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* ------------------------------- Downloads ------------------------------ */

const signInput = z.object({
  id: z.string().uuid(),
  ttlSeconds: z
    .number()
    .int()
    .min(30)
    .max(60 * 60 * 24)
    .optional(),
  versionId: z.string().uuid().nullish(),
});

export const signAssetDownload = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => signInput.parse(data))
  .handler(async ({ data, context }) => {
    const asset = await context.supabase
      .from("assets")
      .select("bucket,object_key,filename,visibility")
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .maybeSingle();
    if (asset.error || !asset.data) throw new Response("Not found", { status: 404 });

    let objectKey = asset.data.object_key as string;
    if (data.versionId) {
      const v = await context.supabase
        .from("asset_versions")
        .select("storage_path")
        .eq("id", data.versionId)
        .maybeSingle();
      if (v.data?.storage_path) objectKey = v.data.storage_path as string;
    }

    const ttl = data.ttlSeconds ?? 300;
    const signed = await context.supabase.storage
      .from(asset.data.bucket as string)
      .createSignedUrl(objectKey, ttl, { download: asset.data.filename as string });
    if (signed.error) throw new Response(signed.error.message, { status: 400 });

    await context.supabase.from("asset_downloads").insert({
      asset_id: data.id,
      version_id: data.versionId ?? null,
      downloaded_by: context.userId,
      signed_url_ttl_seconds: ttl,
    });
    await context.supabase.from("asset_audit").insert({
      company_id: context.tenantId,
      asset_id: data.id,
      actor_id: context.userId,
      action: "download.signed",
      detail: { ttl, versionId: data.versionId ?? null },
    });

    return { url: signed.data.signedUrl, expiresIn: ttl };
  });

/* ------------------------------ Permissions ----------------------------- */

const permInput = z.object({
  assetId: z.string().uuid(),
  subjectType: z.enum(["user", "role", "team", "public"]),
  subjectId: z.string().max(80).nullish(),
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const setAssetPermission = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => permInput.parse(data))
  .handler(async ({ data, context }) => {
    // Confirm tenant ownership of the asset.
    const own = await context.supabase
      .from("assets")
      .select("id")
      .eq("company_id", context.tenantId)
      .eq("id", data.assetId)
      .maybeSingle();
    if (own.error || !own.data) throw new Response("Forbidden", { status: 403 });

    const { data: row, error } = await context.supabase
      .from("asset_permissions")
      .upsert(
        {
          asset_id: data.assetId,
          subject_type: data.subjectType,
          subject_id: data.subjectId ?? null,
          can_read: data.canRead ?? true,
          can_write: data.canWrite ?? false,
          can_delete: data.canDelete ?? false,
        },
        { onConflict: "asset_id,subject_type,subject_id" },
      )
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });

/* -------------------------- Soft delete / stats ------------------------- */

export const softDeleteAsset = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    await context.supabase.from("asset_audit").insert({
      company_id: context.tenantId,
      asset_id: data.id,
      actor_id: context.userId,
      action: "asset.soft_deleted",
      detail: null,
    });
    return { ok: true as const };
  });

export const restoreAsset = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("assets")
      .update({ deleted_at: null })
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

export const assetsStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assets")
      .select("kind,size_bytes,deleted_at")
      .eq("company_id", context.tenantId);
    if (error) throw new Response(error.message, { status: 400 });
    const rows = data ?? [];
    const active = rows.filter((r) => !r.deleted_at);
    const byKind = (k: string) => active.filter((r) => r.kind === k).length;
    return {
      total: active.length,
      trashed: rows.length - active.length,
      totalBytes: active.reduce((a, r) => a + num(r.size_bytes), 0),
      images: byKind("image"),
      videos: byKind("video"),
      audios: byKind("audio"),
      documents: byKind("document"),
      models3d: byKind("model3d"),
      textures: byKind("texture"),
      hdris: byKind("hdri"),
      renders: byKind("render"),
    };
  });

/* ------------------------------ Digital assets -------------------------- */

/**
 * `digital_assets` guarda os assets já derivados/entregues (renders, PDFs,
 * pacotes de produção) prontos para o cliente final baixar. Diferente de
 * `assets`, aqui expomos `cdn_url` público quando `is_public = true`.
 */
export const listDigitalAssets = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid().optional(),
        kind: z.string().max(40).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("digital_assets")
      .select(
        "id,project_id,kind,title,description,storage_bucket,storage_path,mime_type,size_bytes,width,height,duration_ms,tags,is_public,cdn_url,created_at",
      )
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });
