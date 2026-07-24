/**
 * Fase 3.10 — Timeline / keyframes / sequências (helpers puros).
 */
import type {
  VideoAnimation,
  VideoCameraMove,
  VideoKeyframe,
  VideoSequence,
  VideoTimeline,
  VideoTrack,
  VideoTrackKind,
  VideoTransition,
} from "../types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_TRANSITION: VideoTransition = {
  kind: "fade",
  durationSec: 0.6,
  easing: "ease-in-out",
};

export function createKeyframe(input: Omit<VideoKeyframe, "id">): VideoKeyframe {
  return { id: uid("kf"), ...input };
}

export function createTrack(input: {
  kind: VideoTrackKind;
  label: string;
  startSec?: number;
  durationSec: number;
  loop?: boolean;
  refId?: string;
  keyframes?: readonly VideoKeyframe[];
}): VideoTrack {
  return {
    id: uid("trk"),
    kind: input.kind,
    label: input.label,
    startSec: input.startSec ?? 0,
    durationSec: input.durationSec,
    loop: input.loop ?? false,
    muted: false,
    locked: false,
    keyframes: input.keyframes ?? [],
    refId: input.refId,
  };
}

export function createSequence(input: {
  label: string;
  startSec?: number;
  durationSec: number;
  speed?: number;
  loops?: number;
  pauseAfterSec?: number;
  transitionIn?: VideoTransition;
  transitionOut?: VideoTransition;
  roomId?: string;
  cameraMoveId?: string;
  animationIds?: readonly string[];
}): VideoSequence {
  return {
    id: uid("seq"),
    label: input.label,
    startSec: input.startSec ?? 0,
    durationSec: input.durationSec,
    speed: input.speed ?? 1,
    loops: input.loops ?? 0,
    pauseAfterSec: input.pauseAfterSec ?? 0,
    transitionIn: input.transitionIn ?? DEFAULT_TRANSITION,
    transitionOut: input.transitionOut ?? DEFAULT_TRANSITION,
    roomId: input.roomId,
    cameraMoveId: input.cameraMoveId,
    animationIds: input.animationIds ?? [],
  };
}

export function createTimeline(
  input: {
    fps?: 24 | 25 | 30 | 48 | 50 | 60;
    durationSec: number;
    tracks?: readonly VideoTrack[];
    sequences?: readonly VideoSequence[];
  } = { durationSec: 30 },
): VideoTimeline {
  return {
    fps: input.fps ?? 30,
    durationSec: input.durationSec,
    tracks: input.tracks ?? [],
    sequences: input.sequences ?? [],
  };
}

/** Deriva a duração total (máximo entre sequências + tracks). */
export function totalDuration(timeline: VideoTimeline): number {
  const tEnd = timeline.tracks.reduce(
    (acc, t) => Math.max(acc, t.startSec + t.durationSec),
    0,
  );
  const sEnd = timeline.sequences.reduce(
    (acc, s) => Math.max(acc, s.startSec + s.durationSec + s.pauseAfterSec),
    0,
  );
  return Math.max(timeline.durationSec, tEnd, sEnd);
}

/** Frames totais = duration * fps (arredondado para cima). */
export function totalFrames(timeline: VideoTimeline): number {
  return Math.ceil(totalDuration(timeline) * timeline.fps);
}

/**
 * Constrói um timeline a partir de uma sequência linear de movimentos de
 * câmera + animações — usado pelas cenas prontas.
 */
export function buildLinearTimeline(input: {
  fps?: 24 | 25 | 30 | 48 | 50 | 60;
  moves: readonly VideoCameraMove[];
  animations?: readonly VideoAnimation[];
  transition?: VideoTransition;
  loop?: boolean;
}): VideoTimeline {
  const fps = input.fps ?? 30;
  const transition = input.transition ?? DEFAULT_TRANSITION;
  let t = 0;
  const sequences: VideoSequence[] = [];
  const cameraTracks: VideoTrack[] = [];
  for (const move of input.moves) {
    sequences.push(
      createSequence({
        label: move.label,
        startSec: t,
        durationSec: move.durationSec,
        cameraMoveId: move.id,
        transitionIn: transition,
        transitionOut: transition,
      }),
    );
    cameraTracks.push(
      createTrack({
        kind: "camera",
        label: move.label,
        startSec: t,
        durationSec: move.durationSec,
        refId: move.id,
      }),
    );
    t += move.durationSec;
  }
  const animationTracks: VideoTrack[] = (input.animations ?? []).map((a) =>
    createTrack({
      kind: "animation",
      label: a.label,
      startSec: a.startSec,
      durationSec: a.durationSec,
      refId: a.id,
    }),
  );
  return createTimeline({
    fps,
    durationSec: t,
    tracks: [...cameraTracks, ...animationTracks],
    sequences,
  });
}