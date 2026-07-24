/**
 * Fase 3.10 — Fila de vídeos (helpers puros).
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { getVideoFormat } from "./export";
import { getVideoEngine } from "./engines";
import { getVideoPreset } from "./presets";
import { VIDEO_PIPELINE } from "./pipeline";
import { DEFAULT_BRANDING } from "./branding";
import { DEFAULT_NARRATION } from "./narration";
import { buildSceneTimeline } from "./scenes";
import { totalFrames } from "./timeline";
import type {
  VideoBranding,
  VideoEngineId,
  VideoJob,
  VideoJobConfig,
  VideoJobStatus,
  VideoNarration,
  VideoPipelineStage,
  VideoPresetId,
  VideoSceneKind,
  VideoTimeline,
} from "../types";
import type { RenderProviderId } from "../../render/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateVideoJobInput {
  readonly project: PlannerProject;
  readonly presetId: VideoPresetId;
  readonly engineId: VideoEngineId;
  readonly renderProviderId: RenderProviderId;
  readonly sceneKind: VideoSceneKind;
  readonly formatId?: string;
  readonly timeline?: VideoTimeline;
  readonly branding?: VideoBranding;
  readonly narration?: VideoNarration;
  readonly roomId?: string | null;
  readonly environmentId?: string | null;
  readonly title?: string;
  readonly notes?: string;
}

export function createVideoJob(input: CreateVideoJobInput): VideoJob {
  const preset = getVideoPreset(input.presetId);
  const engine = getVideoEngine(input.engineId);
  const formatId = input.formatId ?? preset.formatId;
  const format = getVideoFormat(formatId);
  const timeline = input.timeline ?? buildSceneTimeline(input.sceneKind).timeline;
  const now = new Date().toISOString();

  const config: VideoJobConfig = {
    presetId: preset.id,
    engineId: engine.id,
    renderProviderId: input.renderProviderId,
    renderPresetId: preset.renderPresetId,
    formatId: format.id,
    timeline,
    branding: input.branding ?? DEFAULT_BRANDING,
    narration: input.narration ?? DEFAULT_NARRATION,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sceneKind: input.sceneKind,
    notes: input.notes,
  };

  return {
    id: uid("vjob"),
    projectId: input.project.id,
    projectVersion: input.project.version,
    title: input.title ?? `${preset.label} · ${format.label}`,
    status: "queued",
    progress: 0,
    stage: VIDEO_PIPELINE[0].label,
    config,
    createdAt: now,
    updatedAt: now,
  };
}

export function withVideoStatus(
  job: VideoJob,
  status: VideoJobStatus,
  stage?: VideoPipelineStage,
  progress?: number,
  patch?: Partial<VideoJob>,
): VideoJob {
  const now = new Date().toISOString();
  const started = status === "planning" && !job.startedAt ? now : job.startedAt;
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

export function frameCountFor(job: VideoJob): number {
  return totalFrames(job.config.timeline);
}
