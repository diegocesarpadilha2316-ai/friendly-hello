/**
 * Fase 3.9 — Fila de render (helpers puros).
 *
 * A fila vive em estado local do hook `useRenderQueue` — nenhum store
 * global, nenhum banco.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { getCamera } from "./cameras";
import { getRenderPreset } from "./presets";
import { RENDER_PIPELINE } from "./pipeline";
import { postForPreset } from "./postprocess";
import type {
  RenderJob,
  RenderJobConfig,
  RenderJobStatus,
  RenderPipelineStage,
  RenderPresetId,
  RenderProviderId,
  RenderTargetKind,
} from "../types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateJobInput {
  readonly project: PlannerProject;
  readonly presetId: RenderPresetId;
  readonly providerId: RenderProviderId;
  readonly target: RenderTargetKind;
  readonly cameraId: string;
  readonly hdriId: string | null;
  readonly extraLightIds?: readonly string[];
  readonly roomId?: string | null;
  readonly environmentId?: string | null;
  readonly title?: string;
  readonly durationSec?: number;
  readonly notes?: string;
}

export function createJob(input: CreateJobInput): RenderJob {
  const preset = getRenderPreset(input.presetId);
  const camera = getCamera(input.cameraId);
  const now = new Date().toISOString();
  const config: RenderJobConfig = {
    presetId: preset.id,
    quality: preset.quality,
    cameraId: camera.id,
    hdriId: input.hdriId,
    extraLightIds: input.extraLightIds ?? [],
    postProcessing: postForPreset(preset.id),
    target: input.target,
    providerId: input.providerId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    durationSec: input.durationSec,
    notes: input.notes,
  };
  return {
    id: uid("rjob"),
    projectId: input.project.id,
    projectVersion: input.project.version,
    title: input.title ?? `${preset.label} · ${camera.label}`,
    status: "queued",
    progress: 0,
    stage: RENDER_PIPELINE[0].label,
    config,
    createdAt: now,
    updatedAt: now,
  };
}

export function withStatus(
  job: RenderJob,
  status: RenderJobStatus,
  stage?: RenderPipelineStage,
  progress?: number,
  patch?: Partial<RenderJob>,
): RenderJob {
  const now = new Date().toISOString();
  const started = status === "preparing" && !job.startedAt ? now : job.startedAt;
  const finished =
    status === "done" || status === "cancelled" || status === "failed" ? now : job.finishedAt;
  return {
    ...job,
    status,
    stage: stage?.label ?? job.stage,
    progress: progress ?? job.progress,
    updatedAt: now,
    startedAt: started,
    finishedAt: finished,
    ...patch,
  };
}

/** Mapa estágio → status "amigável" mostrado na fila. */
export function statusForStage(stageId: string): RenderJobStatus {
  switch (stageId) {
    case "collect":
    case "prepare":
      return "preparing";
    case "lighting":
    case "materials":
    case "camera":
    case "raytrace":
      return "rendering";
    case "denoise":
      return "denoising";
    case "postprocess":
    case "encode":
      return "postprocessing";
    case "publish":
      return "uploading";
    default:
      return "rendering";
  }
}
