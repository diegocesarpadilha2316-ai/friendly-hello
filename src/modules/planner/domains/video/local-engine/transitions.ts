/**
 * Fase 3.22 — Transições entre clips.
 */
import type { LocalTransition, LocalTransitionKind } from "./types";

export const LOCAL_TRANSITIONS: readonly {
  readonly kind: LocalTransitionKind;
  readonly label: string;
  readonly defaultSec: number;
}[] = [
  { kind: "cut", label: "Cut", defaultSec: 0 },
  { kind: "fade", label: "Fade", defaultSec: 0.6 },
  { kind: "zoom", label: "Zoom", defaultSec: 0.8 },
  { kind: "slide", label: "Slide", defaultSec: 0.7 },
  { kind: "blur", label: "Blur", defaultSec: 0.9 },
  { kind: "cinema", label: "Cinema", defaultSec: 1.2 },
];

export function transition(kind: LocalTransitionKind, durationSec?: number): LocalTransition {
  const entry = LOCAL_TRANSITIONS.find((t) => t.kind === kind) ?? LOCAL_TRANSITIONS[0];
  return {
    id: `tr.${kind}.${(durationSec ?? entry.defaultSec).toFixed(2)}`,
    kind,
    durationSec: durationSec ?? entry.defaultSec,
    easing: kind === "cinema" ? "cinematic" : "ease-in-out",
  };
}

export const DEFAULT_TRANSITION_IN: LocalTransition = transition("fade");
export const DEFAULT_TRANSITION_OUT: LocalTransition = transition("fade");
