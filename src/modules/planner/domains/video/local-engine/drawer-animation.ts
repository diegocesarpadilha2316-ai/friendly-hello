/**
 * Fase 3.22 — Animação determinística de gavetas.
 */
import type { LocalObjectAnimation } from "./types";

export function drawerOpen(nodeId: string, startSec: number, durationSec = 1.0): LocalObjectAnimation {
  return {
    id: `drawer.open.${nodeId}.${startSec.toFixed(2)}`,
    kind: "drawer-open",
    label: `Abrir gaveta ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-out",
    params: { offsetFromMm: 0, offsetToMm: 450 },
  };
}

export function drawerClose(nodeId: string, startSec: number, durationSec = 0.9): LocalObjectAnimation {
  return {
    id: `drawer.close.${nodeId}.${startSec.toFixed(2)}`,
    kind: "drawer-close",
    label: `Fechar gaveta ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-in",
    params: { offsetFromMm: 450, offsetToMm: 0 },
  };
}

export function interpolateDrawerOffset(anim: LocalObjectAnimation, atSec: number): number {
  const from = Number(anim.params.offsetFromMm ?? 0);
  const to = Number(anim.params.offsetToMm ?? 400);
  const t = Math.max(0, Math.min(1, (atSec - anim.startSec) / anim.durationSec));
  const e = 1 - Math.pow(1 - t, 3);
  return from + (to - from) * e;
}