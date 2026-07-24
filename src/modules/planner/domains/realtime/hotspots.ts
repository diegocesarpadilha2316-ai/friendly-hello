/**
 * Fase 3.23 — Hotspots interativos.
 */
import type { RealtimeHotspot } from "./types";

export function addHotspot(list: readonly RealtimeHotspot[], h: RealtimeHotspot): readonly RealtimeHotspot[] {
  return [...list.filter((x) => x.id !== h.id), h];
}

export function removeHotspot(list: readonly RealtimeHotspot[], id: string): readonly RealtimeHotspot[] {
  return list.filter((x) => x.id !== id);
}

export function hotspotsFor(node: string, list: readonly RealtimeHotspot[]): readonly RealtimeHotspot[] {
  return list.filter((x) => x.nodeId === node);
}

export function buildDefaultHotspot(nodeId: string, label: string, value: string): RealtimeHotspot {
  return { id: `hs_${nodeId}_${Date.now().toString(36)}`, nodeId, label, kind: "info", value };
}