/**
 * Fase 3.23 — Movimentação (WASD, mouse, touch, joystick, gamepad).
 */
import type { RealtimeInputSource, RealtimeMovementProfile } from "./types";

export const DEFAULT_MOVEMENT: RealtimeMovementProfile = {
  walkSpeedMs: 1.4,
  runSpeedMs: 3.4,
  crouchSpeedMs: 0.8,
  gravityMs2: 9.81,
  jumpMs: 3.0,
  rotationSpeedDegS: 180,
  touchSensitivity: 0.6,
  gamepadSensitivity: 1.0,
};

export interface RealtimeInputVector {
  readonly forward: number;
  readonly strafe: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly run: boolean;
  readonly crouch: boolean;
  readonly source: RealtimeInputSource;
}

export const NEUTRAL_INPUT: RealtimeInputVector = {
  forward: 0,
  strafe: 0,
  yaw: 0,
  pitch: 0,
  run: false,
  crouch: false,
  source: "keyboard",
};

export function speedFor(profile: RealtimeMovementProfile, input: RealtimeInputVector): number {
  if (input.crouch) return profile.crouchSpeedMs;
  if (input.run) return profile.runSpeedMs;
  return profile.walkSpeedMs;
}

export function inputFromKeys(keys: Readonly<Record<string, boolean>>): RealtimeInputVector {
  const forward = (keys["w"] ? 1 : 0) - (keys["s"] ? 1 : 0);
  const strafe = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
  return {
    forward,
    strafe,
    yaw: 0,
    pitch: 0,
    run: keys["shift"] === true,
    crouch: keys["control"] === true || keys["c"] === true,
    source: "keyboard",
  };
}

export function inputFromJoystick(axisX: number, axisY: number, run: boolean): RealtimeInputVector {
  return {
    forward: clamp(-axisY),
    strafe: clamp(axisX),
    yaw: 0,
    pitch: 0,
    run,
    crouch: false,
    source: "joystick",
  };
}

export function inputFromGamepad(gp: Gamepad): RealtimeInputVector {
  const [lx = 0, ly = 0, rx = 0, ry = 0] = gp.axes;
  return {
    forward: clamp(-ly),
    strafe: clamp(lx),
    yaw: clamp(rx),
    pitch: clamp(ry),
    run: gp.buttons[10]?.pressed === true,
    crouch: gp.buttons[11]?.pressed === true,
    source: "gamepad",
  };
}

function clamp(v: number): number {
  if (v > 1) return 1;
  if (v < -1) return -1;
  if (Math.abs(v) < 0.08) return 0;
  return v;
}
