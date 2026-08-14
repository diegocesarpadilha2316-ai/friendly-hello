/**
 * Fase 3.22 — Animação de LED (perfis, embutidos, ripas iluminadas).
 */
import type { LocalObjectAnimation } from "./types";

export function ledOn(nodeId: string, startSec: number, durationSec = 0.6): LocalObjectAnimation {
  return {
    id: `led.on.${nodeId}.${startSec.toFixed(2)}`,
    kind: "led-on",
    label: `Acender LED ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-out",
    params: { fromIntensity: 0, toIntensity: 1, kelvin: 3200 },
  };
}

export function ledOff(nodeId: string, startSec: number, durationSec = 0.5): LocalObjectAnimation {
  return {
    id: `led.off.${nodeId}.${startSec.toFixed(2)}`,
    kind: "led-off",
    label: `Apagar LED ${nodeId}`,
    targetNodeId: nodeId,
    startSec,
    durationSec,
    easing: "ease-in",
    params: { fromIntensity: 1, toIntensity: 0, kelvin: 3200 },
  };
}

export function sampleLedIntensity(anim: LocalObjectAnimation, atSec: number): number {
  const from = Number(anim.params.fromIntensity ?? 0);
  const to = Number(anim.params.toIntensity ?? 1);
  const t = Math.max(0, Math.min(1, (atSec - anim.startSec) / anim.durationSec));
  return from + (to - from) * t;
}
