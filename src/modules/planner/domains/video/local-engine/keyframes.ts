/**
 * Fase 3.22 — Utilidades de keyframes.
 */
import type { LocalEasing, LocalKeyframe } from "./types";

export function keyframe(
  atSec: number,
  value: number | string | boolean,
  easing: LocalEasing = "ease-in-out",
  label?: string,
): LocalKeyframe {
  return { id: `kf.${atSec.toFixed(3)}.${String(value)}`, atSec, value, easing, label };
}

export function sortKeyframes(kf: readonly LocalKeyframe[]): readonly LocalKeyframe[] {
  return [...kf].sort((a, b) => a.atSec - b.atSec);
}

export function interpolateNumericKeyframes(kf: readonly LocalKeyframe[], atSec: number): number {
  const sorted = sortKeyframes(kf);
  if (sorted.length === 0) return 0;
  if (atSec <= sorted[0].atSec) return Number(sorted[0].value);
  const last = sorted[sorted.length - 1];
  if (atSec >= last.atSec) return Number(last.value);
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (atSec >= a.atSec && atSec <= b.atSec) {
      const t = (atSec - a.atSec) / Math.max(0.0001, b.atSec - a.atSec);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      return Number(a.value) + (Number(b.value) - Number(a.value)) * e;
    }
  }
  return Number(last.value);
}
