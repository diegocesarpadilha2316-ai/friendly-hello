/**
 * Fase 3.30 — Executor real.
 *
 * Reutiliza `useRenderQueue` e o pipeline existentes. Não cria uma nova fila,
 * apenas oferece helpers para pausar/continuar (via cancel + retry) e para
 * gerar snapshots de progresso.
 */
import { RENDER_PIPELINE } from "../services/pipeline";
import type { RenderJob } from "../types";
import type { RealJobSnapshot } from "./types";

export function jobSnapshot(job: RenderJob): RealJobSnapshot {
  const started = job.startedAt
    ? new Date(job.startedAt).getTime()
    : new Date(job.createdAt).getTime();
  const finished = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
  return {
    job,
    durationMs: Math.max(0, finished - started),
    stage: job.stage,
    progress: job.progress,
  };
}

export function pipelineStageIndex(job: RenderJob): number {
  const i = RENDER_PIPELINE.findIndex((s) => s.label === job.stage);
  return i < 0 ? 0 : i;
}

export function isTerminal(job: RenderJob): boolean {
  return job.status === "done" || job.status === "cancelled" || job.status === "failed";
}
