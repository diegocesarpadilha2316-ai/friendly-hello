/**
 * Fase 3.21 — Construção da cena local (pura/determinística).
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import type { LocalRenderScene } from "./types";

const TRI_PER_MODULE = 340;
const TRI_PER_WALL = 24;
const TRI_PER_LIGHT = 12;

export function buildLocalScene(
  project: PlannerProject,
  activeRoomId: string | null,
): LocalRenderScene {
  let roomCount = 0;
  let moduleCount = 0;
  let lightCount = 0;
  let wallCount = 0;
  let maxW = 0;
  let maxD = 0;
  let maxH = 0;

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
        else if (node.kind === "opening") lightCount += 0; // openings não contam
        if (node.kind === "material" && node.params.emissive) lightCount += 1;
      }
    }
  }

  return {
    projectId: project.id,
    projectVersion: project.version,
    roomCount,
    moduleCount,
    lightCount,
    wallCount,
    triangleEstimate:
      moduleCount * TRI_PER_MODULE + wallCount * TRI_PER_WALL + lightCount * TRI_PER_LIGHT,
    bboxMm: { w: maxW, d: maxD, h: maxH },
  };
}