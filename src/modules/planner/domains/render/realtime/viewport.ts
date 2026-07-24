/**
 * Fase 3.17 — Viewport (trabalho / cliente / apresentação).
 */
import type {
  RealtimeCameraMode,
  RealtimePresentationStep,
  RealtimeQualityTier,
  RealtimeTimeOfDay,
  RealtimeViewportMode,
  RealtimeViewportState,
  RealtimeWeatherId,
} from "./types";

export const DEFAULT_VIEWPORT: RealtimeViewportState = {
  mode: "trabalho",
  camera: "orbita",
  showGuides: true,
  showGrid: true,
  showAxes: true,
  showTools: true,
  fullscreen: false,
  quality: "alto",
  time: "12h",
  weather: "ensolarado",
};

export function applyViewportMode(state: RealtimeViewportState, mode: RealtimeViewportMode): RealtimeViewportState {
  if (mode === "cliente") return { ...state, mode, showGuides: false, showGrid: false, showAxes: false, showTools: false, fullscreen: false };
  if (mode === "apresentacao") return { ...state, mode, showGuides: false, showGrid: false, showAxes: false, showTools: false, fullscreen: true };
  return { ...state, mode, showGuides: true, showGrid: true, showAxes: true, showTools: true, fullscreen: false };
}

export function setCamera(s: RealtimeViewportState, camera: RealtimeCameraMode): RealtimeViewportState { return { ...s, camera }; }
export function setQuality(s: RealtimeViewportState, quality: RealtimeQualityTier): RealtimeViewportState { return { ...s, quality }; }
export function setTime(s: RealtimeViewportState, time: RealtimeTimeOfDay): RealtimeViewportState { return { ...s, time }; }
export function setWeather(s: RealtimeViewportState, weather: RealtimeWeatherId): RealtimeViewportState { return { ...s, weather }; }

export const REALTIME_CAMERA_MODES: readonly RealtimeCameraMode[] = [
  "walk", "fps", "orbita", "drone", "interior", "exterior", "cliente", "apresentacao",
];

export const REALTIME_TIME_OPTIONS: readonly RealtimeTimeOfDay[] = [
  "06h", "08h", "12h", "15h", "18h", "21h",
];

export const DEFAULT_PRESENTATION: readonly RealtimePresentationStep[] = [
  { id: "s-1", label: "Chegada — Exterior", camera: "exterior", time: "12h", weather: "ensolarado", durationSec: 6, openDoors: false, openDrawers: false, ledOn: false },
  { id: "s-2", label: "Entrada", camera: "interior", time: "12h", weather: "ensolarado", durationSec: 5, openDoors: true, openDrawers: false, ledOn: false },
  { id: "s-3", label: "Detalhes — Walk", camera: "walk", time: "15h", weather: "ensolarado", durationSec: 8, openDoors: true, openDrawers: true, ledOn: false },
  { id: "s-4", label: "Fim de tarde", camera: "orbita", time: "18h", weather: "fim-tarde", durationSec: 6, openDoors: true, openDrawers: false, ledOn: true },
  { id: "s-5", label: "Noite com LED", camera: "cliente", time: "21h", weather: "noite", durationSec: 6, openDoors: false, openDrawers: false, ledOn: true },
  { id: "s-6", label: "Drone Final", camera: "drone", time: "18h", weather: "blue-hour", durationSec: 7, openDoors: false, openDrawers: false, ledOn: true },
];