/**
 * Fase 3.22 — Catálogo dos 14 movimentos de câmera do motor local.
 * Puro/determinístico. Sem estado.
 */
import type { LocalCameraMove, LocalCameraMoveKind } from "./types";

export const LOCAL_CAMERA_MOVES: readonly LocalCameraMove[] = [
  {
    id: "orbit",
    label: "Orbit 360°",
    description: "Órbita completa em torno do foco.",
    defaultDurationSec: 12,
    easing: "ease-in-out",
    params: { revolutions: 1, radiusMm: 4000, heightMm: 1600 },
  },
  {
    id: "fly-through",
    label: "Fly Through",
    description: "Voo suave atravessando o ambiente.",
    defaultDurationSec: 10,
    easing: "ease-in-out",
    params: { speedMs: 800, heightMm: 1600 },
  },
  {
    id: "walk-through",
    label: "Walk Through",
    description: "Passeio ao nível do olhar humano.",
    defaultDurationSec: 14,
    easing: "ease-in-out",
    params: { speedMs: 1200, heightMm: 1500 },
  },
  {
    id: "first-person",
    label: "Primeira Pessoa",
    description: "Câmera POV com micro-movimento.",
    defaultDurationSec: 12,
    easing: "cinematic",
    params: { heightMm: 1550, bobbing: true },
  },
  {
    id: "travelling",
    label: "Travelling",
    description: "Trilho lateral cinematográfico.",
    defaultDurationSec: 8,
    easing: "ease-in-out",
    params: { rangeMm: 3500, heightMm: 1500 },
  },
  {
    id: "pan",
    label: "Pan",
    description: "Rotação horizontal fixa.",
    defaultDurationSec: 6,
    easing: "ease-in-out",
    params: { angleDeg: 90 },
  },
  {
    id: "tilt",
    label: "Tilt",
    description: "Rotação vertical fixa.",
    defaultDurationSec: 6,
    easing: "ease-in-out",
    params: { angleDeg: 45 },
  },
  {
    id: "zoom",
    label: "Zoom",
    description: "Alteração de focal length com dolly.",
    defaultDurationSec: 5,
    easing: "ease-out",
    params: { fromMm: 35, toMm: 85 },
  },
  {
    id: "close",
    label: "Close",
    description: "Aproximação de detalhe.",
    defaultDurationSec: 4,
    easing: "ease-out",
    params: { fromMm: 3000, toMm: 900 },
  },
  {
    id: "detalhe",
    label: "Detalhe",
    description: "Câmera macro em ferragens/veios.",
    defaultDurationSec: 4,
    easing: "ease-in-out",
    params: { focalMm: 100, distanceMm: 400 },
  },
  {
    id: "drone",
    label: "Drone",
    description: "Voo alto com plongée cinematográfico.",
    defaultDurationSec: 10,
    easing: "cinematic",
    params: { heightMm: 4500, radiusMm: 6000 },
  },
  {
    id: "cliente",
    label: "Cliente",
    description: "Passeio de apresentação a cliente.",
    defaultDurationSec: 16,
    easing: "ease-in-out",
    params: { stops: 4 },
  },
  {
    id: "apresentacao",
    label: "Apresentação",
    description: "Sequência para portfólio/proposta.",
    defaultDurationSec: 20,
    easing: "ease-in-out",
    params: { stops: 5 },
  },
  {
    id: "livre",
    label: "Livre",
    description: "Trajetória customizável por keyframes.",
    defaultDurationSec: 8,
    easing: "linear",
    params: { editable: true },
  },
];

const INDEX = new Map(LOCAL_CAMERA_MOVES.map((m) => [m.id, m]));

export function getCameraMove(id: LocalCameraMoveKind): LocalCameraMove {
  return INDEX.get(id) ?? LOCAL_CAMERA_MOVES[0];
}

export const DEFAULT_MOVE_ID: LocalCameraMoveKind = "orbit";
