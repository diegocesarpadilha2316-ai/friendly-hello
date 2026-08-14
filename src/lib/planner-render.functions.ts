/**
 * Etapa 7 — Render & Vídeo jobs.
 *
 * Wrapper thin sobre `render_jobs`, `render_assets`, `render_presets` e
 * `video_scenes`. Um único `kind` diferencia imagem estática (`image`),
 * panorama, vídeo (`video`) e afins. RLS por `company_id` via
 * `requireTenant`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { debitCreditsOrThrow } from "@/core/billing/debit.server";
import { priceRenderJob } from "@/core/billing/pricing";

export type RenderKind = "image" | "video" | "panorama" | "turntable";
export type RenderStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface RenderJobRow {
  id: string;
  projectId: string | null;
  roomId: string | null;
  kind: RenderKind;
  engine: string | null;
  quality: string | null;
  status: RenderStatus;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  fps: number | null;
  progress: number;
  creditsCost: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function num(v: unknown, d = 0): number {
  if (v == null) return d;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function mapJob(r: Record<string, unknown>): RenderJobRow {
  return {
    id: r.id as string,
    projectId: (r.project_id as string | null) ?? null,
    roomId: (r.room_id as string | null) ?? null,
    kind: (r.kind as RenderKind) ?? "image",
    engine: (r.engine as string | null) ?? null,
    quality: (r.quality as string | null) ?? null,
    status: (r.status as RenderStatus) ?? "queued",
    width: (r.width as number | null) ?? null,
    height: (r.height as number | null) ?? null,
    durationSec: (r.duration_sec as number | null) ?? null,
    fps: (r.fps as number | null) ?? null,
    progress: num(r.progress),
    creditsCost: (r.credits_cost as number | null) ?? null,
    error: (r.error as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    finishedAt: (r.finished_at as string | null) ?? null,
    createdAt: (r.created_at as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
  };
}

/* -------------------------------- List ---------------------------------- */

const listInput = z.object({
  projectId: z.string().uuid().optional(),
  kind: z.enum(["image", "video", "panorama", "turntable"]).optional(),
  status: z.enum(["queued", "running", "succeeded", "failed", "cancelled"]).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listRenderJobs = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly RenderJobRow[]> => {
    let q = context.supabase
      .from("render_jobs")
      .select(
        "id,project_id,room_id,kind,engine,quality,status,width,height,duration_sec,fps,progress,credits_cost,error,started_at,finished_at,created_at,updated_at",
      )
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return (rows ?? []).map(mapJob);
  });

/* --------------------------------- Get ---------------------------------- */

export const getRenderJob = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const [jobRes, assetsRes, scenesRes] = await Promise.all([
      context.supabase
        .from("render_jobs")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("render_assets")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("job_id", data.id)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("video_scenes")
        .select("*")
        .eq("job_id", data.id)
        .order("seq", { ascending: true }),
    ]);
    if (jobRes.error) throw new Response(jobRes.error.message, { status: 400 });
    if (!jobRes.data) throw new Response("Not found", { status: 404 });
    return {
      job: mapJob(jobRes.data),
      assets: assetsRes.data ?? [],
      scenes: scenesRes.data ?? [],
    };
  });

/* -------------------------------- Create -------------------------------- */

const sceneInput = z.object({
  seq: z.number().int().min(0).optional(),
  durationSec: z.number().min(0.1).max(3600),
  cameraFrom: z.record(z.unknown()).nullish(),
  cameraTo: z.record(z.unknown()).nullish(),
  transition: z.string().max(40).nullish(),
  meta: z.record(z.unknown()).nullish(),
});

const createInput = z.object({
  projectId: z.string().uuid(),
  roomId: z.string().uuid().nullish(),
  kind: z.enum(["image", "video", "panorama", "turntable"]),
  engine: z.string().max(40).default("cycles"),
  quality: z.string().max(40).default("standard"),
  width: z.number().int().min(128).max(16384).optional(),
  height: z.number().int().min(128).max(16384).optional(),
  durationSec: z.number().min(0).max(3600).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  camera: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  presetId: z.string().uuid().nullish(),
  scenes: z.array(sceneInput).max(120).optional(),
});

const DEFAULT_SIZE: Record<RenderKind, { w: number; h: number }> = {
  image: { w: 1920, h: 1080 },
  video: { w: 1920, h: 1080 },
  panorama: { w: 4096, h: 2048 },
  turntable: { w: 1080, h: 1080 },
};

export const enqueueRenderJob = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    let settings = data.settings ?? {};
    let engine = data.engine;
    let quality = data.quality;
    if (data.presetId) {
      const preset = await context.supabase
        .from("render_presets")
        .select("engine,quality,settings,kind")
        .eq("id", data.presetId)
        .maybeSingle();
      if (preset.data) {
        engine = (preset.data.engine as string) ?? engine;
        quality = (preset.data.quality as string) ?? quality;
        settings = {
          ...(preset.data.settings as Record<string, unknown>),
          ...settings,
        };
      }
    }

    const size = DEFAULT_SIZE[data.kind];

    // Débito de créditos ANTES de enfileirar (rejeita se saldo insuficiente).
    const charge = priceRenderJob({
      kind: data.kind,
      durationSec:
        data.durationSec ?? (data.kind === "video" || data.kind === "turntable" ? 8 : null),
      quality,
    });
    await debitCreditsOrThrow(context.supabase, context.tenantId, context.userId, {
      amount: charge,
      reason: `render.${data.kind}`,
      reference: data.projectId,
      metadata: { engine, quality, kind: data.kind },
    });

    const { data: job, error } = await context.supabase
      .from("render_jobs")
      .insert({
        company_id: context.tenantId,
        project_id: data.projectId,
        room_id: data.roomId ?? null,
        requested_by: context.userId,
        kind: data.kind,
        engine,
        quality,
        status: "queued",
        width: data.width ?? size.w,
        height: data.height ?? size.h,
        duration_sec:
          data.durationSec ?? (data.kind === "video" || data.kind === "turntable" ? 8 : null),
        fps: data.fps ?? (data.kind === "video" ? 30 : null),
        camera: data.camera ?? null,
        settings,
        progress: 0,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    if (data.kind === "video" && data.scenes && data.scenes.length > 0) {
      const ins = await context.supabase.from("video_scenes").insert(
        data.scenes.map((s, idx) => ({
          job_id: job.id,
          seq: s.seq ?? idx,
          duration_sec: s.durationSec,
          camera_from: s.cameraFrom ?? null,
          camera_to: s.cameraTo ?? null,
          transition: s.transition ?? null,
          meta: s.meta ?? null,
        })),
      );
      if (ins.error) throw new Response(ins.error.message, { status: 400 });
    }

    return mapJob(job);
  });

/* ----------------------------- Cancel/delete ---------------------------- */

export const cancelRenderJob = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("render_jobs")
      .update({ status: "cancelled", finished_at: new Date().toISOString() })
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .in("status", ["queued", "running"])
      .select("*")
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 400 });
    return row ? mapJob(row) : null;
  });

export const deleteRenderJob = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("render_jobs")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* -------------------------------- Presets ------------------------------- */

export const listRenderPresets = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["image", "video", "panorama", "turntable"]).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("render_presets")
      .select("id,name,kind,engine,quality,settings,is_official")
      .or(`company_id.eq.${context.tenantId},is_official.eq.true`)
      .order("is_official", { ascending: false })
      .order("name", { ascending: true });
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

/* --------------------------------- Stats -------------------------------- */

export const renderStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("render_jobs")
      .select("kind,status,credits_cost")
      .eq("company_id", context.tenantId);
    if (error) throw new Response(error.message, { status: 400 });
    const rows = data ?? [];
    const by = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      queued: by("queued"),
      running: by("running"),
      succeeded: by("succeeded"),
      failed: by("failed"),
      cancelled: by("cancelled"),
      images: rows.filter((r) => r.kind === "image").length,
      videos: rows.filter((r) => r.kind === "video").length,
      panoramas: rows.filter((r) => r.kind === "panorama").length,
      turntables: rows.filter((r) => r.kind === "turntable").length,
      totalCredits: rows.reduce((a, r) => a + num(r.credits_cost), 0),
    };
  });

/* -------------------------- Realtime helpers ---------------------------- */

const progressInput = z.object({
  id: z.string().uuid(),
  progress: z.number().min(0).max(100),
  status: z.enum(["queued", "running", "succeeded", "failed", "cancelled"]).optional(),
  error: z.string().max(2000).optional(),
});

/**
 * Client polling / worker-callback friendly progress updater. Only
 * transitions from active states; ignores updates to terminal jobs.
 */
export const updateRenderProgress = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => progressInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { progress: data.progress };
    const now = new Date().toISOString();
    if (data.status) {
      patch.status = data.status;
      if (data.status === "running" && !patch.started_at) patch.started_at = now;
      if (["succeeded", "failed", "cancelled"].includes(data.status)) patch.finished_at = now;
    }
    if (data.error !== undefined) patch.error = data.error;
    const { error } = await context.supabase
      .from("render_jobs")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .in("status", ["queued", "running"]);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });
