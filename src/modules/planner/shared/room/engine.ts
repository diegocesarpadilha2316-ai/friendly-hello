/**
 * ROOM ARCHITECTURE ENGINE — geração determinística da arquitetura do
 * ambiente (piso, paredes, teto, rodapés, portas, janelas, peitoris).
 *
 * Regras:
 *  - Puro: nenhuma I/O, nenhum three.js, nenhuma dependência de móveis.
 *  - Determinístico: mesma spec → mesma arquitetura.
 *  - Unidade: milímetros. Topo do piso em Y = 0.
 */
import {
  ROOM_HEIGHTS_MM,
  ROOM_WALL_THICKNESSES_MM,
  type RoomArchitecture,
  type RoomArchitectureSpec,
  type RoomBaseboardSegment,
  type RoomCeiling,
  type RoomDoor,
  type RoomFloor,
  type RoomIssue,
  type RoomPoint,
  type RoomSill,
  type RoomWall,
  type RoomWallCutout,
  type RoomWallSide,
  type RoomWindow,
} from "./types";

export const ROOM_DEFAULTS = {
  heightMm: 2700,
  wallThicknessMm: 100,
  floorThicknessMm: 80,
  ceilingThicknessMm: 120,
  baseboard: { heightMm: 100, thicknessMm: 15, recessMm: 0, continuous: true },
  doorWidthMm: 800,
  doorHeightMm: 2100,
  doorLeafThicknessMm: 35,
  doorFrameMm: 40,
  windowWidthMm: 1200,
  windowHeightMm: 1100,
  windowSillHeightMm: 1000,
  sillDepthMm: 30,
  sillThicknessMm: 30,
  sillOverhangMm: 20,
  windowFrameMm: 50,
} as const;

const round = (v: number): number => Math.round(v * 1000) / 1000;

function normalizeSpec(spec: RoomArchitectureSpec): Required<
  Pick<
    RoomArchitectureSpec,
    | "widthMm"
    | "depthMm"
    | "heightMm"
    | "wallThicknessMm"
    | "floorThicknessMm"
    | "ceilingThicknessMm"
    | "ceilingKind"
    | "ceilingDropMm"
  >
> {
  return {
    widthMm: Math.max(1, Math.round(spec.widthMm)),
    depthMm: Math.max(1, Math.round(spec.depthMm)),
    heightMm: Math.max(1, Math.round(spec.heightMm ?? ROOM_DEFAULTS.heightMm)),
    wallThicknessMm: Math.max(1, Math.round(spec.wallThicknessMm ?? ROOM_DEFAULTS.wallThicknessMm)),
    floorThicknessMm: Math.max(1, Math.round(spec.floorThicknessMm ?? ROOM_DEFAULTS.floorThicknessMm)),
    ceilingThicknessMm: Math.max(
      1,
      Math.round(spec.ceilingThicknessMm ?? ROOM_DEFAULTS.ceilingThicknessMm),
    ),
    ceilingKind: spec.ceilingKind ?? "laje",
    ceilingDropMm: Math.max(0, Math.round(spec.ceilingDropMm ?? 0)),
  };
}

/** Altura livre real (piso → face inferior do teto/forro). */
export function roomClearHeightMm(spec: RoomArchitectureSpec): number {
  const n = normalizeSpec(spec);
  const drop = n.ceilingKind === "rebaixo" ? n.ceilingDropMm : 0;
  return Math.max(1, n.heightMm - drop);
}

function buildWalls(input: {
  id: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  thicknessMm: number;
  materialId?: string;
}): RoomWall[] {
  const { id, widthMm: W, depthMm: D, heightMm: H, thicknessMm: t, materialId } = input;
  const base = (
    side: RoomWallSide,
    start: RoomPoint,
    end: RoomPoint,
    lengthMm: number,
    orientationDeg: number,
    innerNormal: RoomPoint,
    innerFaceMm: number,
    outerFaceMm: number,
    openingSpanMm: number,
    corners: RoomPoint[],
  ): RoomWall => ({
    id: `${id}_wall_${side}`,
    side,
    lengthMm,
    heightMm: H,
    thicknessMm: t,
    orientationDeg,
    start,
    end,
    center: { x: round((start.x + end.x) / 2), z: round((start.z + end.z) / 2) },
    openingSpanMm,
    innerNormal,
    innerFaceMm,
    outerFaceMm,
    corners,
    joints: [],
    materialId,
    cutouts: [],
  });

  const walls: RoomWall[] = [
    base(
      "front",
      { x: -t, z: -t / 2 },
      { x: W + t, z: -t / 2 },
      W + 2 * t,
      0,
      { x: 0, z: 1 },
      0,
      -t,
      W,
      [
        { x: -t, z: -t },
        { x: W + t, z: -t },
        { x: W + t, z: 0 },
        { x: -t, z: 0 },
      ],
    ),
    base(
      "back",
      { x: -t, z: D + t / 2 },
      { x: W + t, z: D + t / 2 },
      W + 2 * t,
      180,
      { x: 0, z: -1 },
      D,
      D + t,
      W,
      [
        { x: -t, z: D },
        { x: W + t, z: D },
        { x: W + t, z: D + t },
        { x: -t, z: D + t },
      ],
    ),
    base(
      "left",
      { x: -t / 2, z: 0 },
      { x: -t / 2, z: D },
      D,
      90,
      { x: 1, z: 0 },
      0,
      -t,
      D,
      [
        { x: -t, z: 0 },
        { x: 0, z: 0 },
        { x: 0, z: D },
        { x: -t, z: D },
      ],
    ),
    base(
      "right",
      { x: W + t / 2, z: 0 },
      { x: W + t / 2, z: D },
      D,
      270,
      { x: -1, z: 0 },
      W,
      W + t,
      D,
      [
        { x: W, z: 0 },
        { x: W + t, z: 0 },
        { x: W + t, z: D },
        { x: W, z: D },
      ],
    ),
  ];

  // Encontros: horizontais encontram verticais em todas as quinas.
  const horizontal = walls.filter((w) => w.side === "front" || w.side === "back");
  const vertical = walls.filter((w) => w.side === "left" || w.side === "right");
  for (const h of horizontal) {
    (h as unknown as { joints: readonly string[] }).joints = vertical.map((v) => v.id);
  }
  for (const v of vertical) {
    (v as unknown as { joints: readonly string[] }).joints = horizontal.map((h) => h.id);
  }
  return walls;
}

/** Ponto no mundo para um offset ao longo da face interna da parede. */
export function pointOnWall(wall: RoomWall, alongMm: number, insetMm = 0): RoomPoint {
  if (wall.side === "front" || wall.side === "back") {
    return { x: round(alongMm), z: round(wall.innerFaceMm + wall.innerNormal.z * insetMm) };
  }
  return { x: round(wall.innerFaceMm + wall.innerNormal.x * insetMm), z: round(alongMm) };
}

function subtractRanges(
  span: { start: number; end: number },
  holes: readonly { startMm: number; endMm: number }[],
): { start: number; end: number }[] {
  let segments = [span];
  for (const hole of [...holes].sort((a, b) => a.startMm - b.startMm)) {
    const next: { start: number; end: number }[] = [];
    for (const seg of segments) {
      if (hole.endMm <= seg.start || hole.startMm >= seg.end) {
        next.push(seg);
        continue;
      }
      if (hole.startMm > seg.start) next.push({ start: seg.start, end: hole.startMm });
      if (hole.endMm < seg.end) next.push({ start: hole.endMm, end: seg.end });
    }
    segments = next;
  }
  return segments.filter((s) => s.end - s.start > 1);
}

export function buildRoomArchitecture(spec: RoomArchitectureSpec): RoomArchitecture {
  const n = normalizeSpec(spec);
  const id = spec.id ?? "room";
  const issues: RoomIssue[] = [];
  const W = n.widthMm;
  const D = n.depthMm;
  const t = n.wallThicknessMm;
  const clearH = roomClearHeightMm(spec);

  if (spec.widthMm <= 0 || spec.depthMm <= 0) {
    issues.push({
      code: "invalid-dimension",
      message: "Largura e profundidade do ambiente devem ser positivas.",
      severity: "error",
      targetId: id,
    });
  }
  if (!ROOM_HEIGHTS_MM.includes(n.heightMm as (typeof ROOM_HEIGHTS_MM)[number])) {
    issues.push({
      code: "invalid-height",
      message: `Pé-direito ${n.heightMm} mm fora dos valores padrão (${ROOM_HEIGHTS_MM.join(", ")}).`,
      severity: "warning",
      targetId: id,
    });
  }
  if (
    !ROOM_WALL_THICKNESSES_MM.includes(
      n.wallThicknessMm as (typeof ROOM_WALL_THICKNESSES_MM)[number],
    )
  ) {
    issues.push({
      code: "invalid-thickness",
      message: `Espessura de parede ${t} mm fora dos valores padrão (${ROOM_WALL_THICKNESSES_MM.join(", ")}).`,
      severity: "warning",
      targetId: id,
    });
  }

  const walls = buildWalls({
    id,
    widthMm: W,
    depthMm: D,
    heightMm: clearH,
    thicknessMm: t,
    materialId: spec.materials?.wall,
  });
  const wallBySide = new Map<RoomWallSide, RoomWall>(walls.map((w) => [w.side, w]));
  const cutoutsByWall = new Map<string, RoomWallCutout[]>(walls.map((w) => [w.id, []]));

  // ── PORTAS ──
  const doors: RoomDoor[] = [];
  (spec.doors ?? []).forEach((d, index) => {
    const wall = wallBySide.get(d.wall);
    if (!wall) return;
    const doorId = d.id ?? `${id}_door_${index + 1}`;
    const width = Math.max(1, Math.round(d.widthMm ?? ROOM_DEFAULTS.doorWidthMm));
    const height = Math.max(1, Math.round(d.heightMm ?? ROOM_DEFAULTS.doorHeightMm));
    const offset = Math.round(d.offsetMm);
    if (offset < 0 || offset + width > wall.openingSpanMm) {
      issues.push({
        code: "door-out-of-wall",
        message: `Porta ${doorId} está fora da parede ${wall.side} (vão ${offset}..${offset + width} de ${wall.openingSpanMm} mm).`,
        severity: "error",
        targetId: doorId,
      });
      return;
    }
    if (height > clearH) {
      issues.push({
        code: "door-above-ceiling",
        message: `Porta ${doorId} (${height} mm) é mais alta que o pé-direito livre (${clearH} mm).`,
        severity: "error",
        targetId: doorId,
      });
      return;
    }
    const cutout: RoomWallCutout = {
      id: doorId,
      kind: "door",
      startMm: offset,
      endMm: offset + width,
      bottomMm: 0,
      topMm: height,
    };
    cutoutsByWall.get(wall.id)?.push(cutout);
    doors.push({
      id: doorId,
      wallId: wall.id,
      side: wall.side,
      widthMm: width,
      heightMm: height,
      bottomMm: 0,
      offsetMm: offset,
      center: pointOnWall(wall, offset + width / 2, -t / 2),
      orientationDeg: wall.orientationDeg,
      swing: d.swing ?? "in",
      hinge: d.hinge ?? "left",
      leaf: {
        widthMm: width - 2 * (d.frameMm ?? ROOM_DEFAULTS.doorFrameMm),
        heightMm: height - (d.frameMm ?? ROOM_DEFAULTS.doorFrameMm),
        thicknessMm: d.leafThicknessMm ?? ROOM_DEFAULTS.doorLeafThicknessMm,
      },
      frame: { widthMm: d.frameMm ?? ROOM_DEFAULTS.doorFrameMm, depthMm: t },
      materialId: d.materialId,
    });
  });

  // ── JANELAS + PEITORIS ──
  const windows: RoomWindow[] = [];
  const sills: RoomSill[] = [];
  (spec.windows ?? []).forEach((w, index) => {
    const wall = wallBySide.get(w.wall);
    if (!wall) return;
    const winId = w.id ?? `${id}_window_${index + 1}`;
    const width = Math.max(1, Math.round(w.widthMm ?? ROOM_DEFAULTS.windowWidthMm));
    const height = Math.max(1, Math.round(w.heightMm ?? ROOM_DEFAULTS.windowHeightMm));
    const sillH = Math.max(0, Math.round(w.sillHeightMm ?? ROOM_DEFAULTS.windowSillHeightMm));
    const offset = Math.round(w.offsetMm);
    if (offset < 0 || offset + width > wall.openingSpanMm) {
      issues.push({
        code: "window-out-of-wall",
        message: `Janela ${winId} está fora da parede ${wall.side} (vão ${offset}..${offset + width} de ${wall.openingSpanMm} mm).`,
        severity: "error",
        targetId: winId,
      });
      return;
    }
    if (sillH + height > clearH) {
      issues.push({
        code: "window-above-ceiling",
        message: `Janela ${winId} passa do teto (${sillH + height} mm > ${clearH} mm).`,
        severity: "error",
        targetId: winId,
      });
      return;
    }
    cutoutsByWall.get(wall.id)?.push({
      id: winId,
      kind: "window",
      startMm: offset,
      endMm: offset + width,
      bottomMm: sillH,
      topMm: sillH + height,
    });
    windows.push({
      id: winId,
      wallId: wall.id,
      side: wall.side,
      widthMm: width,
      heightMm: height,
      sillHeightMm: sillH,
      offsetMm: offset,
      center: pointOnWall(wall, offset + width / 2, -t / 2),
      orientationDeg: wall.orientationDeg,
      frame: { widthMm: w.frameMm ?? ROOM_DEFAULTS.windowFrameMm, depthMm: t },
      materialId: w.materialId,
    });
    const sillInto = w.sillDepthMm ?? ROOM_DEFAULTS.sillDepthMm;
    const sillDepth = t + sillInto;
    sills.push({
      id: `${winId}_sill`,
      windowId: winId,
      wallId: wall.id,
      side: wall.side,
      widthMm: width + 2 * ROOM_DEFAULTS.sillOverhangMm,
      depthMm: sillDepth,
      thicknessMm: w.sillThicknessMm ?? ROOM_DEFAULTS.sillThicknessMm,
      levelMm: sillH,
      // centro: a partir da face externa, avançando para dentro
      center: pointOnWall(wall, offset + width / 2, sillDepth / 2 - t),
      orientationDeg: wall.orientationDeg,
      materialId: w.materialId,
    });
  });

  // Vãos sobrepostos na mesma parede
  for (const wall of walls) {
    const cuts = [...(cutoutsByWall.get(wall.id) ?? [])].sort((a, b) => a.startMm - b.startMm);
    for (let i = 1; i < cuts.length; i += 1) {
      const prev = cuts[i - 1]!;
      const cur = cuts[i]!;
      if (cur.startMm < prev.endMm) {
        issues.push({
          code: "openings-overlap",
          message: `Vãos ${prev.id} e ${cur.id} se sobrepõem na parede ${wall.side}.`,
          severity: "error",
          targetId: cur.id,
        });
      }
    }
    (wall as unknown as { cutouts: readonly RoomWallCutout[] }).cutouts = cuts;
    if (wall.joints.length === 0) {
      issues.push({
        code: "wall-without-joint",
        message: `Parede ${wall.side} sem encontro com outra parede.`,
        severity: "error",
        targetId: wall.id,
      });
    }
  }

  // ── PISO ──
  const origin: RoomPoint = {
    x: spec.originMm?.x ?? 0,
    z: spec.originMm?.z ?? 0,
  };
  const floor: RoomFloor = {
    id: `${id}_floor`,
    origin,
    widthMm: W,
    depthMm: D,
    thicknessMm: n.floorThicknessMm,
    levelMm: 0,
    bounds: { minX: 0, maxX: W, minZ: 0, maxZ: D },
    materialId: spec.materials?.floor,
  };
  if (floor.widthMm > W || floor.depthMm > D) {
    issues.push({
      code: "floor-out-of-room",
      message: "Piso maior que o ambiente.",
      severity: "error",
      targetId: floor.id,
    });
  }

  // ── TETO ──
  const ceiling: RoomCeiling = {
    id: `${id}_ceiling`,
    kind: n.ceilingKind,
    widthMm: W,
    depthMm: D,
    thicknessMm: n.ceilingThicknessMm,
    levelMm: clearH,
    materialId: spec.materials?.ceiling,
  };
  if (ceiling.levelMm <= 0 || ceiling.widthMm > W || ceiling.depthMm > D) {
    issues.push({
      code: "ceiling-out-of-room",
      message: "Teto inválido para as dimensões do ambiente.",
      severity: "error",
      targetId: ceiling.id,
    });
  }

  // ── RODAPÉ ARQUITETÔNICO ──
  const bbSpec = spec.baseboard === null ? null : { ...ROOM_DEFAULTS.baseboard, ...(spec.baseboard ?? {}) };
  const baseboards: RoomBaseboardSegment[] = [];
  if (bbSpec) {
    const bbT = Math.max(1, Math.round(bbSpec.thicknessMm));
    const bbH = Math.max(1, Math.round(bbSpec.heightMm));
    const recess = Math.max(0, Math.round(bbSpec.recessMm ?? 0));
    for (const wall of walls) {
      const doorHoles = wall.cutouts.filter((c) => c.kind === "door");
      if (bbSpec.continuous === false && doorHoles.length > 0) continue;
      const isHorizontal = wall.side === "front" || wall.side === "back";
      // quinas: paredes verticais recuam a espessura do rodapé das horizontais
      const startLimit = (isHorizontal ? 0 : bbT) + recess;
      const endLimit = (isHorizontal ? wall.openingSpanMm : wall.openingSpanMm - bbT) - recess;
      if (endLimit - startLimit <= 1) continue;
      const segments = subtractRanges({ start: startLimit, end: endLimit }, doorHoles);
      segments.forEach((seg, i) => {
        const lengthMm = seg.end - seg.start;
        baseboards.push({
          id: `${wall.id}_baseboard_${i + 1}`,
          wallId: wall.id,
          side: wall.side,
          startMm: seg.start,
          endMm: seg.end,
          lengthMm,
          heightMm: bbH,
          thicknessMm: bbT,
          center: pointOnWall(wall, (seg.start + seg.end) / 2, bbT / 2),
          orientationDeg: wall.orientationDeg,
          materialId: bbSpec.materialId ?? spec.materials?.baseboard,
        });
      });
    }
    // Sanidade: nenhum segmento pode cruzar um vão de porta.
    for (const seg of baseboards) {
      const wall = walls.find((w) => w.id === seg.wallId);
      const crosses = wall?.cutouts.some(
        (c) => c.kind === "door" && seg.startMm < c.endMm && seg.endMm > c.startMm,
      );
      if (crosses) {
        issues.push({
          code: "baseboard-crosses-door",
          message: `Rodapé ${seg.id} atravessa o vão de uma porta.`,
          severity: "error",
          targetId: seg.id,
        });
      }
    }
  }

  return {
    id,
    spec,
    origin: {
      room: origin,
      floor: origin,
      walls: origin,
      furniture: origin,
      levelMm: 0,
    },
    walls,
    floor,
    ceiling,
    baseboards,
    doors,
    windows,
    sills,
    inner: { minX: 0, maxX: W, minZ: 0, maxZ: D, heightMm: clearH },
    bounds: { minX: -t, maxX: W + t, minZ: -t, maxZ: D + t, maxY: clearH + n.ceilingThicknessMm },
    issues,
  };
}