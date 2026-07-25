/**
 * Fase 3.31 — Runner real das animações (Portas / Gavetas / LED / Luz /
 * Vidros / Espelhos / Materiais / Ripados / Estrutura / Ferragens).
 *
 * Reaproveita `door-animation`, `drawer-animation`, `led-animation`,
 * `lighting-animation` e `scene-animation` do local-engine.
 */
import { doorAnimationAt } from "../local-engine/door-animation";
import { drawerAnimationAt } from "../local-engine/drawer-animation";
import { ledAnimationAt } from "../local-engine/led-animation";
import { lightingAnimationAt } from "../local-engine/lighting-animation";
import { sceneAnimationAt } from "../local-engine/scene-animation";
import type {
  LocalObjectAnimation,
  LocalObjectAnimationKind,
} from "../local-engine/types";

export interface ResolvedAnimation {
  readonly id: string;
  readonly kind: LocalObjectAnimationKind;
  readonly targetNodeId?: string;
  readonly progress: number;
  readonly value: number;
  readonly opacity: number;
}

function evaluate(
  a: LocalObjectAnimation,
  sec: number,
): { value: number; opacity: number } {
  const rel = sec - a.startSec;
  switch (a.kind) {
    case "door-open":
    case "door-close":
      return { value: doorAnimationAt(a, rel), opacity: 1 };
    case "drawer-open":
    case "drawer-close":
      return { value: drawerAnimationAt(a, rel), opacity: 1 };
    case "led-on":
    case "led-off":
      return { value: ledAnimationAt(a, rel), opacity: 1 };
    case "lighting-swap":
      return { value: lightingAnimationAt(a, rel), opacity: 1 };
    default:
      return { value: sceneAnimationAt(a, rel), opacity: 1 };
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