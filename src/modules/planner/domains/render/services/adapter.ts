/**
 * Fase 3.9 — Adapter Projeto → Cena de Render.
 *
 * Não muta o projeto. Apenas produz um resumo determinístico para o
 * pipeline consumir.
 */
import type { PlannerProject, PlannerRoom } from "@/modules/planner/shared/types/project";
import type { RenderScene, RenderSceneSummary } from "../types";

function isLightNode(role?: string, kind?: string): boolean {
  if (role === "light") return true;
  if (!kind) return false;
  return /light|led|spot|lamp|luminaria|pendente|perfil|abajur|plafon/i.test(kind);
}

function roomFloorAreaMm2(room: PlannerRoom): number {
  const dims = (room as unknown as { dimensions?: { widthMm?: number; depthMm?: number } })
    .dimensions;
  const w = dims?.widthMm ?? 0;
  const d = dims?.depthMm ?? 0;
  return w * d;
}

export function buildRenderScene(project: PlannerProject, roomId?: string | null): RenderScene {
  let rooms: readonly PlannerRoom[] = project.environments.flatMap((e) => e.rooms);
  if (roomId) rooms = rooms.filter((r) => r.id === roomId);

  let nodeCount = 0;
  let lightNodeCount = 0;
  let moduleNodeCount = 0;
  let decorNodeCount = 0;
  let wallCount = 0;
  let floorAreaMm2 = 0;

  for (const r of rooms) {
    const walls = (r as unknown as { walls?: readonly unknown[] }).walls;
    wallCount += walls?.length ?? 0;
    floorAreaMm2 += roomFloorAreaMm2(r);
    const nodes =
      (r as unknown as { nodes?: readonly { kind?: string; params?: Record<string, unknown> }[] })
        .nodes ?? [];
    for (const n of nodes) {
      nodeCount += 1;
      const params = n.params ?? {};
      const role = typeof params.role === "string" ? params.role : undefined;
      const kind = typeof n.kind === "string" ? n.kind : undefined;
      if (isLightNode(role, kind)) lightNodeCount += 1;
      else if (role === "decor") decorNodeCount += 1;
      else if (kind === "module") moduleNodeCount += 1;
    }
  }

  const summary: RenderSceneSummary = {
    projectId: project.id,
    projectVersion: project.version,
    environmentCount: roomId ? 1 : project.environments.length,
    roomCount: rooms.length,
    nodeCount,
    lightNodeCount,
    moduleNodeCount,
    decorNodeCount,
    wallCount,
    floorAreaMm2,
  };

  return { source: project, summary };
}
