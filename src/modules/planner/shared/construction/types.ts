/**
 * BIBLIOTECA CONSTRUTIVA PARAMÉTRICA — contratos canônicos.
 *
 * Camada 100% pura e determinística: recebe parâmetros, devolve peças,
 * ferragens e rigs de animação. NÃO renderiza, não lê estado global,
 * não toca iluminação/PBR/UI. O Editor 3D e a Engenharia apenas CONSOMEM.
 *
 * UNIDADE CANÔNICA: milímetro (mm). Eixos locais do componente:
 *   X = largura (esquerda→direita), Y = altura (baixo→cima), Z = profundidade
 *   (fundo→frente). Origem = canto inferior-esquerdo-traseiro do envelope.
 */
import type { GrainDirection, HardwareKind, PartKind } from "../engineering/types";

/** Identificador de cada componente construtivo da biblioteca. */
export type ConstructionComponentId =
  | "porta-abrir"
  | "porta-correr"
  | "gaveta"
  | "frente-gaveta"
  | "prateleira"
  | "divisoria-vertical"
  | "cabideiro"
  | "maleiro"
  | "nicho"
  | "rodape"
  | "tampo"
  | "lateral"
  | "fundo"
  | "base"
  | "painel";

/** Famílias funcionais — usadas por filtros, regras e futuras famílias de móveis. */
export type ConstructionFamily =
  | "frente" // o que o usuário vê e toca
  | "estrutura" // caixa
  | "interno" // organização interna
  | "acessorio"; // ferragem funcional

/** Caixa orientada no espaço local do componente (mm). */
export interface ConstructionBox {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** Peça sólida produzida por um componente (chapa, frente, régua...). */
export interface ConstructionPiece {
  readonly id: string;
  /** Mapeia direto para a lista de corte existente (engineering/types). */
  readonly partKind: PartKind;
  readonly label: string;
  readonly box: ConstructionBox;
  readonly thicknessMm: number;
  readonly grain: GrainDirection;
  /** id do acabamento (MaterialFinish) quando o componente define. */
  readonly finishId?: string;
  /** Vidro/espelho não entram na lista de corte de chapa. */
  readonly substrate: "chapa" | "vidro" | "espelho" | "metal" | "perfil";
  readonly notes?: string;
}

/** Ferragem exigida pelo componente (dobradiça, corrediça, trilho...). */
export interface ConstructionHardwareRef {
  readonly id: string;
  readonly kind: HardwareKind;
  readonly qty: number;
  /** id preferencial no catálogo `engineering/hardware`, quando houver. */
  readonly itemId?: string;
  readonly notes?: string;
}

/** Eixo de movimento de um mecanismo. */
export type MotionAxis = "x" | "y" | "z";

/**
 * Rig de animação declarativo. Esta etapa NÃO anima nada — apenas descreve
 * o mecanismo para que a futura camada de animação leia e aplique.
 */
export interface ConstructionMotion {
  /** Peça (ConstructionPiece.id) que se move. */
  readonly pieceId: string;
  readonly kind: "hinge" | "slide" | "lift" | "fold" | "pivot" | "static";
  readonly axis: MotionAxis;
  /** Ponto de rotação no espaço local (mm). Ignorado em "slide". */
  readonly pivot?: readonly [number, number, number];
  /** Ângulo máximo em graus (hinge/lift/fold/pivot). */
  readonly maxAngleDeg?: number;
  /** Curso máximo em mm (slide). */
  readonly maxTravelMm?: number;
  /** Sentido positivo do movimento. */
  readonly direction: 1 | -1;
  /** Duração sugerida (ms) e easing — a camada de animação pode sobrescrever. */
  readonly durationMs: number;
  readonly easing: "linear" | "ease-out" | "soft-close";
}

/** Aviso construtivo (não bloqueia, orienta). */
export interface ConstructionWarning {
  readonly code: string;
  readonly message: string;
}

/** Saída canônica de QUALQUER componente da biblioteca. */
export interface ConstructionResult {
  readonly componentId: ConstructionComponentId;
  readonly instanceId: string;
  /** Envelope total ocupado pelo componente (mm). */
  readonly envelope: ConstructionBox;
  readonly pieces: readonly ConstructionPiece[];
  readonly hardware: readonly ConstructionHardwareRef[];
  readonly motions: readonly ConstructionMotion[];
  readonly warnings: readonly ConstructionWarning[];
}

/** Contexto herdado do móvel/projeto — o componente nunca vai buscar sozinho. */
export interface ConstructionContext {
  readonly instanceId: string;
  /** Espessura padrão de chapa (mm). */
  readonly thicknessMm: number;
  /** Espessura de fundo (mm). */
  readonly backThicknessMm: number;
  /** Folga construtiva padrão (mm). */
  readonly clearanceMm: number;
  /** Junta-sombra entre frentes (mm). */
  readonly revealMm: number;
  readonly finishId: string;
  readonly grain: GrainDirection;
  /** Origem do componente dentro do móvel (mm). */
  readonly origin?: readonly [number, number, number];
}

/**
 * Definição de um componente da biblioteca.
 * `TParams` é o dicionário próprio do componente (porta ≠ gaveta ≠ prateleira).
 */
export interface ConstructionComponent<TParams> {
  readonly id: ConstructionComponentId;
  readonly label: string;
  readonly family: ConstructionFamily;
  readonly description: string;
  /** Valores default — sempre completos, para permitir params parciais. */
  readonly defaults: TParams;
  /** Normaliza/limita parâmetros (nunca lança; corrige e avisa). */
  readonly normalize: (params: Partial<TParams>, ctx: ConstructionContext) => TParams;
  /** Resolve geometria, ferragens e mecanismos. Puro. */
  readonly build: (params: TParams, ctx: ConstructionContext) => ConstructionResult;
  /** Movimento nativo do componente (usado por filtros e pela UI futura). */
  readonly motionKind: ConstructionMotion["kind"];
}
