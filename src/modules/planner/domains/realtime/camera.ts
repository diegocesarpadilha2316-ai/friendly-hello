/**
 * Fase 3.23 — Câmera do modo interativo.
 */
import type { RealtimeCameraState, RealtimeNavigationMode, RealtimeVec3 } from "./types";

export const DEFAULT_REALTIME_CAMERA: RealtimeCameraState = {
  mode: "orbit",
  positionMm: { x: 0, y: 1650, z: 3000 },
  yawDeg: 0,
  pitchDeg: -10,
  fovDeg: 55,
  eyeHeightMm: 1650,
};

const FOV_BY_MODE: Record<RealtimeNavigationMode, number> = {
  walk: 60, fps: 70, orbit: 45, drone: 65, cliente: 50, apresentacao: 40, livre: 55,
};

const EYE_BY_MODE: Record<RealtimeNavigationMode, number> = {
  walk: 1650, fps: 1700, orbit: 1650, drone: 3500, cliente: 1650, apresentacao: 1650, livre: 1650,
};

export function switchCameraMode(cam: RealtimeCameraState, mode: RealtimeNavigationMode): RealtimeCameraState {
  return {
    ...cam,
    mode,
    fovDeg: FOV_BY_MODE[mode],
    eyeHeightMm: EYE_BY_MODE[mode],
    positionMm: { ...cam.positionMm, y: EYE_BY_MODE[mode] },
  };
}

export function panCamera(cam: RealtimeCameraState, deltaMm: RealtimeVec3): RealtimeCameraState {
  return {
    ...cam,
    positionMm: {
      x: cam.positionMm.x + deltaMm.x,
      y: cam.positionMm.y + deltaMm.y,
      z: cam.positionMm.z + deltaMm.z,
    },
  };
}

export function rotateCamera(cam: RealtimeCameraState, deltaYawDeg: number, deltaPitchDeg: number): RealtimeCameraState {
  const pitch = Math.max(-89, Math.min(89, cam.pitchDeg + deltaPitchDeg));
  const yaw = ((cam.yawDeg + deltaYawDeg) % 360 + 360) % 360;
  return { ...cam, yawDeg: yaw, pitchDeg: pitch };
}

export function setFov(cam: RealtimeCameraState, fovDeg: number): RealtimeCameraState {
  return { ...cam, fovDeg: Math.max(20, Math.min(120, fovDeg)) };
}