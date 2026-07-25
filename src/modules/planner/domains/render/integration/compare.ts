/**
 * Fase 3.30 — Viewport Before/After/Split/Fullscreen.
 */
import type { ViewportCompareMode, ViewportCompareState } from "./types";

export const DEFAULT_COMPARE: ViewportCompareState = {
  mode: "after",
  splitPercent: 50,
  beforeJobId: null,
  afterJobId: null,
};

export function withMode(state: ViewportCompareState, mode: ViewportCompareMode): ViewportCompareState {
  return { ...state, mode };
}

export function withSplit(state: ViewportCompareState, splitPercent: number): ViewportCompareState {
  return { ...state, splitPercent: Math.max(0, Math.min(100, splitPercent)) };
}

export function withBefore(state: ViewportCompareState, id: string | null): ViewportCompareState {
  return { ...state, beforeJobId: id };
}

export function withAfter(state: ViewportCompareState, id: string | null): ViewportCompareState {
  return { ...state, afterJobId: id };
}