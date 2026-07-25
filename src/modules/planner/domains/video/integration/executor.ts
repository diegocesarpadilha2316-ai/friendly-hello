/**
 * Fase 3.31 — Executor real dos jobs de vídeo.
 *
 * Reutiliza `useLocalVideo` (Fase 3.22) para orquestração e `useVideoQueue`
 * (Fase 3.10) para o pipeline de compositing/encoding. Não cria uma nova
 * fila. Aqui vivem apenas helpers puros de snapshot/estado.
 */
import type { LocalVideoJob } from "../local-engine/types";
import type { RealVideoJobSnapshot } from "./types";

export function jobSnapshotVideo(job: LocalVideoJob): RealVideoJobSnapshot {
  return {
    job,
    stage: job.stage,
    progress: job.progress,
    frameCursor: job.frameCursor,
    frameTotal: job.frameTotal,
  };
}

export function isTerminalVideo(job: LocalVideoJob): boolean {
  return job.status === "done" || job.status === "cancelled" || job.status === "failed";
}

export function percentComplete(jobs: readonly LocalVideoJob[]): number {
  if (jobs.length === 0) return 0;
  const sum = jobs.reduce((acc, j) => acc + j.progress, 0);
  return sum / jobs.length;
}