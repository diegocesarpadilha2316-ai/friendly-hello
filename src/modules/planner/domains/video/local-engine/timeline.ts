/**
 * Fase 3.22 — Timeline: clips + tracks + duração total.
 */
import { LOCAL_CAMERAS } from "../../render/local-engine/cameras";
import { DEFAULT_MOVE_ID, getCameraMove } from "./camera-path";
import { DEFAULT_TRANSITION_IN, DEFAULT_TRANSITION_OUT, transition } from "./transitions";
import type {
  LocalCameraMoveKind,
  LocalClip,
  LocalFps,
  LocalTimeline,
  LocalTrack,
  LocalTransitionKind,
} from "./types";

export const DEFAULT_FPS: LocalFps = 30;

export function makeClip(input: {
  id: string;
  cameraId?: string;
  moveId?: LocalCameraMoveKind;
  roomId?: string | null;
  startSec: number;
  durationSec?: number;
  transitionInKind?: LocalTransitionKind;
  transitionOutKind?: LocalTransitionKind;
  animationIds?: readonly string[];
  label?: string;
  speed?: number;
  loops?: number;
  pauseAfterSec?: number;
}): LocalClip {
  const moveId = input.moveId ?? DEFAULT_MOVE_ID;
  const move = getCameraMove(moveId);
  const cameraId = input.cameraId ?? LOCAL_CAMERAS[0].id;
  return {
    id: input.id,
    label: input.label ?? move.label,
    cameraId,
    moveId,
    roomId: input.roomId ?? null,
    startSec: input.startSec,
    durationSec: input.durationSec ?? move.defaultDurationSec,
    speed: input.speed ?? 1,
    loops: input.loops ?? 0,
    pauseAfterSec: input.pauseAfterSec ?? 0,
    animationIds: input.animationIds ?? [],
    transitionIn: input.transitionInKind
      ? transition(input.transitionInKind)
      : DEFAULT_TRANSITION_IN,
    transitionOut: input.transitionOutKind
      ? transition(input.transitionOutKind)
      : DEFAULT_TRANSITION_OUT,
  };
}

export function buildTimeline(input: {
  fps?: LocalFps;
  clips: readonly LocalClip[];
  tracks?: readonly LocalTrack[];
}): LocalTimeline {
  const fps = input.fps ?? DEFAULT_FPS;
  const dur = input.clips.reduce(
    (acc, c) => Math.max(acc, c.startSec + c.durationSec + c.pauseAfterSec),
    0,
  );
  return { fps, durationSec: dur, clips: input.clips, tracks: input.tracks ?? [] };
}

export function defaultTimeline(): LocalTimeline {
  return buildTimeline({
    fps: DEFAULT_FPS,
    clips: [
      makeClip({ id: "clip.1", moveId: "orbit", startSec: 0, durationSec: 8 }),
      makeClip({
        id: "clip.2",
        moveId: "fly-through",
        startSec: 8,
        durationSec: 6,
        transitionInKind: "fade",
      }),
      makeClip({
        id: "clip.3",
        moveId: "close",
        startSec: 14,
        durationSec: 4,
        transitionInKind: "zoom",
      }),
    ],
  });
}

export function totalFrames(t: LocalTimeline): number {
  return Math.round(t.durationSec * t.fps);
}

export function activeClipAt(t: LocalTimeline, atSec: number): LocalClip | null {
  return t.clips.find((c) => atSec >= c.startSec && atSec <= c.startSec + c.durationSec) ?? null;
}
