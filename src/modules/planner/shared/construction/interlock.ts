/**
 * INTERTRAVAMENTO DE MECANISMOS — camada genérica da Biblioteca Construtiva.
 *
 * Um mecanismo interno (gaveta, cesto, sapateira, aramado) só pode se abrir
 * se o CAMINHO até a frente do móvel estiver desobstruído. Quem obstrui é
 * qualquer frente que cubra a mesma faixa de largura à frente dele: porta de
 * abrir, porta de correr, frente fixa ou painel.
 *
 * A regra é 100% geométrica e por instância — nada aqui conhece "roupeiro".
 * Qualquer família futura (cozinha, closet, banheiro, cristaleira) ganha o
 * intertravamento de graça, bastando declarar peças e rigs.
 *
 * Fluxo: estado das frentes → cobertura de cada faixa → dependências →
 * estado permitido de cada mecanismo → animação.
 */
import type { ConstructionMotion, ConstructionPiece } from "./types";
import type { PartKind } from "../engineering/types";
import { resolveMotion, type MotionState } from "./animation";

/** Ajustes do intertravamento. Valores em mm / graus. */
export interface InterlockConfig {
  /** Ângulo a partir do qual a porta de abrir libera o vão (75°–90°). */
  readonly safeAngleDeg: number;
  /** Sobreposição de largura tolerada antes de considerar o vão coberto. */
  readonly overlapToleranceMm: number;
  /** Tolerância de profundidade ao decidir quem está "à frente" de quem. */
  readonly depthToleranceMm: number;
  /** Abaixo disto o mecanismo é considerado recolhido. */
  readonly closedEpsilon: number;
}

export const DEFAULT_INTERLOCK: InterlockConfig = {
  safeAngleDeg: 80,
  overlapToleranceMm: 30,
  depthToleranceMm: 8,
  closedEpsilon: 0.02,
};

/**
 * Peças que funcionam como frente/tapamento do vão.
 * Inclui as frentes fixas: elas fecham o vão fisicamente, mas o bloqueio
 * que geram é sempre "frente-fixa" (permanente), nunca "abra a porta".
 */
const COVER_KINDS = new Set<PartKind>(["porta", "frente-fixa", "tapa-vao"]);

export interface InterlockBlock {
  /** Mecanismo bloqueado (grupo, ex.: "roupeiro:gaveta-2"). */
  readonly groupId: string;
  /** Frente responsável pelo bloqueio. */
  readonly byPieceId: string;
  readonly reason: "porta-fechada" | "porta-parcial" | "folha-cobrindo" | "frente-fixa";
  /** Mensagem curta e discreta para a interface. */
  readonly message: string;
}

export interface InterlockResult {
  /** Estado permitido (0→1) por peça, já pronto para a animação. */
  readonly allowed: Readonly<Record<string, MotionState>>;
  /** Mecanismos que foram impedidos de abrir agora. */
  readonly blocked: readonly InterlockBlock[];
  /** Frentes seguradas abertas até a gaveta recolher. */
  readonly holding: readonly string[];
}

export interface InterlockInput {
  readonly pieces: readonly ConstructionPiece[];
  readonly motions: readonly ConstructionMotion[];
  /** Estado desejado pelos comandos da interface (0→1) por peça. */
  readonly desired: Readonly<Record<string, MotionState>>;
  /** Estado real da animação neste instante. Ausente = igual ao desejado. */
  readonly current?: Readonly<Record<string, MotionState>>;
  readonly config?: Partial<InterlockConfig>;
}

type Span = readonly [number, number];

/** Agrupa peças do mesmo mecanismo (uma gaveta = frente + laterais + fundo). */
export function mechanismGroupId(pieceId: string): string {
  const parts = pieceId.split(":");
  return parts.length > 1 ? parts.slice(0, -1).join(":") : pieceId;
}

function overlap(a: Span, b: Span): number {
  return Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
}

function spanOf(p: ConstructionPiece): Span {
  return [p.box.x, p.box.x + p.box.width];
}

/**
 * Faixa de largura que uma frente ainda TAPA no estado informado.
 * `null` = liberou o vão.
 */
export function coverageSpan(
  piece: ConstructionPiece,
  motion: ConstructionMotion | undefined,
  state: MotionState,
  cfg: InterlockConfig,
): { span: Span; reason: InterlockBlock["reason"] } | null {
  const base = spanOf(piece);

  // Frente fixa: não existe estado aberto. Mesmo que algum componente
  // emita um rig por engano, ela nunca libera o vão.
  if (isFixedFront(piece.partKind)) return { span: base, reason: "frente-fixa" };

  // Frente sem mecanismo (painel fixo, frente colada): tapa sempre.
  if (!motion || motion.kind === "static") return { span: base, reason: "frente-fixa" };

  if (motion.kind === "slide") {
    // A folha some da coluna à medida que corre: a faixa acompanha o curso.
    const t = resolveMotion(motion, state).translate;
    return { span: [base[0] + t[0], base[1] + t[0]], reason: "folha-cobrindo" };
  }

  // Dobradiça / basculante / pivotante: só libera no ângulo seguro.
  const angle = Math.abs(resolveMotion(motion, state).rotateDeg.reduce((a, b) => a + b, 0));
  if (angle >= cfg.safeAngleDeg) return null;
  return { span: base, reason: angle <= 1 ? "porta-fechada" : "porta-parcial" };
}

/** Um mecanismo é "interno" quando sai para a frente do móvel (eixo Z, +). */
function isRetractable(motion: ConstructionMotion): boolean {
  return motion.kind === "slide" && motion.axis === "z" && motion.direction > 0;
}

/** A peça `cover` está à frente da peça `inner`? */
function inFrontOf(cover: ConstructionPiece, inner: ConstructionPiece, cfg: InterlockConfig): boolean {
  const coverFront = cover.box.z + cover.box.depth;
  const innerFront = inner.box.z + inner.box.depth;
  return coverFront > innerFront - cfg.depthToleranceMm;
}

/**
 * Resolve o estado permitido de todos os mecanismos.
 *
 * Comportamento ao FECHAR (escolha deliberada): nunca travamos o comando do
 * usuário. Se a gaveta está aberta e a porta recebe ordem de fechar, a gaveta
 * é recolhida primeiro e a porta fica segura aberta até a gaveta chegar ao
 * fim — sem colisão e sem o usuário ficar preso num estado impossível.
 */
export function resolveInterlock(input: InterlockInput): InterlockResult {
  const cfg = { ...DEFAULT_INTERLOCK, ...input.config };
  const { pieces, desired } = input;
  const current = input.current ?? desired;

  const motionByPiece = new Map<string, ConstructionMotion>();
  for (const m of input.motions) motionByPiece.set(m.pieceId, m);

  const at = (src: Readonly<Record<string, MotionState>>, id: string) => src[id] ?? 0;

  const covers = pieces.filter((p) => COVER_KINDS.has(p.partKind));
  const inners = pieces.filter((p) => {
    const m = motionByPiece.get(p.id);
    return !!m && isRetractable(m) && !COVER_KINDS.has(p.partKind);
  });

  /* 1. Estado permitido de cada mecanismo interno, por grupo e por faixa. */
  const blockedGroups = new Map<string, InterlockBlock>();
  const groupCovers = new Map<string, Set<string>>();

  for (const inner of inners) {
    const group = mechanismGroupId(inner.id);
    const innerSpan = spanOf(inner);
    for (const cover of covers) {
      if (!inFrontOf(cover, inner, cfg)) continue;
      const cSpan = spanOf(cover);
      // A folha só é "candidata" a bloquear se cruzar a faixa quando fechada.
      if (overlap(cSpan, innerSpan) <= cfg.overlapToleranceMm) continue;
      if (!groupCovers.has(group)) groupCovers.set(group, new Set());
      groupCovers.get(group)!.add(cover.id);

      const cov = coverageSpan(cover, motionByPiece.get(cover.id), at(current, cover.id), cfg);
      if (!cov) continue;
      if (overlap(cov.span, innerSpan) <= cfg.overlapToleranceMm) continue;
      if (!blockedGroups.has(group)) {
        blockedGroups.set(group, {
          groupId: group,
          byPieceId: cover.id,
          reason: cov.reason,
          message:
            cov.reason === "frente-fixa"
              ? "Este vão é fechado por uma frente fixa."
              : "Abra a porta desta coluna para usar a gaveta.",
        });
      }
    }
  }

  const allowed: Record<string, MotionState> = {};
  for (const p of pieces) allowed[p.id] = at(desired, p.id);

  const blocked: InterlockBlock[] = [];
  for (const inner of inners) {
    const group = mechanismGroupId(inner.id);
    const block = blockedGroups.get(group);
    if (!block) continue;
    allowed[inner.id] = 0;
    if (!blocked.some((b) => b.groupId === group)) blocked.push(block);
  }

  /* 2. Fechamento seguro: gaveta recolhe primeiro, porta espera. */
  const holding = new Set<string>();
  for (const inner of inners) {
    const group = mechanismGroupId(inner.id);
    const isOpenNow = at(current, inner.id) > cfg.closedEpsilon;
    if (!isOpenNow) continue;
    for (const coverId of groupCovers.get(group) ?? []) {
      const closing = at(desired, coverId) < at(current, coverId) - cfg.closedEpsilon;
      if (!closing) continue;
      // A porta segura a posição atual até a gaveta terminar de recolher.
      allowed[coverId] = at(current, coverId);
      allowed[inner.id] = 0;
      holding.add(coverId);
    }
  }

  return { allowed, blocked, holding: [...holding] };
}
