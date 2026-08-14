import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { RoomBoundsMm } from "./validateModule";
import { KITCHEN_CONFIG } from "../families/kitchen/config";

export type SnapTarget = "module" | "back-wall" | "left-wall" | "right-wall" | "floor" | "ceiling";

export interface SnapCandidate {
  positionMm: { x: number; y: number; z: number };
  target: SnapTarget;
  distanceMm: number;
}

const overlap = (aMin: number, aMax: number, bMin: number, bMax: number) => aMin < bMax && aMax > bMin;

export function findKitchenSnapCandidate(
  moving: FurnitureInstance,
  others: FurnitureInstance[],
  room: RoomBoundsMm,
  toleranceMm = KITCHEN_CONFIG.snapToleranceMm
): SnapCandidate | null {
  const candidates: SnapCandidate[] = [];
  const halfW = moving.dimensionsMm.width / 2;
  const halfD = moving.dimensionsMm.depth / 2;
  const current = moving.positionMm;
  const floorY = 0;
  const floorDistance = Math.abs(current.y - floorY);
  if (floorDistance > 0 && floorDistance <= toleranceMm) candidates.push({ positionMm: { ...current, y: floorY }, target: "floor", distanceMm: floorDistance });

  const ceilingY = room.heightMm - moving.dimensionsMm.height;
  const ceilingDistance = Math.abs(current.y - ceilingY);
  if (ceilingY >= floorY && ceilingDistance > 0 && ceilingDistance <= toleranceMm) candidates.push({ positionMm: { ...current, y: ceilingY }, target: "ceiling", distanceMm: ceilingDistance });

  const backZ = -room.depthMm / 2 + halfD + KITCHEN_CONFIG.rearGapMm;
  const backDistance = Math.abs(current.z - backZ);
  if (backDistance <= toleranceMm) candidates.push({ positionMm: { ...current, z: backZ }, target: "back-wall", distanceMm: backDistance });

  const leftX = -room.widthMm / 2 + halfW + KITCHEN_CONFIG.sideGapMm;
  const leftDistance = Math.abs(current.x - leftX);
  if (leftDistance <= toleranceMm) candidates.push({ positionMm: { ...current, x: leftX }, target: "left-wall", distanceMm: leftDistance });

  const rightX = room.widthMm / 2 - halfW - KITCHEN_CONFIG.sideGapMm;
  const rightDistance = Math.abs(current.x - rightX);
  if (rightDistance <= toleranceMm) candidates.push({ positionMm: { ...current, x: rightX }, target: "right-wall", distanceMm: rightDistance });

  for (const other of others) {
    const otherHalfW = other.dimensionsMm.width / 2;
    const otherHalfD = other.dimensionsMm.depth / 2;
    const movingMinX = current.x - halfW;
    const movingMaxX = current.x + halfW;
    const movingMinZ = current.z - halfD;
    const movingMaxZ = current.z + halfD;
    const otherMinX = other.positionMm.x - otherHalfW;
    const otherMaxX = other.positionMm.x + otherHalfW;
    const otherMinZ = other.positionMm.z - otherHalfD;
    const otherMaxZ = other.positionMm.z + otherHalfD;

    const zOverlap = overlap(movingMinZ, movingMaxZ, otherMinZ, otherMaxZ);
    if (zOverlap) {
      const rightGap = Math.abs(movingMinX - otherMaxX);
      if (rightGap <= toleranceMm) candidates.push({ positionMm: { ...current, x: otherMaxX + halfW }, target: "module", distanceMm: rightGap });
      const leftGap = Math.abs(movingMaxX - otherMinX);
      if (leftGap <= toleranceMm) candidates.push({ positionMm: { ...current, x: otherMinX - halfW }, target: "module", distanceMm: leftGap });
    }

    const xOverlap = overlap(movingMinX, movingMaxX, otherMinX, otherMaxX);
    if (xOverlap) {
      const frontGap = Math.abs(movingMinZ - otherMaxZ);
      if (frontGap <= toleranceMm) candidates.push({ positionMm: { ...current, z: otherMaxZ + halfD }, target: "module", distanceMm: frontGap });
      const backGap = Math.abs(movingMaxZ - otherMinZ);
      if (backGap <= toleranceMm) candidates.push({ positionMm: { ...current, z: otherMinZ - halfD }, target: "module", distanceMm: backGap });
    }

    const zAligned = overlap(movingMinZ, movingMaxZ, otherMinZ, otherMaxZ);
    const xAligned = overlap(movingMinX, movingMaxX, otherMinX, otherMaxX);
    if (zAligned && xAligned) {
      const topGap = Math.abs(current.y - (other.positionMm.y + other.dimensionsMm.height));
      if (topGap <= toleranceMm) candidates.push({ positionMm: { ...current, y: other.positionMm.y + other.dimensionsMm.height }, target: "module", distanceMm: topGap });
      const bottomGap = Math.abs((current.y + moving.dimensionsMm.height) - other.positionMm.y);
      if (bottomGap <= toleranceMm) candidates.push({ positionMm: { ...current, y: other.positionMm.y - moving.dimensionsMm.height }, target: "module", distanceMm: bottomGap });
    }
  }

  candidates.sort((a, b) => a.distanceMm - b.distanceMm);
  return candidates[0] ?? null;
}
