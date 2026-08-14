/**
 * BIBLIOTECA PARAMÉTRICA DE MÓDULOS INTERNOS — contratos.
 *
 * Esta camada NÃO cria geometria própria: todo módulo é apenas uma receita
 * paramétrica que resolve para componentes já existentes da Biblioteca
 * Construtiva (`../construction`). Nada aqui renderiza, toca material,
 * iluminação, UI, vídeo ou banco de dados.
 *
 * Unidade canônica: milímetro. Eixos idênticos aos da Biblioteca Construtiva
 * (X largura, Y altura, Z profundidade; origem no canto inferior-esquerdo-traseiro).
 */
import type {
  ConstructionBox,
  ConstructionComponentId,
  ConstructionContext,
} from "../construction";

/** Categoria funcional do módulo (usada por filtros e pela UI futura). */
export type InteriorCategory =
  "armazenagem" | "organizacao" | "penduracao" | "estrutura" | "especial";

/** Natureza construtiva do módulo. */
export type InteriorType =
  "prateleira" | "divisoria" | "gaveta" | "cesto" | "barra" | "acessorio" | "caixa" | "nicho";

/** Onde o módulo precisa estar ancorado dentro do vão. */
export type InteriorAnchor = "base" | "topo" | "livre" | "esquerda" | "direita";

/** Famílias de móvel atendidas. Aberto para novas famílias. */
export type InteriorFamilyId =
  | "roupeiro"
  | "closet"
  | "cozinha"
  | "banheiro"
  | "lavanderia"
  | "escritorio"
  | "home-office"
  | "painel"
  | "cristaleira";

export interface InteriorDims {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
}

export interface InteriorClearances {
  /** Folga em cada lateral do vão (mm). */
  readonly sideMm: number;
  /** Recuo em relação à frente do móvel (mm). */
  readonly frontMm: number;
  /** Folga acima do módulo para uso/manuseio (mm). */
  readonly verticalMm: number;
}

/** Vão livre onde os módulos serão inseridos. */
export interface InteriorCavity {
  readonly id: string;
  readonly label?: string;
  /** Origem do vão no espaço do móvel (mm). */
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
}

/** Regra construtiva do módulo. Pura e determinística. */
export interface InteriorRule {
  readonly code: string;
  readonly level: "error" | "warn";
  readonly message: string;
  /** `true` = regra atendida. */
  readonly check: (fit: ConstructionBox, cavity: InteriorCavity) => boolean;
}

/**
 * Peça-receita: mapeia o módulo em UM componente da Biblioteca Construtiva.
 * `at` é relativo ao canto do módulo já posicionado.
 */
export interface InteriorPart {
  readonly key: string;
  readonly component: ConstructionComponentId;
  readonly at?: (fit: ConstructionBox) => readonly [number, number, number];
  readonly params: (fit: ConstructionBox, def: InteriorModuleDef) => Record<string, unknown>;
}

/** Definição completa de um módulo interno. */
export interface InteriorModuleDef {
  readonly id: string;
  readonly name: string;
  readonly category: InteriorCategory;
  readonly type: InteriorType;
  readonly min: InteriorDims;
  readonly max: InteriorDims;
  readonly preferred: InteriorDims;
  readonly clearances: InteriorClearances;
  readonly thicknessMm: number;
  readonly anchor: InteriorAnchor;
  readonly rules: readonly InteriorRule[];
  /** Limitações duras do módulo. */
  readonly limits: {
    /** Máximo de instâncias no mesmo vão (0 = sem limite). */
    readonly maxPerCavity: number;
    /** Exige fundo/costa para fixação. */
    readonly requiresBack: boolean;
    /** Pode ser inclinado (sapateira, adega). */
    readonly tiltable: boolean;
  };
  /** Módulos que não podem ocupar o mesmo vão. */
  readonly incompatibleWith: readonly string[];
  readonly families: readonly InteriorFamilyId[];
  /** Receita: componentes construtivos que o módulo instancia. */
  readonly parts: readonly InteriorPart[];
}

/** Módulo posicionado dentro de um vão. */
export interface InteriorPlacement {
  readonly id: string;
  readonly moduleId: string;
  readonly box: ConstructionBox;
  readonly role?: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly origin: "auto" | "manual";
}

/** Projeto interno completo de um vão. */
export interface InteriorPlan {
  readonly id: string;
  readonly cavity: InteriorCavity;
  readonly placements: readonly InteriorPlacement[];
  readonly context?: Partial<Omit<ConstructionContext, "instanceId">>;
}

export interface InteriorIssue {
  readonly level: "error" | "warn";
  readonly code: string;
  readonly message: string;
  readonly placementId?: string;
}

export interface InteriorValidation {
  readonly ok: boolean;
  readonly errors: readonly InteriorIssue[];
  readonly warnings: readonly InteriorIssue[];
}

/** Formas de inserção suportadas. */
export type InteriorPosition =
  | { readonly kind: "coluna"; readonly index: number; readonly of: number }
  | { readonly kind: "linha"; readonly index: number; readonly of: number }
  | { readonly kind: "nicho"; readonly nicheId: string }
  | { readonly kind: "vao"; readonly fromYMm: number; readonly toYMm: number }
  | {
      readonly kind: "coordenada";
      readonly at: readonly [number, number, number];
      readonly size?: Partial<InteriorDims>;
    };
