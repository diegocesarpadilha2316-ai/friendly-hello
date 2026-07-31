/**
 * Preparação para a futura camada de ANIMAÇÃO.
 * Esta etapa NÃO anima — apenas descreve, de forma declarativa, como cada
 * mecanismo deve se comportar quando a animação for ligada.
 */
import type { ConstructionMotion, ConstructionPiece } from "./types";
import type { PartKind } from "../engineering/types";

/** Estado normalizado de um mecanismo: 0 = fechado, 1 = totalmente aberto. */
export type MotionState = number;

export interface MotionTransform {
  readonly pieceId: string;
  /** Translação em mm no espaço local do móvel. */
  readonly translate: readonly [number, number, number];
  /** Rotação em graus por eixo. */
  readonly rotateDeg: readonly [number, number, number];
  /** Pivô da rotação (mm). */
  readonly pivot: readonly [number, number, number];
}

function easeValue(t: number, easing: ConstructionMotion["easing"]): number {
  const x = Math.min(1, Math.max(0, t));
  if (easing === "linear") return x;
  if (easing === "ease-out") return 1 - (1 - x) ** 3;
  // soft-close: rápido no início, desacelera bastante no fim
  return 1 - (1 - x) ** 5;
}

/**
 * Resolve a transformação de UMA peça para um estado de abertura.
 * Pura — a camada de render só aplica o resultado.
 */
export function resolveMotion(motion: ConstructionMotion, state: MotionState): MotionTransform {
  const t = easeValue(state, motion.easing);
  const pivot = motion.pivot ?? [0, 0, 0];

  if (motion.kind === "slide") {
    const travel = (motion.maxTravelMm ?? 0) * t * motion.direction;
    return {
      pieceId: motion.pieceId,
      translate:
        motion.axis === "x"
          ? [travel, 0, 0]
          : motion.axis === "y"
            ? [0, travel, 0]
            : [0, 0, travel],
      rotateDeg: [0, 0, 0],
      pivot,
    };
  }

  if (motion.kind === "static") {
    return { pieceId: motion.pieceId, translate: [0, 0, 0], rotateDeg: [0, 0, 0], pivot };
  }

  const angle = (motion.maxAngleDeg ?? 90) * t * motion.direction;
  return {
    pieceId: motion.pieceId,
    translate: [0, 0, 0],
    rotateDeg:
      motion.axis === "x" ? [angle, 0, 0] : motion.axis === "y" ? [0, angle, 0] : [0, 0, angle],
    pivot,
  };
}

/** Resolve um conjunto de mecanismos com o mesmo estado (ex.: "abrir tudo"). */
export function resolveMotions(
  motions: readonly ConstructionMotion[],
  stateByPieceId: Readonly<Record<string, MotionState>> | MotionState,
): readonly MotionTransform[] {
  return motions.map((m) =>
    resolveMotion(
      m,
      typeof stateByPieceId === "number" ? stateByPieceId : (stateByPieceId[m.pieceId] ?? 0),
    ),
  );
}

/** Agrupa mecanismos que devem se mover juntos (todas as peças de uma gaveta). */
export function groupMotionsByInstance(
  motions: readonly ConstructionMotion[],
): Readonly<Record<string, readonly ConstructionMotion[]>> {
  const out: Record<string, ConstructionMotion[]> = {};
  for (const m of motions) {
    const key = m.pieceId.split(":").slice(0, -1).join(":") || m.pieceId;
    (out[key] ??= []).push(m);
  }
  return out;
}

/* ─────────────────── COMANDOS DA INTERFACE → MECANISMOS ───────────────────
 * Ponte genérica entre os botões do viewport ("Abrir portas", "Abrir
 * gavetas") e QUALQUER componente da biblioteca. Componentes novos passam
 * a responder automaticamente, sem tocar no render.
 * ------------------------------------------------------------------------ */

/** Grupo de mecanismo controlável pela interface. */
export type MotionGroup = "portas" | "gavetas" | "mecanismos";

const DRAWER_PARTS = new Set<PartKind>([
  "gaveta-frente",
  "gaveta-lateral",
  "gaveta-fundo",
  "gaveta-base",
]);

/** A que comando de interface uma peça responde. */
export function motionGroupOfPart(partKind: PartKind): MotionGroup {
  if (partKind === "porta") return "portas";
  if (DRAWER_PARTS.has(partKind)) return "gavetas";
  return "mecanismos";
}

export function motionGroupOfPiece(piece: Pick<ConstructionPiece, "partKind">): MotionGroup {
  return motionGroupOfPart(piece.partKind);
}

/** Estado dos comandos da interface (barra inferior do editor / cenas). */
export interface MotionControls {
  readonly openDoors?: boolean;
  readonly openDrawers?: boolean;
  /** Mecanismos diversos (basculante, aramado, sanfona…) — futuro. */
  readonly openMechanisms?: boolean;
}

/** Traduz os comandos da interface no estado 0→1 de um grupo. */
export function openStateForGroup(group: MotionGroup, controls: MotionControls): MotionState {
  if (group === "portas") return controls.openDoors ? 1 : 0;
  if (group === "gavetas") return controls.openDrawers ? 1 : 0;
  return controls.openMechanisms ? 1 : 0;
}

/**
 * Estado alvo de cada peça a partir dos comandos da interface.
 * O grupo vem SEMPRE da peça (partKind), nunca do tipo de movimento —
 * porta de correr e gaveta usam o mesmo "slide" e não podem ser confundidas.
 */
export function openStatesByPiece(
  pieces: readonly Pick<ConstructionPiece, "id" | "partKind">[],
  controls: MotionControls,
): Readonly<Record<string, MotionState>> {
  const out: Record<string, MotionState> = {};
  for (const p of pieces) out[p.id] = openStateForGroup(motionGroupOfPart(p.partKind), controls);
  return out;
}
