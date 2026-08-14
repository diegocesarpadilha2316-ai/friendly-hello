/**
 * Fase 3.31 — Runner real da timeline.
 *
 * Percorre `LocalTimeline` (Fase 3.22) e emite hooks por frame — sem
 * simulação. Delegado ao caller: o hook `useVideoReal()` liga ao runtime
 * do Realtime/Render, aplicando câmera/animação a cada tick.
 */
import type {
  LocalClip,
  LocalFps,
  LocalObjectAnimation,
  LocalTimeline,
  LocalTrack,
} from "../local-engine/types";

export interface TimelineTick {
  readonly frame: number;
  readonly timeSec: number;
  readonly fps: LocalFps;
  readonly activeClipId: string | null;
  readonly activeAnimations: readonly string[];
  readonly cameraKeyframeValue: number | string | boolean | null;
}

function activeClipAt(t: LocalTimeline, sec: number): LocalClip | null {
  for (const c of t.clips) {
    if (sec >= c.startSec && sec < c.startSec + c.durationSec) return c;
  }
  return null;
}

function cameraTrack(t: LocalTimeline): LocalTrack | null {
  return t.tracks.find((x) => x.kind === "camera") ?? null;
}

export function iterateTimeline(t: LocalTimeline): readonly TimelineTick[] {
  const total = Math.round(t.durationSec * t.fps);
  const cam = cameraTrack(t);
  const out: TimelineTick[] = [];
  for (let f = 0; f < total; f += 1) {
    const sec = f / t.fps;
    const clip = activeClipAt(t, sec);
    const activeAnimations = clip?.animationIds ?? [];
    let camVal: number | string | boolean | null = null;
    if (cam) {
      const kf = cam.keyframes.filter((k) => k.atSec <= sec).pop();
      camVal = kf?.value ?? null;
    }
    out.push({
      frame: f,
      timeSec: sec,
      fps: t.fps,
      activeClipId: clip?.id ?? null,
      activeAnimations,
      cameraKeyframeValue: camVal,
    });
  }
  return out;
}

export function animationsAt(
  animations: readonly LocalObjectAnimation[],
  sec: number,
): readonly LocalObjectAnimation[] {
  return animations.filter((a) => sec >= a.startSec && sec < a.startSec + a.durationSec);
}

export function progressOf(a: LocalObjectAnimation, sec: number): number {
  if (sec <= a.startSec) return 0;
  if (sec >= a.startSec + a.durationSec) return 1;
  return (sec - a.startSec) / a.durationSec;
}
