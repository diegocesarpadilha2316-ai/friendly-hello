/**
 * Fase 3.22 — Animação determinística de portas.
 */
import type { LocalObjectAnimation } from "./types";

export function doorOpen(nodeId: string, startSec: number, durationSec = 1.2): LocalObjectAnimation {
  return {
    id: `door.open.${nodeId}.${startSec.toFixed(2)}`,
    kind: "door-open",
    label: `Abrir porta ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-in-out",
    params: { angleFromDeg: 0, angleToDeg: 105, hingeSide: "right" },
  };
}

export function doorClose(nodeId: string, startSec: number, durationSec = 1.0): LocalObjectAnimation {
  return {
    id: `door.close.${nodeId}.${startSec.toFixed(2)}`,
    kind: "door-close",
    label: `Fechar porta ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-in",
    params: { angleFromDeg: 105, angleToDeg: 0, hingeSide: "right" },
  };
}

export function interpolateDoorAngle(anim: LocalObjectAnimation, atSec: number): number {
  const from = Number(anim.params.angleFromDeg ?? 0);
  const to = Number(anim.params.angleToDeg ?? 90);
  const t = Math.max(0, Math.min(1, (atSec - anim.startSec) / anim.durationSec));
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return from + (to - from) * e;
}