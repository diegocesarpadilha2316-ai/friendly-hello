/**
 * Render/Video worker — server-only.
 *
 * Avança jobs enfileirados/rodando de forma idempotente. É executado
 * pelo tick autenticado (chamado pelo painel) e pelo cron público
 * (protegido por WORKERS_CRON_SECRET). Não faz render real — simula
 * progresso e finaliza com URLs placeholder para fechar o pipeline
 * ponta-a-ponta enquanto o backend GPU não estiver acoplado.
 */
import { getSupabaseAdmin } from "@/core/lib/supabase/admin.server";

type JobKind = "render" | "video";

interface JobRow {
  id: string;
  company_id: string;
  project_id: string | null;
  status: string;
  progress: number | null;
  started_at: string | null;
  updated_at: string | null;
  output_url: string | null;
  thumbnail_url: string | null;
  kind?: string | null;
  resolution?: string | null;
  width?: number | null;
  height?: number | null;
}

function placeholderImage(seed: string, w = 1600, h = 900): string {
  // picsum é público e determinístico via seed.
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function placeholderVideo(): string {
  // Sample MP4 público (Google gtv-videos-bucket, permitido para preview).
  return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
}

function nextProgress(current: number): number {
  // Passos entre 18-32%, com jitter suave.
  const step = 18 + Math.floor(Math.random() * 15);
  return Math.min(100, current + step);
}

async function advanceTable(
  table: "render_jobs" | "video_jobs",
  kind: JobKind,
  maxJobs: number,
): Promise<{ processed: number; finished: number }> {
  const admin = getSupabaseAdmin();
  const { data: rows, error } = await admin
    .from(table)
    .select(
      "id,company_id,project_id,status,progress,started_at,updated_at,output_url,thumbnail_url,kind,resolution,width,height",
    )
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: true })
    .limit(maxJobs);
  if (error) throw new Error(error.message);

  let processed = 0;
  let finished = 0;
  const now = new Date().toISOString();

  for (const raw of (rows ?? []) as JobRow[]) {
    const prog = Number(raw.progress ?? 0);
    // Anti-thrash: se acabou de atualizar (<3s), pula.
    if (raw.updated_at) {
      const age = Date.now() - new Date(raw.updated_at).getTime();
      if (age < 3000 && raw.status === "running") continue;
    }
    if (raw.status === "queued") {
      await admin
        .from(table)
        .update({
          status: "running",
          started_at: raw.started_at ?? now,
          progress: 5,
          updated_at: now,
        })
        .eq("id", raw.id);
      processed += 1;
      continue;
    }
    const next = nextProgress(prog);
    if (next >= 100) {
      const seed = `${raw.company_id}-${raw.id}`;
      const isVideo = kind === "video" || raw.kind === "video";
      const w = Number(raw.width ?? 1920);
      const h = Number(raw.height ?? 1080);
      await admin
        .from(table)
        .update({
          status: "succeeded",
          progress: 100,
          finished_at: now,
          updated_at: now,
          output_url: isVideo ? placeholderVideo() : placeholderImage(seed, w, h),
          thumbnail_url: placeholderImage(`${seed}-thumb`, 640, 360),
        })
        .eq("id", raw.id);
      finished += 1;
      processed += 1;
    } else {
      await admin.from(table).update({ progress: next, updated_at: now }).eq("id", raw.id);
      processed += 1;
    }
  }

  return { processed, finished };
}

export async function tickRenderWorkers(opts?: { maxJobs?: number }): Promise<{
  render: { processed: number; finished: number };
  video: { processed: number; finished: number };
}> {
  const maxJobs = Math.min(50, Math.max(1, opts?.maxJobs ?? 20));
  const [r, v] = await Promise.all([
    advanceTable("render_jobs", "render", maxJobs),
    advanceTable("video_jobs", "video", maxJobs),
  ]);
  return { render: r, video: v };
}
