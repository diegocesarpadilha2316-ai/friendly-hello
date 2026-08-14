/**
 * Fase 3.22 — Expansão de captura em jobs.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { totalFrames } from "./timeline";
import type { LocalVideoCaptureRequest, LocalVideoJob } from "./types";

const NOW = () => new Date().toISOString();

function seed(project: PlannerProject, i: number): string {
  return `${project.id}-v-${project.version}-${Date.now().toString(36)}-${i.toString(36)}`;
}

function newJob(
  project: PlannerProject,
  req: LocalVideoCaptureRequest,
  roomId: string | null,
  cameraIds: readonly string[],
  i: number,
): LocalVideoJob {
  return {
    id: seed(project, i),
    projectId: project.id,
    projectVersion: project.version,
    title: `${req.qualityId.toUpperCase()} · ${req.output.resolution.label} · ${req.output.container.toUpperCase()}${roomId ? " · " + roomId : ""}`,
    status: "queued",
    progress: 0,
    stage: "queued",
    frameCursor: 0,
    frameTotal: totalFrames(req.timeline),
    qualityId: req.qualityId,
    output: req.output,
    timeline: req.timeline,
    roomId,
    cameraIds,
    audio: req.audio,
    createdAt: NOW(),
    updatedAt: NOW(),
  };
}

export function expandVideoCapture(
  project: PlannerProject,
  activeRoomId: string | null,
  req: LocalVideoCaptureRequest,
): readonly LocalVideoJob[] {
  const rooms: (string | null)[] = (() => {
    switch (req.scope) {
      case "current-environment":
      case "batch":
        return [activeRoomId ?? null];
      case "project":
      case "all-environments": {
        const ids: string[] = [];
        for (const env of project.environments) for (const r of env.rooms) ids.push(r.id);
        return ids.length ? ids : [null];
      }
      case "selection":
        return req.roomIds.length ? [...req.roomIds] : [activeRoomId ?? null];
    }
  })();

  const cams = req.cameraIds.length ? req.cameraIds : ["cam.interior"];
  const jobs: LocalVideoJob[] = [];
  let idx = 0;
  for (const roomId of rooms) {
    jobs.push(newJob(project, req, roomId, cams, idx));
    idx += 1;
  }
  return jobs;
}
