import {
  insertItemIntoProject,
  REAL_DEPTH_BY_SUBTYPE,
  WALL_OFFSET_MM,
} from "@/modules/planner/shared";
import { matchDescription } from "./matcher";
/** Ordem canônica de paredes para cada shape. */
function wallsFor(shape) {
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
function placementFor(wall, offset, item, width, depth, roomW, roomD) {
  // `at` recebe centro do móvel — `insertItemIntoProject` faz cx - width/2.
  // A rotação segue a convenção do editor (0 = frente para o interior).
  // Paredes têm espessura ~100mm (centralizadas no perímetro do cômodo),
  // então metade fica DENTRO do cômodo. Somamos esse offset + 2mm de folga
  // para o fundo do móvel ficar flush com a face interna da parede, sem
  // atravessar.
  const WALL_OFFSET = WALL_OFFSET_MM;
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
function wallLength(wall, roomW, roomD) {
  return wall === "bottom" || wall === "top" ? roomW : roomD;
}
const GAP_MM = 20;
const MARGIN_MM = 40;
// Reserva do canto — quando duas paredes ativas se encontram, o módulo do
// canto ocupa uma caixa de ~600mm × 600mm. Sem essa reserva, a peça inicial
// de uma parede sobrepõe a peça inicial da parede vizinha (auditoria confirmou).
const CORNER_RESERVE_MM = 620;
const ADJ = {
  bottom: { start: "left", end: "right" },
  top: { start: "left", end: "right" },
  left: { start: "bottom", end: "top" },
  right: { start: "bottom", end: "top" },
};
function cornerReserve(wall, walls) {
  const adj = ADJ[wall];
  return {
    start: walls.includes(adj.start) ? CORNER_RESERVE_MM : 0,
    end: walls.includes(adj.end) ? CORNER_RESERVE_MM : 0,
  };
}
/**
 * Aplica um layout completo. `pieces` é interpretada em ordem — cada
 * item usa o `matcher` para descobrir o CatalogItem, dimensões e params.
 */
export function applyLayout(project, target, args) {
  const env = project.environments.find((e) => e.id === target.environmentId);
  const room = env?.rooms.find((r) => r.id === target.roomId);
  if (!room) {
    return { project, placed: 0, skipped: 0, reasons: ["cômodo não encontrado"] };
  }
  const roomW = room.dimensions.width;
  const roomD = room.dimensions.depth;
  const baseWalls = wallsFor(args.shape);
  const requestedWalls = args.pieces.map((piece) => piece.wall).filter((wall) => Boolean(wall));
  const walls = Array.from(new Set([...baseWalls, ...requestedWalls]));
  const reserves = {
    bottom: cornerReserve("bottom", walls),
    top: cornerReserve("top", walls),
    left: cornerReserve("left", walls),
    right: cornerReserve("right", walls),
  };
  const cursors = {
    bottom: { wall: "bottom", offset: MARGIN_MM + reserves.bottom.start },
    top: { wall: "top", offset: MARGIN_MM + reserves.top.start },
    left: { wall: "left", offset: MARGIN_MM + reserves.left.start },
    right: { wall: "right", offset: MARGIN_MM + reserves.right.start },
  };
  // fila circular sobre as paredes disponíveis, para dividir peso.
  let wallIdx = 0;
  const nextWall = (preferred) => {
    if (preferred && walls.includes(preferred)) return preferred;
    const w = walls[wallIdx % walls.length];
    wallIdx++;
    return w;
  };
  let next = project;
  let placed = 0;
  let skipped = 0;
  const reasons = [];
  for (const spec of args.pieces) {
    const count = Math.max(1, Math.min(20, spec.count ?? 1));
    const match = matchDescription(spec.description);
    if (!match) {
      skipped += count;
      reasons.push(`ignorado: "${spec.description}" (sem casamento)`);
      continue;
    }
    const width = spec.width ?? match.overrides.width ?? match.item.parametric.defaults.width;
    const depth =
      spec.depth ??
      match.overrides.depth ??
      REAL_DEPTH_BY_SUBTYPE[String(match.item.subtype)] ??
      match.item.parametric.defaults.depth;
    const height = spec.height ?? match.overrides.height ?? match.item.parametric.defaults.height;
    for (let i = 0; i < count; i++) {
      // Tolerância zero: tenta parede preferida primeiro, depois qualquer
      // outra da forma escolhida (L/U/paralela). Só marca skipped quando
      // TODAS as paredes disponíveis estiverem cheias.
      const preferred = spec.wall && walls.includes(spec.wall) ? spec.wall : undefined;
      const order = preferred ? [preferred, ...walls.filter((w) => w !== preferred)] : [nextWall()];
      // Se `order` só tem 1 parede (fila circular), garante fallback total.
      const tryOrder = preferred ? order : [order[0], ...walls.filter((w) => w !== order[0])];
      let wall = null;
      for (const w of tryOrder) {
        const c = cursors[w];
        const len = wallLength(w, roomW, roomD) - reserves[w].end;
        if (c.offset + width + MARGIN_MM <= len) {
          wall = w;
          break;
        }
      }
      if (!wall) {
        skipped++;
        reasons.push(`sem parede disponível — ${match.item.name} ignorado (largura ${width}mm)`);
        continue;
      }
      const cur = cursors[wall];
      const place = placementFor(wall, cur.offset, match.item, width, depth, roomW, roomD);
      next = insertItemIntoProject(next, target, match.item, {
        at: place.at,
        rotation: place.rotation,
        overrides: { width, depth, height },
        params: match.params,
        materialId: match.materialId,
      });
      cur.offset += width + GAP_MM;
      placed++;
    }
  }
  return { project: next, placed, skipped, reasons };
}
