/**
 * Validador de colisões ARQUITETURA × MÓVEIS.
 * Puro, eixo-alinhado, milímetros. Não move nada — apenas reporta.
 */
import type {
  RoomArchitecture,
  RoomFurnitureBox,
  RoomIssue,
  RoomWall,
} from "./types";

const TOL = 1; // mm

interface Box2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function boxOf(f: RoomFurnitureBox): Box2D {
  return {
    minX: f.x,
    maxX: f.x + f.widthMm,
    minZ: f.z,
    maxZ: f.z + f.depthMm,
  };
}

function wallFootprint(w: RoomWall): Box2D {
  const xs = w.corners.map((c) => c.x);
  const zs = w.corners.map((c) => c.z);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

function overlaps(a: Box2D, b: Box2D): boolean {
  return (
    a.minX < b.maxX - TOL &&
    a.maxX > b.minX + TOL &&
    a.minZ < b.maxZ - TOL &&
    a.maxZ > b.minZ + TOL
  );
}

export function validateRoomFurniture(
  arch: RoomArchitecture,
  boxes: readonly RoomFurnitureBox[],
): readonly RoomIssue[] {
  const issues: RoomIssue[] = [];
  const inner = arch.inner;

  for (const f of boxes) {
    const box = boxOf(f);

    if (
      box.minX < inner.minX - TOL ||
      box.maxX > inner.maxX + TOL ||
      box.minZ < inner.minZ - TOL ||
      box.maxZ > inner.maxZ + TOL
    ) {
      issues.push({
        code: "furniture-outside-room",
        message: `Móvel ${f.id} está fora dos limites internos do ambiente.`,
        severity: "error",
        targetId: f.id,
      });
    }

    for (const wall of arch.walls) {
      if (overlaps(box, wallFootprint(wall))) {
        issues.push({
          code: "furniture-through-wall",
          message: `Móvel ${f.id} atravessa a parede ${wall.side}.`,
          severity: "error",
          targetId: f.id,
        });
      }
    }

    if (f.bottomMm < -TOL) {
      issues.push({
        code: "furniture-floating",
        message: `Móvel ${f.id} está abaixo do piso.`,
        severity: "error",
        targetId: f.id,
      });
    } else if (!f.suspended && f.bottomMm > arch.floor.levelMm + TOL) {
      issues.push({
        code: "furniture-floating",
        message: `Móvel ${f.id} está flutuando (base em ${f.bottomMm} mm).`,
        severity: "error",
        targetId: f.id,
      });
    }

    if (f.bottomMm + f.heightMm > inner.heightMm + TOL) {
      issues.push({
        code: "furniture-above-ceiling",
        message: `Móvel ${f.id} passa do teto (${f.bottomMm + f.heightMm} mm > ${inner.heightMm} mm).`,
        severity: "error",
        targetId: f.id,
      });
    }

    // Vãos: o móvel só conflita se ocupar a faixa vertical do vão E a
    // faixa horizontal na parede correspondente.
    for (const wall of arch.walls) {
      const horizontal = wall.side === "front" || wall.side === "back";
      const nearWall = horizontal
        ? Math.min(Math.abs(box.minZ - wall.innerFaceMm), Math.abs(box.maxZ - wall.innerFaceMm)) < 600
        : Math.min(Math.abs(box.minX - wall.innerFaceMm), Math.abs(box.maxX - wall.innerFaceMm)) < 600;
      if (!nearWall) continue;
      const along = horizontal
        ? { start: box.minX, end: box.maxX }
        : { start: box.minZ, end: box.maxZ };
      for (const cut of wall.cutouts) {
        const hitAlong = along.start < cut.endMm - TOL && along.end > cut.startMm + TOL;
        const hitVertical =
          f.bottomMm < cut.topMm - TOL && f.bottomMm + f.heightMm > cut.bottomMm + TOL;
        if (hitAlong && hitVertical) {
          issues.push({
            code: cut.kind === "door" ? "furniture-through-door" : "furniture-through-window",
            message: `Móvel ${f.id} obstrui o vão ${cut.id} (${cut.kind}) na parede ${wall.side}.`,
            severity: cut.kind === "door" ? "error" : "warning",
            targetId: f.id,
          });
        }
      }
    }
  }

  return issues;
}

/** Arquitetura + móveis em uma única checagem. */
export function validateRoom(
  arch: RoomArchitecture,
  boxes: readonly RoomFurnitureBox[] = [],
): readonly RoomIssue[] {
  return [...arch.issues, ...validateRoomFurniture(arch, boxes)];
}