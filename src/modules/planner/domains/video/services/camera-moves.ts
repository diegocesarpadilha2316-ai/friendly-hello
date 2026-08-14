/**
 * Fase 3.10 — Catálogo de movimentos de câmera.
 *
 * Motor gratuito: algoritmo próprio, sem IA. Parâmetros determinísticos
 * (raio, altura, ângulo, alvo) que qualquer renderer sabe interpretar.
 */
import type { VideoCameraMove, VideoCameraMoveKind } from "../types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export const CAMERA_MOVES: readonly VideoCameraMove[] = [
  {
    id: uid("mov"),
    kind: "orbit",
    label: "Orbit 360°",
    description: "Câmera gira em torno do ponto focal do ambiente.",
    durationSec: 12,
    easing: "ease-in-out",
    params: { radiusMm: 3800, heightMm: 1650, startDeg: 0, endDeg: 360, targetY: 900 },
  },
  {
    id: uid("mov"),
    kind: "fly-through",
    label: "Fly Through",
    description: "Sobrevoo diagonal — entrada aérea até altura de olho.",
    durationSec: 10,
    easing: "cinematic",
    params: { fromHeightMm: 2600, toHeightMm: 1650, fromDistanceMm: 5400, toDistanceMm: 2200 },
  },
  {
    id: uid("mov"),
    kind: "walk-through",
    label: "Walk Through",
    description: "Percurso na altura dos olhos, atravessando o ambiente.",
    durationSec: 14,
    easing: "ease-in-out",
    params: { heightMm: 1650, stepMm: 220, path: "auto" },
  },
  {
    id: uid("mov"),
    kind: "pan",
    label: "Pan",
    description: "Câmera fixa, rotação horizontal do enquadramento.",
    durationSec: 6,
    easing: "ease-in-out",
    params: { startDeg: -35, endDeg: 35, heightMm: 1650 },
  },
  {
    id: uid("mov"),
    kind: "tilt",
    label: "Tilt",
    description: "Câmera fixa, rotação vertical (chão → teto).",
    durationSec: 5,
    easing: "ease-out",
    params: { startDeg: -20, endDeg: 25 },
  },
  {
    id: uid("mov"),
    kind: "zoom",
    label: "Zoom",
    description: "Foca gradualmente um detalhe do móvel/ambiente.",
    durationSec: 4,
    easing: "ease-in-out",
    params: { fromFocalMm: 24, toFocalMm: 85 },
  },
  {
    id: uid("mov"),
    kind: "travelling",
    label: "Travelling",
    description: "Deslocamento lateral paralelo à cena.",
    durationSec: 8,
    easing: "linear",
    params: { distanceMm: 3200, heightMm: 1500 },
  },
  {
    id: uid("mov"),
    kind: "close",
    label: "Close",
    description: "Aproximação frontal a 60cm do móvel.",
    durationSec: 5,
    easing: "ease-out",
    params: { targetDistanceMm: 600, focalMm: 50 },
  },
  {
    id: uid("mov"),
    kind: "detail",
    label: "Detalhe",
    description: "Macro em ferragem/dobradiça/puxador — foco raso.",
    durationSec: 4,
    easing: "ease-in-out",
    params: { targetDistanceMm: 200, focalMm: 90, apertureF: 2.2 },
  },
  {
    id: uid("mov"),
    kind: "auto",
    label: "Câmera Automática",
    description: "Algoritmo próprio escolhe o melhor ângulo por cômodo.",
    durationSec: 10,
    easing: "cinematic",
    params: { heuristic: "auto", allowMultiple: true },
  },
];

export const DEFAULT_CAMERA_MOVE_ID = CAMERA_MOVES[0].id;

export function getCameraMove(id: string): VideoCameraMove {
  return CAMERA_MOVES.find((m) => m.id === id) ?? CAMERA_MOVES[0];
}

export function cameraMovesByKind(kind: VideoCameraMoveKind): readonly VideoCameraMove[] {
  return CAMERA_MOVES.filter((m) => m.kind === kind);
}

/** Cria um movimento novo mantendo os valores paramétricos do catálogo. */
export function instantiateCameraMove(
  kind: VideoCameraMoveKind,
  overrides: Partial<Pick<VideoCameraMove, "durationSec" | "easing" | "params">> = {},
): VideoCameraMove {
  const base = CAMERA_MOVES.find((m) => m.kind === kind) ?? CAMERA_MOVES[0];
  return {
    ...base,
    id: uid("mov"),
    durationSec: overrides.durationSec ?? base.durationSec,
    easing: overrides.easing ?? base.easing,
    params: { ...base.params, ...(overrides.params ?? {}) },
  };
}
