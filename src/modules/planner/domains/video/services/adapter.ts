/**
 * Fase 3.10 — Adapter Projeto → Cena de vídeo. Não muta o projeto.
 */
import type { PlannerProject, PlannerRoom } from "@/modules/planner/shared/types/project";
import type { VideoScene, VideoSceneSummary } from "../types";

function isLight(role?: string, kind?: string): boolean {
  if (role === "light") return true;
  if (!kind) return false;
  return /light|led|spot|lamp|luminaria|pendente|perfil|abajur|plafon/i.test(kind);
}
function isOpenable(role?: string, kind?: string, params?: Record<string, unknown>): boolean {
  if (role === "door" || role === "drawer") return true;
  if (kind === "opening") return true;
  if (typeof params?.openable === "boolean" && params.openable) return true;
  return false;
}

export function buildVideoScene(
  project: PlannerProject,
  roomId: string | null | undefined,
  fps: number,
  durationSec: number,
): VideoScene {
  let rooms: readonly PlannerRoom[] = project.environments.flatMap((e) => e.rooms);
  if (roomId) rooms = rooms.filter((r) => r.id === roomId);

  let moduleNodeCount = 0;
  let openableNodeCount = 0;
  let lightNodeCount = 0;
  let decorNodeCount = 0;

  for (const r of rooms) {
    const nodes =
      (
        r as unknown as {
          nodes?: Record<string, { kind?: string; params?: Record<string, unknown> }>;
        }
      ).nodes ?? {};
    for (const n of Object.values(nodes)) {
      const params = n.params ?? {};
      const role = typeof params.role === "string" ? params.role : undefined;
      const kind = typeof n.kind === "string" ? n.kind : undefined;
      if (isLight(role, kind)) lightNodeCount += 1;
      else if (isOpenable(role, kind, params)) openableNodeCount += 1;
      else if (role === "decor") decorNodeCount += 1;
      else if (kind === "module") moduleNodeCount += 1;
    }
  }

  const summary: VideoSceneSummary = {
    projectId: project.id,
    projectVersion: project.version,
    environmentCount: roomId ? 1 : project.environments.length,
    roomCount: rooms.length,
    moduleNodeCount,
    openableNodeCount,
    lightNodeCount,
    decorNodeCount,
    estimatedFrameCount: Math.ceil(fps * durationSec),
  };

  return { source: project, summary };
}
