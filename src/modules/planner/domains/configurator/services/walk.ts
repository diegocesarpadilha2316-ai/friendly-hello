import type { WalkModeSpec } from "../types";

export const WALK_MODES: readonly WalkModeSpec[] = [
  {
    id: "orbit",
    label: "Órbita",
    description: "Câmera livre girando ao redor do ambiente.",
    collision: false,
    gravity: false,
    fov: 55,
    speedMmPerSec: 0,
  },
  {
    id: "free",
    label: "Livre",
    description: "Voo livre 6DoF — sem colisão, ideal para inspeção.",
    collision: false,
    gravity: false,
    fov: 65,
    speedMmPerSec: 2500,
  },
  {
    id: "walk",
    label: "Walk",
    description: "Caminhada em altura humana (1.65m) com colisão.",
    collision: true,
    gravity: true,
    fov: 70,
    speedMmPerSec: 1400,
  },
  {
    id: "fps",
    label: "FPS",
    description: "Primeira pessoa cinemática com colisão apertada.",
    collision: true,
    gravity: true,
    fov: 80,
    speedMmPerSec: 1800,
  },
];

export function walkModeById(id: string): WalkModeSpec | null {
  return WALK_MODES.find((m) => m.id === id) ?? null;
}
