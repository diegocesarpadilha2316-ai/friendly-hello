/**
 * Fase 3.23 — Seleção em tempo real.
 */
import type { RealtimeSelectionState } from "./types";

export const EMPTY_SELECTION: RealtimeSelectionState = {
  selectedNodeIds: [],
  hoverNodeId: null,
};

export function selectOne(s: RealtimeSelectionState, id: string): RealtimeSelectionState {
  return { ...s, selectedNodeIds: [id] };
}

export function toggleSelection(s: RealtimeSelectionState, id: string): RealtimeSelectionState {
  const has = s.selectedNodeIds.includes(id);
  return {
    ...s,
    selectedNodeIds: has ? s.selectedNodeIds.filter((x) => x !== id) : [...s.selectedNodeIds, id],
  };
}

export function clearSelection(s: RealtimeSelectionState): RealtimeSelectionState {
  return { ...s, selectedNodeIds: [] };
}

export function setHover(s: RealtimeSelectionState, id: string | null): RealtimeSelectionState {
  return { ...s, hoverNodeId: id };
}

export function isSelected(s: RealtimeSelectionState, id: string): boolean {
  return s.selectedNodeIds.includes(id);
}