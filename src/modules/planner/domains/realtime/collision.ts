/**
 * Fase 3.23 — Colisão determinística contra AABBs.
 */
import type { RealtimeCollisionProfile, RealtimeVec3 } from "./types";

export const DEFAULT_COLLISION: RealtimeCollisionProfile = {
  enabled: true,
  radiusMm: 260,
  stepHeightMm: 200,
  slopeLimitDeg: 35,
  stairsAssist: true,
  clampToBoundsMm: 50,
};

export interface RealtimeAabb {
  readonly minMm: RealtimeVec3;
  readonly maxMm: RealtimeVec3;
}

export function resolveHorizontal(
  pos: RealtimeVec3,
  next: RealtimeVec3,
  profile: RealtimeCollisionProfile,
  aabbs: readonly RealtimeAabb[],
): RealtimeVec3 {
  if (!profile.enabled) return next;
  let x = next.x;
  let z = next.z;
  const r = profile.radiusMm;
  for (const b of aabbs) {
    const inY = pos.y + profile.stepHeightMm >= b.minMm.y && pos.y <= b.maxMm.y;
    if (!inY) continue;
    if (x + r > b.minMm.x && x - r < b.maxMm.x && z + r > b.minMm.z && z - r < b.maxMm.z) {
      const dx = Math.min(Math.abs(x - b.minMm.x), Math.abs(x - b.maxMm.x));
      const dz = Math.min(Math.abs(z - b.minMm.z), Math.abs(z - b.maxMm.z));
      if (dx < dz) x = pos.x;
      else z = pos.z;
    }
  }
  return { x, y: next.y, z };
}

export function clampToRoom(pos: RealtimeVec3, bounds: RealtimeAabb, pad: number): RealtimeVec3 {
  return {
    x: Math.max(bounds.minMm.x + pad, Math.min(bounds.maxMm.x - pad, pos.x)),
    y: pos.y,
    z: Math.max(bounds.minMm.z + pad, Math.min(bounds.maxMm.z - pad, pos.z)),
  };
}
