/**
 * Preparação para a futura camada de ANIMAÇÃO.
 * Esta etapa NÃO anima — apenas descreve, de forma declarativa, como cada
 * mecanismo deve se comportar quando a animação for ligada.
 */
import type { ConstructionMotion } from "./types";

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
