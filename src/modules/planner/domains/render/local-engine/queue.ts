/**
 * Fase 3.21 — Fila local determinística.
 */
import type { LocalJobStatus, LocalRenderJob } from "./types";

export const LOCAL_STAGES: readonly {
  readonly id: string;
  readonly label: string;
  readonly status: LocalJobStatus;
  readonly weight: number;
}[] = [
  { id: "prepare", label: "Preparação", status: "preparing", weight: 0.1 },
  { id: "trace", label: "Ray casting", status: "rendering", weight: 0.55 },
  { id: "post", label: "Pós-processamento", status: "postprocessing", weight: 0.2 },
  { id: "encode", label: "Codificação", status: "encoding", weight: 0.15 },
];

export function estimateDurationMs(job: LocalRenderJob): number {
  const px = job.output.resolution.width * job.output.resolution.height;
  const factor =
    job.qualityId === "rascunho"
      ? 0.4
      : job.qualityId === "baixa"
        ? 0.7
        : job.qualityId === "media"
          ? 1
          : job.qualityId === "alta"
            ? 1.6
            : job.qualityId === "ultra"
              ? 2.4
              : 3.2;
  return Math.round(1200 + (px / 1_000_000) * 800 * factor);
}

export function advance(job: LocalRenderJob, stageIndex: number, fraction: number): LocalRenderJob {
  const stage = LOCAL_STAGES[stageIndex] ?? LOCAL_STAGES[0];
  let acc = 0;
  for (let i = 0; i < stageIndex; i += 1) acc += LOCAL_STAGES[i].weight;
  acc += stage.weight * Math.max(0, Math.min(1, fraction));
  return {
    ...job,
    status: stage.status,
    stage: stage.label,
    progress: Math.max(0, Math.min(1, acc)),
    updatedAt: new Date().toISOString(),
  };
}

export function complete(job: LocalRenderJob): LocalRenderJob {
  const durationMs = Date.now() - new Date(job.startedAt ?? job.createdAt).getTime();
  const bytes =
    job.output.resolution.width *
    job.output.resolution.height *
    (job.output.bitDepth / 8) *
    (job.output.format === "png" ? 3 : job.output.format === "tiff" ? 4 : 1);
  return {
    ...job,
    status: "done",
    stage: "Concluído",
    progress: 1,
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: {
      widthPx: job.output.resolution.width,
      heightPx: job.output.resolution.height,
      bytes: Math.round(bytes),
      durationMs,
    },
  };
}

export function markStart(job: LocalRenderJob): LocalRenderJob {
  return {
    ...job,
    status: "preparing",
    stage: "Preparação",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function markCancelled(job: LocalRenderJob): LocalRenderJob {
  return {
    ...job,
    status: "cancelled",
    stage: "Cancelado",
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
