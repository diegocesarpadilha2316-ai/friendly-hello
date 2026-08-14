/**
 * Fase 3.23 — Gavetas.
 */
import type { RealtimeDrawerState } from "./types";

export function openDrawer(d: RealtimeDrawerState): RealtimeDrawerState {
  return { ...d, openRatio: 1 };
}
export function closeDrawer(d: RealtimeDrawerState): RealtimeDrawerState {
  return { ...d, openRatio: 0 };
}
export function setDrawer(d: RealtimeDrawerState, ratio: number): RealtimeDrawerState {
  return { ...d, openRatio: Math.max(0, Math.min(1, ratio)) };
}
export function toggleDrawer(d: RealtimeDrawerState): RealtimeDrawerState {
  return d.openRatio > 0.5 ? closeDrawer(d) : openDrawer(d);
}
export function upsertDrawer(
  list: readonly RealtimeDrawerState[],
  drawer: RealtimeDrawerState,
): readonly RealtimeDrawerState[] {
  const idx = list.findIndex((d) => d.nodeId === drawer.nodeId);
  if (idx < 0) return [...list, drawer];
  const clone = [...list];
  clone[idx] = drawer;
  return clone;
}
