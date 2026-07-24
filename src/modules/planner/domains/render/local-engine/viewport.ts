/**
 * Fase 3.21 — Estado do viewport local.
 */
import type { LocalQualityId, LocalViewportState } from "./types";

export const DEFAULT_VIEWPORT: LocalViewportState = {
  mode: "realtime",
  aspect: "16:9",
  showGrid: true,
  showSafeArea: false,
  exposure: 0,
  qualityCompare: ["media", "cinema"],
};

export function withMode(v: LocalViewportState, mode: LocalViewportState["mode"]): LocalViewportState {
  return { ...v, mode };
}

export function withCompare(
  v: LocalViewportState,
  a: LocalQualityId,
  b: LocalQualityId,
): LocalViewportState {
  return { ...v, qualityCompare: [a, b] };
}