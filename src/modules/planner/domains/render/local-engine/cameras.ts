/**
 * Fase 3.21 — Câmeras físicas do motor local.
 */
import type { LocalCameraPreset } from "./types";

export const LOCAL_CAMERAS: readonly LocalCameraPreset[] = [
  {
    id: "cam.interior",
    kind: "interior",
    label: "Interior 24mm",
    focalLengthMm: 24,
    apertureF: 5.6,
    shutter: 1 / 60,
    iso: 200,
    heightMm: 1500,
  },
  {
    id: "cam.exterior",
    kind: "exterior",
    label: "Exterior 35mm",
    focalLengthMm: 35,
    apertureF: 8,
    shutter: 1 / 125,
    iso: 100,
    heightMm: 1600,
  },
  {
    id: "cam.cliente",
    kind: "cliente",
    label: "Cliente 28mm",
    focalLengthMm: 28,
    apertureF: 5.6,
    shutter: 1 / 60,
    iso: 200,
    heightMm: 1500,
  },
  {
    id: "cam.apresentacao",
    kind: "apresentacao",
    label: "Apresentação 35mm",
    focalLengthMm: 35,
    apertureF: 4,
    shutter: 1 / 60,
    iso: 200,
    heightMm: 1550,
  },
  {
    id: "cam.top",
    kind: "top",
    label: "Top-Down",
    focalLengthMm: 50,
    apertureF: 8,
    shutter: 1 / 60,
    iso: 100,
    heightMm: 4500,
  },
  {
    id: "cam.iso",
    kind: "isometrica",
    label: "Isométrica",
    focalLengthMm: 55,
    apertureF: 8,
    shutter: 1 / 60,
    iso: 100,
    heightMm: 3200,
  },
  {
    id: "cam.close",
    kind: "close",
    label: "Close 85mm",
    focalLengthMm: 85,
    apertureF: 2.8,
    shutter: 1 / 125,
    iso: 200,
    heightMm: 1200,
  },
  {
    id: "cam.detalhe",
    kind: "detalhe",
    label: "Detalhe 100mm",
    focalLengthMm: 100,
    apertureF: 4,
    shutter: 1 / 125,
    iso: 200,
    heightMm: 900,
  },
  {
    id: "cam.livre",
    kind: "livre",
    label: "Câmera Livre",
    focalLengthMm: 35,
    apertureF: 4,
    shutter: 1 / 60,
    iso: 200,
    heightMm: 1500,
  },
];

export const DEFAULT_LOCAL_CAMERA_ID = "cam.interior";

export function findLocalCamera(id: string): LocalCameraPreset | null {
  return LOCAL_CAMERAS.find((c) => c.id === id) ?? null;
}
