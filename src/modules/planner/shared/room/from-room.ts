/**
 * Ponte PlannerRoom → Room Architecture Engine.
 *
 * Lê os nós já persistidos (paredes, aberturas, módulos) e produz a spec
 * arquitetônica + as caixas de móveis para validação. Puro e sem I/O.
 */
import type { PlannerParametricNode, PlannerRoom } from "../types/project";
import { ROOM_DEFAULTS } from "./engine";
import type {
  RoomArchitectureSpec,
  RoomDoorSpec,
  RoomFurnitureBox,
  RoomWallSide,
  RoomWindowSpec,
} from "./types";

const num = (n: PlannerParametricNode, key: string, fallback = 0): number => {
  const v = n.params[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
};
const str = (n: PlannerParametricNode, key: string): string | undefined => {
  const v = n.params[key];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
};

function sideForOpening(
  n: PlannerParametricNode,
  widthMm: number,
  depthMm: number,
): RoomWallSide {
  const x = num(n, "x");
  const z = num(n, "y");
  const distances: readonly [RoomWallSide, number][] = [
    ["front", Math.abs(z)],
    ["back", Math.abs(depthMm - z)],
    ["left", Math.abs(x)],
    ["right", Math.abs(widthMm - x)],
  ];
  return distances.reduce((best, cur) => (cur[1] < best[1] ? cur : best))[0];
}

export function roomArchitectureSpecFrom(room: PlannerRoom): RoomArchitectureSpec {
  const widthMm = room.dimensions.width;
  const depthMm = room.dimensions.depth;
  const nodes = room.nodeOrder.map((id) => room.nodes[id]).filter(Boolean) as PlannerParametricNode[];
  const wallNode = nodes.find((n) => n.kind === "wall");
  const wallThicknessMm = wallNode
    ? num(wallNode, "thickness", ROOM_DEFAULTS.wallThicknessMm)
    : ROOM_DEFAULTS.wallThicknessMm;

  const doors: RoomDoorSpec[] = [];
  const windows: RoomWindowSpec[] = [];
  for (const n of nodes) {
    if (n.kind !== "opening") continue;
    const side = sideForOpening(n, widthMm, depthMm);
    const w = num(n, "width", ROOM_DEFAULTS.windowWidthMm);
    const horizontal = side === "front" || side === "back";
    const along = horizontal ? num(n, "x") : num(n, "y");
    const span = horizontal ? widthMm : depthMm;
    const offsetMm = Math.max(0, Math.min(span - w, Math.round(along - w / 2)));
    const role = str(n, "role") ?? "window";
    if (role === "door") {
      doors.push({
        id: n.id,
        wall: side,
        offsetMm,
        widthMm: w,
        heightMm: num(n, "height", ROOM_DEFAULTS.doorHeightMm),
      });
    } else {
      windows.push({
        id: n.id,
        wall: side,
        offsetMm,
        widthMm: w,
        heightMm: num(n, "height", ROOM_DEFAULTS.windowHeightMm),
        sillHeightMm: num(n, "sillHeight", ROOM_DEFAULTS.windowSillHeightMm),
      });
    }
  }

  return {
    id: room.id,
    widthMm,
    depthMm,
    heightMm: room.dimensions.height || ROOM_DEFAULTS.heightMm,
    wallThicknessMm,
    doors,
    windows,
  };
}

/** Caixas dos móveis do cômodo, no mesmo referencial da arquitetura. */
export function roomFurnitureBoxesFrom(room: PlannerRoom): readonly RoomFurnitureBox[] {
  const boxes: RoomFurnitureBox[] = [];
  for (const id of room.nodeOrder) {
    const n = room.nodes[id];
    if (!n || n.kind !== "module") continue;
    const widthMm = num(n, "width");
    const depthMm = num(n, "depth");
    const heightMm = num(n, "height");
    if (widthMm <= 0 || depthMm <= 0 || heightMm <= 0) continue;
    const subtype = str(n, "subtype") ?? str(n, "mod:type") ?? "";
    const suspended = /aereo|nicho|prateleira|suspens/i.test(subtype);
    boxes.push({
      id: n.id,
      x: num(n, "x"),
      z: num(n, "y"),
      widthMm,
      depthMm,
      heightMm,
      bottomMm: num(n, "mount:y", suspended ? 1400 : 0),
      suspended,
    });
  }
  return boxes;
}