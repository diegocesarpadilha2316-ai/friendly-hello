/**
 * Fase 3.22 — Animações "explicativas" de cena (explodir, estrutura,
 * ferragens, divisórias, ripados, vidros, espelhos, montagem).
 */
import type { LocalObjectAnimation, LocalObjectAnimationKind } from "./types";

const CATALOG: readonly {
  readonly kind: LocalObjectAnimationKind;
  readonly label: string;
  readonly duration: number;
  readonly params: Readonly<Record<string, number | string | boolean>>;
}[] = [
  { kind: "explode", label: "Explodir móvel", duration: 2.5, params: { factor: 0.6 } },
  { kind: "show-structure", label: "Mostrar estrutura", duration: 1.8, params: { opacity: 0.5 } },
  { kind: "show-hardware", label: "Mostrar ferragens", duration: 1.6, params: { highlight: "brass" } },
  { kind: "show-assembly", label: "Mostrar montagem", duration: 3.0, params: { sequence: "bottom-up" } },
  { kind: "show-dividers", label: "Mostrar divisórias", duration: 1.4, params: {} },
  { kind: "show-slats", label: "Mostrar ripado", duration: 1.6, params: { pitch: 40 } },
  { kind: "show-glass", label: "Mostrar vidro", duration: 1.2, params: { transmission: 0.9 } },
  { kind: "show-mirror", label: "Mostrar espelho", duration: 1.2, params: { reflectivity: 1 } },
];

export const SCENE_ANIMATION_CATALOG = CATALOG;

export function sceneAnimation(kind: LocalObjectAnimationKind, startSec: number): LocalObjectAnimation {
  const entry = CATALOG.find((c) => c.kind === kind) ?? CATALOG[0];
  return {
    id: `scene.${kind}.${startSec.toFixed(2)}`,
    kind,
    label: entry.label,
    startSec,
    durationSec: entry.duration,
    easing: "ease-in-out",
    params: entry.params,
  };
}

export function sampleSceneProgress(anim: LocalObjectAnimation, atSec: number): number {
  const t = (atSec - anim.startSec) / anim.durationSec;
  return Math.max(0, Math.min(1, t));
}