/**
 * Fase 3.23 — Gravidade + escadas/rampas.
 */
import type { RealtimeGravityProfile, RealtimeVec3 } from "./types";

export const DEFAULT_GRAVITY: RealtimeGravityProfile = {
  enabled: true,
  gravityMs2: 9.81,
  floorFriction: 0.85,
  airDamping: 0.02,
};

export interface RealtimeVerticalState {
  readonly verticalMs: number;
  readonly grounded: boolean;
}

export const REST_VERTICAL: RealtimeVerticalState = { verticalMs: 0, grounded: true };

export function stepGravity(
  pos: RealtimeVec3,
  st: RealtimeVerticalState,
  floorYMm: number,
  eyeHeightMm: number,
  dtSec: number,
  profile: RealtimeGravityProfile,
): { pos: RealtimeVec3; state: RealtimeVerticalState } {
  if (!profile.enabled) return { pos, state: st };
  const vNext = st.verticalMs - profile.gravityMs2 * dtSec;
  const yNext = pos.y + vNext * 1000 * dtSec;
  const groundY = floorYMm + eyeHeightMm;
  if (yNext <= groundY) {
    return { pos: { ...pos, y: groundY }, state: { verticalMs: 0, grounded: true } };
  }
  return { pos: { ...pos, y: yNext }, state: { verticalMs: vNext, grounded: false } };
}

export function climbSlope(pos: RealtimeVec3, targetY: number, stepHeightMm: number): RealtimeVec3 {
  const dy = targetY - pos.y;
  if (Math.abs(dy) <= stepHeightMm) return { ...pos, y: targetY };
  return pos;
}
