/**
 * Fase 3.17 — Física do viewport.
 */
export interface RealtimePhysicsProfile {
  readonly gravityMs2: number;
  readonly walkSpeedMs: number;
  readonly runSpeedMs: number;
  readonly eyeHeightMm: number;
  readonly collisionRadiusMm: number;
  readonly stepHeightMm: number;
}

export const REALTIME_PHYSICS: RealtimePhysicsProfile = {
  gravityMs2: 9.81,
  walkSpeedMs: 1.4,
  runSpeedMs: 3.2,
  eyeHeightMm: 1650,
  collisionRadiusMm: 260,
  stepHeightMm: 200,
};
