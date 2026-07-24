/**
 * Fase 3.22 — Amostragem determinística de trajetórias de câmera.
 * Puro/estateless. Não muta o projeto.
 */
import { LOCAL_CAMERAS, findLocalCamera } from "../../render/local-engine/cameras";
import { getCameraMove } from "./camera-path";
import type {
  LocalCameraMoveKind,
  LocalCameraPath,
  LocalCameraSample,
  LocalEasing,
  LocalFps,
} from "./types";

function ease(t: number, e: LocalEasing): number {
  const x = Math.max(0, Math.min(1, t));
  switch (e) {
    case "linear": return x;
    case "ease-in": return x * x;
    case "ease-out": return 1 - (1 - x) * (1 - x);
    case "ease-in-out": return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case "cinematic": return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    case "snap": return x < 0.9 ? x * 0.4 : 0.36 + (x - 0.9) * 6.4;
  }
}

function num(v: number | string | boolean | undefined, fallback: number): number {
  return typeof v === "number" ? v : fallback;
}

export function samplePath(input: {
  moveId: LocalCameraMoveKind;
  cameraId: string;
  durationSec: number;
  fps: LocalFps;
  centerMm?: { x: number; y: number; z: number };
}): LocalCameraPath {
  const move = getCameraMove(input.moveId);
  const cam = findLocalCamera(input.cameraId) ?? LOCAL_CAMERAS[0];
  const total = Math.max(1, Math.round(input.durationSec * input.fps));
  const cx = input.centerMm?.x ?? 0;
  const cy = input.centerMm?.y ?? 0;
  const cz = input.centerMm?.z ?? 0;

  const samples: LocalCameraSample[] = [];
  for (let f = 0; f < total; f += 1) {
    const t = ease(f / Math.max(1, total - 1), move.easing);
    const s = computeSample(move.id, move.params, cam.heightMm, cam.focalLengthMm, t, cx, cy, cz);
    samples.push({ frame: f, timeSec: f / input.fps, ...s });
  }

  return { moveId: input.moveId, cameraId: cam.id, durationSec: input.durationSec, fps: input.fps, samples };
}

function computeSample(
  kind: LocalCameraMoveKind,
  params: Readonly<Record<string, number | string | boolean>>,
  h: number,
  focal: number,
  t: number,
  cx: number,
  cy: number,
  cz: number,
): Omit<LocalCameraSample, "frame" | "timeSec"> {
  const H = num(params.heightMm, h);
  const R = num(params.radiusMm, 4000);
  const rangeMm = num(params.rangeMm, 3500);
  switch (kind) {
    case "orbit": {
      const rev = num(params.revolutions, 1);
      const a = t * rev * Math.PI * 2;
      return { px: cx + Math.cos(a) * R, py: cy + H, pz: cz + Math.sin(a) * R, yaw: a + Math.PI, pitch: -0.08, focalLengthMm: focal };
    }
    case "fly-through":
    case "walk-through":
    case "first-person": {
      const bob = kind === "first-person" && params.bobbing ? Math.sin(t * Math.PI * 6) * 30 : 0;
      return { px: cx + (t - 0.5) * rangeMm * 2, py: cy + H + bob, pz: cz + Math.sin(t * Math.PI) * (R / 4), yaw: 0, pitch: 0, focalLengthMm: focal };
    }
    case "travelling":
      return { px: cx + (t - 0.5) * rangeMm * 2, py: cy + H, pz: cz - R / 2, yaw: 0, pitch: 0, focalLengthMm: focal };
    case "pan":
      return { px: cx, py: cy + H, pz: cz - R / 2, yaw: (t - 0.5) * (num(params.angleDeg, 90) * Math.PI) / 180, pitch: 0, focalLengthMm: focal };
    case "tilt":
      return { px: cx, py: cy + H, pz: cz - R / 2, yaw: 0, pitch: (t - 0.5) * (num(params.angleDeg, 45) * Math.PI) / 180, focalLengthMm: focal };
    case "zoom":
      return { px: cx, py: cy + H, pz: cz - R / 2, yaw: 0, pitch: 0, focalLengthMm: num(params.fromMm, 35) + (num(params.toMm, 85) - num(params.fromMm, 35)) * t };
    case "close":
    case "detalhe": {
      const d = num(params.fromMm, 3000) + (num(params.toMm, 900) - num(params.fromMm, 3000)) * t;
      return { px: cx, py: cy + Math.min(H, 1200), pz: cz - d, yaw: 0, pitch: 0, focalLengthMm: num(params.focalMm, focal) };
    }
    case "drone": {
      const a = t * Math.PI * 2;
      return { px: cx + Math.cos(a) * R, py: cy + num(params.heightMm, 4500), pz: cz + Math.sin(a) * R, yaw: a + Math.PI, pitch: -0.4, focalLengthMm: focal };
    }
    case "cliente":
    case "apresentacao": {
      const stops = num(params.stops, 4);
      const step = Math.min(stops - 1, Math.floor(t * stops));
      const a = (step / Math.max(1, stops - 1)) * Math.PI * 2;
      return { px: cx + Math.cos(a) * R, py: cy + H, pz: cz + Math.sin(a) * R, yaw: a + Math.PI, pitch: -0.05, focalLengthMm: focal };
    }
    case "livre":
      return { px: cx + t * rangeMm, py: cy + H, pz: cz, yaw: 0, pitch: 0, focalLengthMm: focal };
  }
}