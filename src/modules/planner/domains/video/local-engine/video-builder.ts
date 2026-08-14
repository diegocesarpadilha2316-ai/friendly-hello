/**
 * Fase 3.22 — Construção da cena e do playbook do motor local de vídeo.
 * Puro/determinístico. Não muta o `PlannerProject`.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { LOCAL_CAMERAS } from "../../render/local-engine/cameras";
import { DEFAULT_LOCAL_QUALITY } from "../../render/local-engine/quality";
import { DEFAULT_OUTPUT as DEFAULT_FRAME_OUTPUT } from "../../render/local-engine/capture";
import { samplePath } from "./camera-animation";
import { totalFrames } from "./timeline";
import { DEFAULT_VIDEO_OUTPUT } from "./encoder";
import { videoPerformanceForTier, recommendVideoTier } from "./performance";
import type {
  LocalCameraPath,
  LocalObjectAnimation,
  LocalTimeline,
  LocalVideoOutputSpec,
  LocalVideoPlaybook,
  LocalVideoScene,
} from "./types";
import type { LocalQualityId } from "../../render/local-engine/types";

const TRI_PER_MODULE = 340;
const TRI_PER_WALL = 24;
const TRI_PER_LIGHT = 12;

export function buildVideoScene(
  project: PlannerProject,
  activeRoomId: string | null,
  timeline: LocalTimeline,
): LocalVideoScene {
  let roomCount = 0;
  let moduleCount = 0;
  let lightCount = 0;
  let openableCount = 0;
  let wallCount = 0;
  let maxW = 0,
    maxD = 0,
    maxH = 0;

  for (const env of project.environments) {
    for (const room of env.rooms) {
      if (activeRoomId && room.id !== activeRoomId) continue;
      roomCount += 1;
      maxW = Math.max(maxW, room.dimensions.width);
      maxD = Math.max(maxD, room.dimensions.depth);
      maxH = Math.max(maxH, room.dimensions.height);
      for (const node of Object.values(room.nodes)) {
        if (node.kind === "module" || node.kind === "hardware") moduleCount += 1;
        else if (node.kind === "wall") wallCount += 1;
        else if (node.kind === "opening") openableCount += 1;
        if (node.kind === "material" && node.params.emissive) lightCount += 1;
      }
    }
  }

  const frameCount = totalFrames(timeline);
  return {
    projectId: project.id,
    projectVersion: project.version,
    roomCount,
    moduleCount,
    lightCount,
    openableCount,
    triangleEstimate:
      moduleCount * TRI_PER_MODULE + wallCount * TRI_PER_WALL + lightCount * TRI_PER_LIGHT,
    durationSec: timeline.durationSec,
    frameCount,
    bboxMm: { w: maxW, d: maxD, h: maxH },
  };
}

export function buildVideoPlaybook(input: {
  scene: LocalVideoScene;
  timeline: LocalTimeline;
  output?: LocalVideoOutputSpec;
  qualityId?: LocalQualityId;
  animations?: readonly LocalObjectAnimation[];
}): LocalVideoPlaybook {
  const output = input.output ?? DEFAULT_VIDEO_OUTPUT;
  const qualityId = input.qualityId ?? DEFAULT_LOCAL_QUALITY;
  const paths: LocalCameraPath[] = input.timeline.clips.map((c) =>
    samplePath({
      moveId: c.moveId,
      cameraId: c.cameraId,
      durationSec: c.durationSec,
      fps: input.timeline.fps,
      centerMm: { x: input.scene.bboxMm.w / 2, y: 0, z: input.scene.bboxMm.d / 2 },
    }),
  );
  return {
    scene: input.scene,
    cameras: LOCAL_CAMERAS,
    paths,
    animations: input.animations ?? [],
    timeline: input.timeline,
    output,
    qualityId,
    performance: videoPerformanceForTier(recommendVideoTier(input.scene)),
    frameOutputSpec: DEFAULT_FRAME_OUTPUT,
  };
}
