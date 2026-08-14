/**
 * Fase 3.10 — Catálogo de animações de cena.
 *
 * Todas as animações são declarativas — o Video Engine emite as
 * transformações no timeline; qualquer renderer (Motor Gratuito baseado
 * em algoritmo próprio, ou Motor Premium via IA) sabe aplicá-las.
 */
import type { VideoAnimation, VideoAnimationKind } from "../types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface AnimationTemplate {
  readonly kind: VideoAnimationKind;
  readonly label: string;
  readonly description: string;
  readonly defaultDurationSec: number;
  readonly defaultParams: Readonly<Record<string, number | string | boolean>>;
  readonly requiresTarget: boolean;
  readonly icon: string;
}

export const ANIMATION_TEMPLATES: readonly AnimationTemplate[] = [
  {
    kind: "door-open",
    label: "Abrir Porta",
    description: "Rotaciona a porta em torno da dobradiça (0 → ângulo alvo).",
    defaultDurationSec: 1.6,
    defaultParams: { angleDeg: 105, hinge: "auto" },
    requiresTarget: true,
    icon: "door-open",
  },
  {
    kind: "door-close",
    label: "Fechar Porta",
    description: "Fecha a porta na direção oposta à abertura.",
    defaultDurationSec: 1.6,
    defaultParams: { angleDeg: 0 },
    requiresTarget: true,
    icon: "door-close",
  },
  {
    kind: "drawer-open",
    label: "Abrir Gaveta",
    description: "Desliza a gaveta para fora até o limite do corrediço.",
    defaultDurationSec: 1.4,
    defaultParams: { travelMm: 450 },
    requiresTarget: true,
    icon: "drawer-open",
  },
  {
    kind: "drawer-close",
    label: "Fechar Gaveta",
    description: "Retorna a gaveta suavemente até o batente.",
    defaultDurationSec: 1.4,
    defaultParams: { travelMm: 0 },
    requiresTarget: true,
    icon: "drawer-close",
  },
  {
    kind: "led-on",
    label: "Acender LED",
    description: "Rampa de intensidade 0 → alvo com temperatura de cor.",
    defaultDurationSec: 0.8,
    defaultParams: { targetIntensity: 1, temperatureK: 3000 },
    requiresTarget: true,
    icon: "led-on",
  },
  {
    kind: "led-off",
    label: "Apagar LED",
    description: "Rampa suave de intensidade alvo → 0.",
    defaultDurationSec: 0.8,
    defaultParams: { targetIntensity: 0 },
    requiresTarget: true,
    icon: "led-off",
  },
  {
    kind: "lighting-swap",
    label: "Trocar Iluminação",
    description: "Substitui HDRI / preset de luz em cross-fade.",
    defaultDurationSec: 1.2,
    defaultParams: { fromPreset: "auto", toPreset: "auto" },
    requiresTarget: false,
    icon: "sun",
  },
  {
    kind: "camera-move",
    label: "Mover Câmera",
    description: "Executa um movimento de câmera dentro da animação.",
    defaultDurationSec: 6,
    defaultParams: { moveKind: "auto" },
    requiresTarget: false,
    icon: "camera",
  },
  {
    kind: "scene-transition",
    label: "Transição de Ambiente",
    description: "Troca de cômodo/ambiente com transição visual.",
    defaultDurationSec: 1.5,
    defaultParams: { transition: "dissolve" },
    requiresTarget: false,
    icon: "transition",
  },
  {
    kind: "explode",
    label: "Explodir Móvel",
    description: "Afasta cada peça em vetores próprios (marcenaria).",
    defaultDurationSec: 2.5,
    defaultParams: { distanceMm: 480, order: "outside-in" },
    requiresTarget: true,
    icon: "explode",
  },
  {
    kind: "show-structure",
    label: "Mostrar Estrutura",
    description: "Torna translúcidas as faces externas para revelar a estrutura.",
    defaultDurationSec: 1.5,
    defaultParams: { opacity: 0.15 },
    requiresTarget: true,
    icon: "structure",
  },
  {
    kind: "show-hardware",
    label: "Mostrar Ferragens",
    description: "Highlight nos itens de ferragem com callouts.",
    defaultDurationSec: 2,
    defaultParams: { pulse: true, callouts: true },
    requiresTarget: true,
    icon: "hardware",
  },
  {
    kind: "show-cut",
    label: "Mostrar Corte",
    description: "Plano de corte animado revela o interior do módulo.",
    defaultDurationSec: 2.5,
    defaultParams: { axis: "z", positionMm: 0 },
    requiresTarget: true,
    icon: "cut",
  },
];

export function getAnimationTemplate(kind: VideoAnimationKind): AnimationTemplate {
  return ANIMATION_TEMPLATES.find((t) => t.kind === kind) ?? ANIMATION_TEMPLATES[0];
}

export function instantiateAnimation(
  kind: VideoAnimationKind,
  input: {
    startSec?: number;
    durationSec?: number;
    targetNodeId?: string;
    params?: Record<string, number | string | boolean>;
  } = {},
): VideoAnimation {
  const t = getAnimationTemplate(kind);
  return {
    id: uid("anim"),
    kind,
    label: t.label,
    targetNodeId: input.targetNodeId,
    startSec: input.startSec ?? 0,
    durationSec: input.durationSec ?? t.defaultDurationSec,
    easing: "ease-in-out",
    params: { ...t.defaultParams, ...(input.params ?? {}) },
  };
}
