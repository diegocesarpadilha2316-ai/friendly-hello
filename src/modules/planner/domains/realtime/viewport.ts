/**
 * Fase 3.23 — Estado do viewport interativo.
 */
import type {
  RealtimeNavigationMode,
  RealtimeQualityTier,
  RealtimeViewportState,
} from "./types";

export const DEFAULT_REALTIME_VIEWPORT: RealtimeViewportState = {
  navigation: "orbit",
  quality: "alta",
  fullscreen: false,
  showGrid: true,
  showMinimap: true,
  showSafeArea: false,
  showCompare: false,
  showHotspots: true,
};

export function setNavigation(
  s: RealtimeViewportState,
  navigation: RealtimeNavigationMode,
): RealtimeViewportState {
  if (navigation === "cliente") {
    return { ...s, navigation, showGrid: false, showMinimap: true, showSafeArea: false };
  }
  if (navigation === "apresentacao") {
    return {
      ...s,
      navigation,
      fullscreen: true,
      showGrid: false,
      showMinimap: false,
      showSafeArea: false,
      showHotspots: false,
    };
  }
  return { ...s, navigation };
}

export function setViewportQuality(
  s: RealtimeViewportState,
  quality: RealtimeQualityTier,
): RealtimeViewportState {
  return { ...s, quality };
}

export function toggleFullscreen(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, fullscreen: !s.fullscreen };
}

export function toggleGrid(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, showGrid: !s.showGrid };
}

export function toggleMinimap(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, showMinimap: !s.showMinimap };
}

export function toggleSafeArea(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, showSafeArea: !s.showSafeArea };
}

export function toggleCompare(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, showCompare: !s.showCompare };
}

export function toggleHotspots(s: RealtimeViewportState): RealtimeViewportState {
  return { ...s, showHotspots: !s.showHotspots };
}

export const REALTIME_NAV_MODES: readonly RealtimeNavigationMode[] = [
  "walk", "fps", "orbit", "drone", "cliente", "apresentacao", "livre",
];

export function navigationLabel(m: RealtimeNavigationMode): string {
  switch (m) {
    case "walk": return "Caminhar";
    case "fps": return "1ª Pessoa";
    case "orbit": return "Órbita";
    case "drone": return "Drone";
    case "cliente": return "Cliente";
    case "apresentacao": return "Apresentação";
    case "livre": return "Livre";
  }
}