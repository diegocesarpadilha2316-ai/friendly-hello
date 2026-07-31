/**
 * TAXONOMIA DE FRENTES — fonte única de verdade sobre "o que é esta peça".
 *
 * O sistema tinha uma ambiguidade estrutural: qualquer chapa vertical na
 * frente do móvel era emitida como `porta`. Isso fazia painéis fixos (abas
 * de canto, frentes cegas, tapa-vãos) serem tratados como folhas móveis:
 * entravam na contagem de mecanismos, respondiam ao comando "Abrir portas"
 * e apareciam no diagnóstico como porta sem rig.
 *
 * Aqui a distinção é explícita e reutilizável por QUALQUER família.
 */
import type { PartKind } from "../engineering/types";
import type { ConstructionMotion, ConstructionPiece, FrontRole } from "./types";

/** Frentes móveis: recebem rig, dobradiça e entram no cálculo de ângulo seguro. */
export const MOVABLE_FRONT_KINDS = new Set<PartKind>(["porta", "gaveta-frente"]);

/** Frentes fixas: fecham o vão, mas NUNCA se movem e NUNCA recebem rig. */
export const FIXED_FRONT_KINDS = new Set<PartKind>(["frente-fixa", "tapa-vao"]);

/**
 * Acabamentos: peças vistas que NÃO são frente (rodabanca, frontão, painel
 * de acabamento). Entram na produção e na fita de borda, mas nunca recebem
 * rig, nunca respondem a comandos e nunca tapam vão no intertravamento.
 */
export const FINISH_KINDS = new Set<PartKind>(["acabamento"]);

export function isFinishPart(partKind: PartKind): boolean {
  return FINISH_KINDS.has(partKind);
}

/** Peças que compõem o corpo de uma gaveta (movem junto com a frente). */
export const DRAWER_PART_KINDS = new Set<PartKind>([
  "gaveta-frente",
  "gaveta-lateral",
  "gaveta-fundo",
  "gaveta-base",
]);

/** É um painel frontal fixo (aba de canto, frente cega, tapa-vão)? */
export function isFixedFront(partKind: PartKind): boolean {
  return FIXED_FRONT_KINDS.has(partKind);
}

/** É uma folha de porta (abrir ou correr)? */
export function isDoor(partKind: PartKind): boolean {
  return partKind === "porta";
}

/** É parte de uma gaveta? */
export function isDrawerPart(partKind: PartKind): boolean {
  return DRAWER_PART_KINDS.has(partKind);
}

/**
 * Classificação fina de uma frente. Separa os seis casos que antes
 * colapsavam em `porta`.
 */
export type FrontClass =
  | "porta-abrir"
  | "porta-correr"
  | "gaveta-frente"
  | "painel-fixo"
  | "tapa-vao"
  | "aba-canto";

export function classifyFront(
  piece: Pick<ConstructionPiece, "partKind" | "frontRole">,
  motion?: ConstructionMotion,
): FrontClass | null {
  if (piece.partKind === "gaveta-frente") return "gaveta-frente";

  if (piece.partKind === "porta") {
    return motion?.kind === "slide" ? "porta-correr" : "porta-abrir";
  }

  if (isFixedFront(piece.partKind)) {
    const role: FrontRole =
      piece.frontRole ?? (piece.partKind === "tapa-vao" ? "tapa-vao" : "painel-fixo");
    return role === "aba-canto" ? "aba-canto" : role === "tapa-vao" ? "tapa-vao" : "painel-fixo";
  }

  return null;
}

/** Uma peça fixa nunca deve carregar rig — usado por validações e diagnóstico. */
export function shouldHaveRig(piece: Pick<ConstructionPiece, "partKind">): boolean {
  return !isFixedFront(piece.partKind) && !isFinishPart(piece.partKind);
}