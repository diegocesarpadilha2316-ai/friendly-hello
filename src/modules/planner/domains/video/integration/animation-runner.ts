/**
 * Fase 3.31 — Runner real das animações (Portas / Gavetas / LED / Luz /
 * Vidros / Espelhos / Materiais / Ripados / Estrutura / Ferragens).
 *
 * Reaproveita `door-animation`, `drawer-animation`, `led-animation`,
 * `lighting-animation` e `scene-animation` do local-engine.
 */
import { interpolateDoorAngle } from "../local-engine/door-animation";
import { interpolateDrawerOffset } from "../local-engine/drawer-animation";
import { sampleLedIntensity } from "../local-engine/led-animation";
import { sampleLighting } from "../local-engine/lighting-animation";
import { sampleSceneProgress } from "../local-engine/scene-animation";
import type { LocalObjectAnimation, LocalObjectAnimationKind } from "../local-engine/types";

export interface ResolvedAnimation {
  readonly id: string;
  readonly kind: LocalObjectAnimationKind;
  readonly targetNodeId?: string;
  readonly progress: number;
  readonly value: number;
  readonly opacity: number;
}

function evaluate(a: LocalObjectAnimation, sec: number): { value: number; opacity: number } {
  switch (a.kind) {
    case "door-open":
    case "door-close":
      return { value: interpolateDoorAngle(a, sec), opacity: 1 };
    case "drawer-open":
    case "drawer-close":
      return { value: interpolateDrawerOffset(a, sec), opacity: 1 };
    case "led-on":
    case "led-off":
      return { value: sampleLedIntensity(a, sec), opacity: 1 };
    case "lighting-swap":
      return { value: sampleLighting(a, sec).intensity, opacity: 1 };
    default:
      return { value: sampleSceneProgress(a, sec), opacity: 1 };
  }
}

export function resolveAt(
  animations: readonly LocalObjectAnimation[],
  sec: number,
): readonly ResolvedAnimation[] {
  const out: ResolvedAnimation[] = [];
  for (const a of animations) {
    if (sec < a.startSec || sec >= a.startSec + a.durationSec) continue;
    const { value, opacity } = evaluate(a, sec);
    const progress = Math.max(0, Math.min(1, (sec - a.startSec) / a.durationSec));
    out.push({
      id: a.id,
      kind: a.kind,
      targetNodeId: a.targetNodeId,
      progress,
      value,
      opacity,
    });
  }
  return out;
}
