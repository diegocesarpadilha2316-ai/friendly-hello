/**
 * Fase 3.30 — Scene Builder Real.
 *
 * Consome `PlannerProject`, `PlannerRoom` e `PlannerParametricNode` para
 * produzir uma `RealScene` com objetos, luzes, materiais, câmeras e HDRI.
 * Nenhum estado global. Puro/determinístico.
 */
import type { PlannerParametricNode, PlannerProject } from "@/modules/planner/shared/types/project";
import { buildRenderScene } from "../services/adapter";
import { RENDER_CAMERAS } from "../services/cameras";
import { RENDER_HDRIS, RENDER_LIGHT_PRESETS } from "../services/lighting";
import { PBR_MATERIALS, getMaterial } from "../services/materials";
import type { RealLight, RealObject, RealObjectKind, RealScene } from "./types";

function classifyKind(node: PlannerParametricNode): RealObjectKind | null {
  const role = typeof node.params.role === "string" ? String(node.params.role).toLowerCase() : "";
  const label = node.label.toLowerCase();
  if (node.kind === "wall") return "wall";
  if (node.kind === "opening") return "opening";
  if (node.kind === "material") return "decor";
  if (node.kind === "hardware") {
    if (/led|fita|perfil.*led/.test(label)) return "led";
    return "hardware";
  }
  if (node.kind === "module") {
    if (/gaveta/.test(label)) return "drawer";
    if (/porta/.test(label)) return "door";
    if (/prateleira/.test(label)) return "shelf";
    if (/vidro/.test(label) || role === "vidro") return "glass";
    if (/espelho/.test(label) || role === "espelho") return "mirror";
    return "module";
  }
  if (node.kind === "floor") return "floor";
  if (node.kind === "ceiling") return "ceiling";
  return null;
}

function resolveMaterialId(node: PlannerParametricNode): string | null {
  const raw = node.params.materialId ?? node.params.material ?? null;
  if (typeof raw !== "string" || !raw) return null;
  return getMaterial(raw) ? raw : raw;
}

function isEmissiveNode(node: PlannerParametricNode): number {
  const v = node.params.emissive;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return 0;
}

export function buildRealScene(project: PlannerProject, roomId: string | null = null): RealScene {
  const base = buildRenderScene(project, roomId);
  const objects: RealObject[] = [];
  const lights: RealLight[] = [];

  for (const env of project.environments) {
    for (const room of env.rooms) {
      if (roomId && room.id !== roomId) continue;
      // piso + teto virtuais (derivados das dimensões)
      objects.push({
        id: `${room.id}::floor`,
        kind: "floor",
        roomId: room.id,
        materialId: null,
        emissive: 0,
        castsShadow: false,
        receivesShadow: true,
      });
      objects.push({
        id: `${room.id}::ceiling`,
        kind: "ceiling",
        roomId: room.id,
        materialId: null,
        emissive: 0,
        castsShadow: false,
        receivesShadow: true,
      });
      for (const nodeId of room.nodeOrder) {
        const node = room.nodes[nodeId];
        if (!node) continue;
        const kind = classifyKind(node);
        if (!kind) continue;
        const emissive = isEmissiveNode(node);
        if (kind === "led" || emissive > 0) {
          lights.push({
            id: `${room.id}::${node.id}::light`,
            roomId: room.id,
            presetId: kind === "led" ? "light.led.strip.warm" : "light.area.softbox",
            intensity: emissive > 0 ? emissive * 350 : 350,
            temperatureK: 2700,
            castsShadows: false,
          });
        }
        objects.push({
          id: `${room.id}::${node.id}`,
          kind,
          roomId: room.id,
          materialId: resolveMaterialId(node),
          emissive,
          castsShadow: kind !== "opening" && kind !== "led",
          receivesShadow: kind !== "opening",
        });
      }
    }
  }

  const hdri = RENDER_HDRIS.find((h) => h.id === "hdri.interior.day") ?? RENDER_HDRIS[0] ?? null;

  return {
    base,
    summary: base.summary,
    objects,
    lights,
    hdri,
    cameras: RENDER_CAMERAS,
    materials: PBR_MATERIALS,
    extraLights: RENDER_LIGHT_PRESETS,
  };
}
