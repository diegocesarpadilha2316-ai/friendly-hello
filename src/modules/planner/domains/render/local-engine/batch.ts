/**
 * Fase 3.21 — Expansão de uma captura em jobs (puro/determinístico).
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import type { LocalCaptureRequest, LocalJobStatus, LocalRenderJob } from "./types";

const NOW = () => new Date().toISOString();

function seed(project: PlannerProject, i: number): string {
  return `${project.id}-${project.version}-${Date.now().toString(36)}-${i.toString(36)}`;
}

function newJob(
  project: PlannerProject,
  req: LocalCaptureRequest,
  cameraId: string,
  roomId: string | null,
  i: number,
): LocalRenderJob {
  const status: LocalJobStatus = "queued";
  return {
    id: seed(project, i),
    projectId: project.id,
    projectVersion: project.version,
    title: `${req.qualityId.toUpperCase()} · ${cameraId}${roomId ? " · " + roomId : ""}`,
    status,
    progress: 0,
    stage: "queued",
    qualityId: req.qualityId,
    output: req.output,
    cameraId,
    roomId,
    createdAt: NOW(),
    updatedAt: NOW(),
  };
}

export function expandCapture(
  project: PlannerProject,
  activeRoomId: string | null,
  req: LocalCaptureRequest,
): readonly LocalRenderJob[] {
  const rooms: (string | null)[] = (() => {
    switch (req.scope) {
      case "single":
      case "batch":
      case "current-environment":
        return [activeRoomId ?? null];
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
  const jobs: LocalRenderJob[] = [];
  let idx = 0;
  for (const roomId of rooms) {
    for (const cameraId of cams) {
      jobs.push(newJob(project, req, cameraId, roomId, idx));
      idx += 1;
      if (req.scope === "single") return jobs;
    }
  }
  return jobs;
}
