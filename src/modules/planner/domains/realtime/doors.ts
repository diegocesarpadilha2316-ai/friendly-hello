/**
 * Fase 3.23 — Portas.
 */
import type { RealtimeDoorState } from "./types";

export function openDoor(d: RealtimeDoorState): RealtimeDoorState {
  return { ...d, openRatio: 1 };
}
export function closeDoor(d: RealtimeDoorState): RealtimeDoorState {
  return { ...d, openRatio: 0 };
}
export function setDoor(d: RealtimeDoorState, ratio: number): RealtimeDoorState {
  return { ...d, openRatio: Math.max(0, Math.min(1, ratio)) };
}
export function toggleDoor(d: RealtimeDoorState): RealtimeDoorState {
  return d.openRatio > 0.5 ? closeDoor(d) : openDoor(d);
}
export function upsertDoor(
  list: readonly RealtimeDoorState[],
  door: RealtimeDoorState,
): readonly RealtimeDoorState[] {
  const idx = list.findIndex((d) => d.nodeId === door.nodeId);
  if (idx < 0) return [...list, door];
  const clone = [...list];
  clone[idx] = door;
  return clone;
}
