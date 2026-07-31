/**
 * ROOM QUERY — única porta de consulta usada pelas famílias de móveis.
 *
 * Os móveis NÃO criam mais ambiente: eles perguntam ao Room Engine a
 * cota do piso, a espessura/limite das paredes, a altura do ambiente e
 * as posições de portas e janelas. Nenhuma lógica duplicada.
 */
import type {
  RoomArchitecture,
  RoomDoor,
  RoomWall,
  RoomWallSide,
  RoomWindow,
} from "./types";

export interface RoomQuery {
  /** cota do piso onde todo móvel deve nascer apoiado (mm) */
  floorLevelMm: number;
  /** altura livre do ambiente (mm) */
  roomHeightMm: number;
  wallThicknessMm: number;
  inner: RoomArchitecture["inner"];
  wall(side: RoomWallSide): RoomWall | undefined;
  /** coordenada da face interna da parede (x para left/right, z para front/back) */
  wallFaceMm(side: RoomWallSide): number;
  /** extensão útil da parede (mm) */
  wallLimitMm(side: RoomWallSide): number;
  doorsOnWall(side: RoomWallSide): readonly RoomDoor[];
  windowsOnWall(side: RoomWallSide): readonly RoomWindow[];
  /** faixas livres (mm, ao longo da parede) descontando portas e janelas baixas */
  freeRunsOnWall(side: RoomWallSide, opts?: { maxHeightMm?: number }): readonly { startMm: number; endMm: number }[];
}

export function createRoomQuery(arch: RoomArchitecture): RoomQuery {
  const bySide = new Map(arch.walls.map((w) => [w.side, w] as const));
  return {
    floorLevelMm: arch.floor.levelMm,
    roomHeightMm: arch.inner.heightMm,
    wallThicknessMm: arch.walls[0]?.thicknessMm ?? 0,
    inner: arch.inner,
    wall: (side) => bySide.get(side),
    wallFaceMm: (side) => bySide.get(side)?.innerFaceMm ?? 0,
    wallLimitMm: (side) => bySide.get(side)?.openingSpanMm ?? 0,
    doorsOnWall: (side) => arch.doors.filter((d) => d.side === side),
    windowsOnWall: (side) => arch.windows.filter((w) => w.side === side),
    freeRunsOnWall: (side, opts) => {
      const wall = bySide.get(side);
      if (!wall) return [];
      const maxH = opts?.maxHeightMm ?? arch.inner.heightMm;
      const holes = wall.cutouts
        .filter((c) => c.bottomMm < maxH)
        .map((c) => ({ startMm: c.startMm, endMm: c.endMm }))
        .sort((a, b) => a.startMm - b.startMm);
      const runs: { startMm: number; endMm: number }[] = [];
      let cursor = 0;
      for (const hole of holes) {
        if (hole.startMm - cursor > 1) runs.push({ startMm: cursor, endMm: hole.startMm });
        cursor = Math.max(cursor, hole.endMm);
      }
      if (wall.openingSpanMm - cursor > 1) runs.push({ startMm: cursor, endMm: wall.openingSpanMm });
      return runs;
    },
  };
}