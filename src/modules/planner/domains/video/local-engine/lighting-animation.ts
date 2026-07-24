/**
 * Fase 3.22 — Troca cinematográfica de iluminação (dia→pôr do sol→noite).
 */
import type { LocalObjectAnimation } from "./types";

export type LightingScenario = "dia" | "por-do-sol" | "noite" | "chuva" | "estudio";

const KELVIN: Readonly<Record<LightingScenario, number>> = {
  "dia": 5600,
  "por-do-sol": 3200,
  "noite": 2700,
  "chuva": 6500,
  "estudio": 5000,
};

const INTENSITY: Readonly<Record<LightingScenario, number>> = {
  "dia": 1,
  "por-do-sol": 0.55,
  "noite": 0.2,
  "chuva": 0.6,
  "estudio": 0.85,
};

export function lightingSwap(
  from: LightingScenario,
  to: LightingScenario,
  startSec: number,
  durationSec = 2,
): LocalObjectAnimation {
  return {
    id: `light.swap.${from}.${to}.${startSec.toFixed(2)}`,
    kind: "lighting-swap",
    label: `Iluminação ${from} → ${to}`,
    startSec,
    durationSec,
    easing: "ease-in-out",
    params: {
      fromKelvin: KELVIN[from],
      toKelvin: KELVIN[to],
      fromIntensity: INTENSITY[from],
      toIntensity: INTENSITY[to],
      scenarioFrom: from,
      scenarioTo: to,
    },
  };
}

export function sampleLighting(anim: LocalObjectAnimation, atSec: number): { kelvin: number; intensity: number } {
  const t = Math.max(0, Math.min(1, (atSec - anim.startSec) / anim.durationSec));
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const fromK = Number(anim.params.fromKelvin ?? 5600);
  const toK = Number(anim.params.toKelvin ?? 5600);
  const fromI = Number(anim.params.fromIntensity ?? 1);
  const toI = Number(anim.params.toIntensity ?? 1);
  return { kelvin: fromK + (toK - fromK) * e, intensity: fromI + (toI - fromI) * e };
}