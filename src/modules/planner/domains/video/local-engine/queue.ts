/**
 * Fase 3.22 — Fila determinística com 5 estágios.
 */
import { estimateEncodeMs } from "./encoder";
import type { LocalVideoJob, LocalVideoJobStatus } from "./types";

export const LOCAL_VIDEO_STAGES: readonly {
  readonly id: string;
  readonly label: string;
  readonly status: LocalVideoJobStatus;
  readonly weight: number;
}[] = [
  { id: "plan", label: "Planejamento", status: "planning", weight: 0.08 },
  { id: "render", label: "Renderização de frames", status: "rendering", weight: 0.55 },
  { id: "compose", label: "Composição / transições", status: "compositing", weight: 0.18 },
  { id: "encode", label: "Codificação", status: "encoding", weight: 0.14 },
  { id: "publish", label: "Publicação", status: "publishing", weight: 0.05 },
];

export function estimateVideoDurationMs(job: LocalVideoJob): number {
  const px = job.output.resolution.width * job.output.resolution.height;
  const q =
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
  const perFrameMs = 40 + (px / 1_000_000) * 60 * q;
  const renderMs = perFrameMs * job.frameTotal;
  return Math.round(renderMs + estimateEncodeMs(job.output, job.timeline.durationSec));
}

export function advanceVideo(
  job: LocalVideoJob,
  stageIndex: number,
  fraction: number,
): LocalVideoJob {
  const stage = LOCAL_VIDEO_STAGES[stageIndex] ?? LOCAL_VIDEO_STAGES[0];
  let acc = 0;
  for (let i = 0; i < stageIndex; i += 1) acc += LOCAL_VIDEO_STAGES[i].weight;
  acc += stage.weight * Math.max(0, Math.min(1, fraction));
  const overallCursor =
    stage.id === "render"
      ? Math.round(job.frameTotal * fraction)
      : stage.id === "plan"
        ? 0
        : job.frameTotal;
  return {
    ...job,
    status: stage.status,
    stage: stage.label,
    progress: Math.max(0, Math.min(1, acc)),
    frameCursor: overallCursor,
    updatedAt: new Date().toISOString(),
  };
}

export function completeVideo(job: LocalVideoJob): LocalVideoJob {
  const durationMs = Date.now() - new Date(job.startedAt ?? job.createdAt).getTime();
  const bytes = (job.output.bitrateKbps * 1000 * job.timeline.durationSec) / 8;
  return {
    ...job,
    status: "done",
    stage: "Concluído",
    progress: 1,
    frameCursor: job.frameTotal,
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: {
      widthPx: job.output.resolution.width,
      heightPx: job.output.resolution.height,
      frameCount: job.frameTotal,
      durationMs,
      bytes: Math.round(bytes),
    },
  };
}

export function markVideoStart(job: LocalVideoJob): LocalVideoJob {
  return {
    ...job,
    status: "planning",
    stage: "Planejamento",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function markVideoCancelled(job: LocalVideoJob): LocalVideoJob {
  return {
    ...job,
    status: "cancelled",
    stage: "Cancelado",
    finishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
