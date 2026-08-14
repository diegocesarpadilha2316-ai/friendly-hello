/**
 * Fase 3.21 — Interpolador determinístico para batch de câmeras.
 */
export interface CameraKeyframe {
  readonly t: number;
  readonly cameraId: string;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function interpolateCameraSequence(
  keyframes: readonly CameraKeyframe[],
  steps: number,
): readonly string[] {
  if (keyframes.length === 0) return [];
  if (keyframes.length === 1) return Array.from({ length: steps }, () => keyframes[0].cameraId);
  const out: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = easeInOut(i / Math.max(1, steps - 1));
    let best = keyframes[0];
    let bestDist = Math.abs(keyframes[0].t - t);
    for (const k of keyframes) {
      const d = Math.abs(k.t - t);
      if (d < bestDist) {
        best = k;
        bestDist = d;
      }
    }
    out.push(best.cameraId);
  }
  return out;
}
