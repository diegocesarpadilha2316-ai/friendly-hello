/**
 * Fase 3.12 — Câmeras extras (Drone / Walkthrough / Orbit),
 * complementando o catálogo básico em `../cameras.ts`.
 */
import type { RenderCameraPreset } from "../../types";

export const ULTRA_CAMERAS: readonly RenderCameraPreset[] = [
  { id: "ultra.cam.drone.high", kind: "exterior", label: "Drone Alto", focalLengthMm: 24, apertureF: 8, shutter: 250, iso: 100, heightMm: 12000, targetHint: "auto", notes: "Vista aérea." },
  { id: "ultra.cam.drone.mid",  kind: "exterior", label: "Drone Médio", focalLengthMm: 35, apertureF: 8, shutter: 250, iso: 100, heightMm: 6000, targetHint: "auto" },
  { id: "ultra.cam.walk",       kind: "interior", label: "Walkthrough", focalLengthMm: 24, apertureF: 4, shutter: 125, iso: 400, heightMm: 1600, targetHint: "olho", notes: "Trajetória contínua." },
  { id: "ultra.cam.orbit",      kind: "isometrica", label: "Orbit 360°", focalLengthMm: 35, apertureF: 5.6, shutter: 160, iso: 200, heightMm: 1800, targetHint: "auto" },
  { id: "ultra.cam.iso.30",     kind: "isometrica", label: "Isométrica 30°", focalLengthMm: 35, apertureF: 8, shutter: 125, iso: 100, heightMm: 3000, targetHint: "auto" },
  { id: "ultra.cam.close.85",   kind: "close",    label: "Close 85mm", focalLengthMm: 85, apertureF: 1.8, shutter: 200, iso: 200, heightMm: 1200, targetHint: "auto" },
  { id: "ultra.cam.detail.100", kind: "detalhe",  label: "Detalhe 100mm", focalLengthMm: 100, apertureF: 2.8, shutter: 250, iso: 200, heightMm: 900, targetHint: "auto" },
];