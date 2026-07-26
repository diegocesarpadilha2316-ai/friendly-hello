/**
 * Motor de layout — Parte 3 do Copiloto.
 *
 * Distribui peças ao longo das paredes do cômodo em configurações
 * `linear`, `L`, `U` ou `paralela`. Retorna um novo `PlannerProject`
 * via `insertItemIntoProject` — sem novos providers/stores.
 *
 * Coordenadas do editor 2D:
 *   x → largura do cômodo (parede inferior em y=0, superior em y=depth)
 *   y → profundidade
 *   rotação em graus (0 = frente virada para +y, 90 = frente para +x, etc.)
 */
import type { PlannerProject } from "@/modules/planner/shared";
import { insertItemIntoProject, type CatalogItem } from "@/modules/planner/shared";
import { matchDescription } from "./matcher";

export type LayoutShape = "linear" | "L" | "U" | "paralela";

export interface LayoutPieceSpec {
  description: string;
  count?: number;
  /** parede preferida (bottom/top/left/right) — opcional */
  wall?: LayoutWall;
}

export type LayoutWall = "bottom" | "top" | "left" | "right";

export interface LayoutTarget {
  environmentId: string;
  roomId: string;
}

export interface LayoutResult {
  project: PlannerProject;
  placed: number;
  skipped: number;
  reasons: string[];
}

/** Ordem canônica de paredes para cada shape. */
function wallsFor(shape: LayoutShape): LayoutWall[] {
  switch (shape) {
    case "linear":
      return ["bottom"];
    case "L":
      return ["bottom", "right"];
    case "U":
      return ["left", "bottom", "right"];
    case "paralela":
      return ["bottom", "top"];
  }
}

interface Cursor {
  wall: LayoutWall;
  /** próximo offset livre ao longo da parede, em mm */
  offset: number;
}

function placementFor(
  wall: LayoutWall,
  offset: number,
  item: CatalogItem,
  width: number,
  depth: number,
  roomW: number,
  roomD: number,
) {
  // `at` recebe centro do móvel — `insertItemIntoProject` faz cx - width/2.
  // A rotação segue a convenção do editor (0 = frente para o interior).
  // Paredes têm espessura ~100mm (centralizadas no perímetro do cômodo),
  // então metade fica DENTRO do cômodo. Somamos esse offset + 2mm de folga
  // para o fundo do móvel ficar flush com a face interna da parede, sem
  // atravessar.
  const WALL_OFFSET = 50 + 2;
  const halfW = width / 2;
  const halfD = depth / 2;
  switch (wall) {
    case "bottom":
      return { at: { x: offset + halfW, y: WALL_OFFSET + halfD }, rotation: 0 };
    case "top":
      return { at: { x: offset + halfW, y: roomD - WALL_OFFSET - halfD }, rotation: 180 };
    case "left":
      return { at: { x: WALL_OFFSET + halfD, y: offset + halfW }, rotation: 270 };
    case "right":
      return { at: { x: roomW - WALL_OFFSET - halfD, y: offset + halfW }, rotation: 90 };
  }
  // exhaustiveness (item usado só para futura variação por subtype)
  return { at: { x: roomW / 2, y: roomD / 2 }, rotation: 0 };
}

function wallLength(wall: LayoutWall, roomW: number, roomD: number): number {
  return wall === "bottom" || wall === "top" ? roomW : roomD;
}

const GAP_MM = 20;
const MARGIN_MM = 40;

/**
 * Aplica um layout completo. `pieces` é interpretada em ordem — cada
 * item usa o `matcher` para descobrir o CatalogItem, dimensões e params.
 */
export function applyLayout(
  project: PlannerProject,
  target: LayoutTarget,
  args: { shape: LayoutShape; pieces: readonly LayoutPieceSpec[] },
): LayoutResult {
  const env = project.environments.find((e) => e.id === target.environmentId);
  const room = env?.rooms.find((r) => r.id === target.roomId);
  if (!room) {
    return { project, placed: 0, skipped: 0, reasons: ["cômodo não encontrado"] };
  }
  const roomW = room.dimensions.width;
  const roomD = room.dimensions.depth;

  const walls = wallsFor(args.shape);
  const cursors: Record<LayoutWall, Cursor> = {
    bottom: { wall: "bottom", offset: MARGIN_MM },
    top: { wall: "top", offset: MARGIN_MM },
    left: { wall: "left", offset: MARGIN_MM },
    right: { wall: "right", offset: MARGIN_MM },
  };

  // fila circular sobre as paredes disponíveis, para dividir peso.
  let wallIdx = 0;
  const nextWall = (preferred?: LayoutWall): LayoutWall => {
    if (preferred && walls.includes(preferred)) return preferred;
    const w = walls[wallIdx % walls.length];
    wallIdx++;
    return w;
  };

  let next = project;
  let placed = 0;
  let skipped = 0;
  const reasons: string[] = [];

  for (const spec of args.pieces) {
    const count = Math.max(1, Math.min(20, spec.count ?? 1));
    const match = matchDescription(spec.description);
    if (!match) {
      skipped += count;
      reasons.push(`ignorado: "${spec.description}" (sem casamento)`);
      continue;
    }
    const width = match.overrides.width ?? match.item.parametric.defaults.width;
    const depth = match.overrides.depth ?? match.item.parametric.defaults.depth;
    const height = match.overrides.height ?? match.item.parametric.defaults.height;

    for (let i = 0; i < count; i++) {
      const wall = nextWall(spec.wall);
      const cur = cursors[wall];
      const len = wallLength(wall, roomW, roomD);
      if (cur.offset + width + MARGIN_MM > len) {
        skipped++;
        reasons.push(`parede ${wall} cheia — ${match.item.name} ignorado`);
        continue;
      }
      const place = placementFor(wall, cur.offset, match.item, width, depth, roomW, roomD);
      next = insertItemIntoProject(next, target, match.item, {
        at: place.at,
        rotation: place.rotation,
        overrides: { width, depth, height },
        params: match.params,
      });
      cur.offset += width + GAP_MM;
      placed++;
    }
  }

  return { project: next, placed, skipped, reasons };
}
