/**
 * Fase 3.9 — Câmeras físicas.
 */
import type { RenderCameraKind, RenderCameraPreset } from "../types";

export const RENDER_CAMERAS: readonly RenderCameraPreset[] = [
  {
    id: "cam.interior.wide",
    kind: "interior",
    label: "Interior Wide 24mm",
    focalLengthMm: 24,
    apertureF: 5.6,
    shutter: 125,
    iso: 200,
    heightMm: 1500,
    targetHint: "olho",
  },
  {
    id: "cam.interior.35",
    kind: "interior",
    label: "Interior 35mm",
    focalLengthMm: 35,
    apertureF: 4,
    shutter: 125,
    iso: 200,
    heightMm: 1500,
    targetHint: "olho",
  },
  {
    id: "cam.interior.50",
    kind: "interior",
    label: "Interior 50mm",
    focalLengthMm: 50,
    apertureF: 2.8,
    shutter: 160,
    iso: 200,
    heightMm: 1500,
    targetHint: "olho",
  },
  {
    id: "cam.exterior.wide",
    kind: "exterior",
    label: "Exterior Wide 20mm",
    focalLengthMm: 20,
    apertureF: 8,
    shutter: 250,
    iso: 100,
    heightMm: 1700,
    targetHint: "auto",
  },
  {
    id: "cam.exterior.tele",
    kind: "exterior",
    label: "Exterior Tele 85mm",
    focalLengthMm: 85,
    apertureF: 5.6,
    shutter: 200,
    iso: 200,
    heightMm: 1600,
    targetHint: "auto",
  },
  {
    id: "cam.top.ortho",
    kind: "top",
    label: "Planta Superior",
    focalLengthMm: 35,
    apertureF: 8,
    shutter: 125,
    iso: 100,
    heightMm: 4000,
    targetHint: "chao",
  },
  {
    id: "cam.iso.default",
    kind: "isometrica",
    label: "Isométrica 30°",
    focalLengthMm: 35,
    apertureF: 8,
    shutter: 125,
    iso: 100,
    heightMm: 3000,
    targetHint: "auto",
  },
  {
    id: "cam.close.macro",
    kind: "close",
    label: "Close 85mm f/1.4",
    focalLengthMm: 85,
    apertureF: 1.4,
    shutter: 200,
    iso: 200,
    heightMm: 1200,
    targetHint: "auto",
  },
  {
    id: "cam.detail.macro",
    kind: "detalhe",
    label: "Detalhe Macro 100mm",
    focalLengthMm: 100,
    apertureF: 2.8,
    shutter: 200,
    iso: 200,
    heightMm: 900,
    targetHint: "auto",
  },
  {
    id: "cam.auto.director",
    kind: "automatica",
    label: "IA — Composição Automática",
    focalLengthMm: 35,
    apertureF: 4,
    shutter: 160,
    iso: 200,
    heightMm: 1550,
    targetHint: "auto",
    notes: "Seleciona o melhor ângulo com base no cômodo e mobília.",
  },
];

export const DEFAULT_CAMERA_ID = "cam.interior.35";

export function camerasByKind(kind: RenderCameraKind): readonly RenderCameraPreset[] {
  return RENDER_CAMERAS.filter((c) => c.kind === kind);
}

export function getCamera(id: string): RenderCameraPreset {
  const c = RENDER_CAMERAS.find((x) => x.id === id);
  if (!c) throw new Error(`Câmera desconhecida: ${id}`);
  return c;
}
