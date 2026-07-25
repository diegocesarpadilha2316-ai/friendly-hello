/**
 * Fase 3.31 — Camera runner real.
 *
 * Wrapper leve sobre o `buildLocalCameraPath` (Fase 3.22): entrega uma
 * amostra interpolada por frame — pronta para o viewport aplicar.
 */
import { samplePath } from "../local-engine/camera-animation";
import { LOCAL_CAMERAS } from "../../render/local-engine/cameras";
import type {
  LocalCameraMoveKind,
  LocalCameraPath,
  LocalCameraSample,
  LocalFps,
} from "../local-engine/types";

export function pathFor(
  move: LocalCameraMoveKind,
  durationSec: number,
  fps: LocalFps,
  cameraId: string = LOCAL_CAMERAS[0].id,
): LocalCameraPath {
  return samplePath({ moveId: move, cameraId, durationSec, fps });
}

export function sampleAt(path: LocalCameraPath, frame: number): LocalCameraSample | null {
  return path.samples[Math.max(0, Math.min(frame, path.samples.length - 1))] ?? null;
}

export const REAL_CAMERA_MOVES: readonly LocalCameraMoveKind[] = [
  "orbit",
  "walk-through",
  "first-person",
  "fly-through",
  "drone",
  "travelling",
  "zoom",
  "pan",
  "tilt",
  "close",
  "detalhe",
  "cliente",
  "apresentacao",
  "livre",
];