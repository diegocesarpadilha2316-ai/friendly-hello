/**
 * Inteligência de Composição do Ambiente — contratos.
 * Camada aditiva e pura: nenhum provider, store ou migration.
 */
import type { LayoutShape, LayoutWall } from "../services/layout";

export type CompositionStyle =
  "moderno" | "contemporaneo" | "minimalista" | "industrial" | "classico" | "luxo";

export type FinishLevel = "essencial" | "intermediario" | "premium";

/** Retangulo em mm no sistema do editor 2D (x/y = canto superior-esquerdo). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

/** Abertura projetada sobre uma parede do comodo. */
export interface OpeningInfo {
  role: "door" | "window";
  wall: LayoutWall;
  center: number;
  width: number;
  height: number;
}

/** Diagnostico de uma parede antes de compor. */
export interface WallInfo {
  wall: LayoutWall;
  length: number;
  freeLength: number;
  longestRun: number;
  hasDoor: boolean;
  hasWindow: boolean;
  naturalLight: number;
  allowsTall: boolean;
  load: number;
}

/** Leitura completa do ambiente feita ANTES de qualquer geracao. */
export interface RoomAnalysis {
  environment: string;
  style: CompositionStyle;
  finishLevel: FinishLevel;
  width: number;
  depth: number;
  areaM2: number;
  ratio: number;
  size: "compacto" | "medio" | "amplo";
  circulationMin: number;
  naturalLight: "baixa" | "media" | "alta";
  openings: OpeningInfo[];
  walls: Record<LayoutWall, WallInfo>;
  workWalls: LayoutWall[];
  shape: LayoutShape;
  notes: string[];
}

/** Peca ja composta (parede definida por regra de composicao). */
export interface ComposedPiece {
  description: string;
  count?: number;
  wall?: LayoutWall;
  width?: number;
  height?: number;
  depth?: number;
}

export interface CompositionResult {
  shape: LayoutShape;
  pieces: ComposedPiece[];
  notes: string[];
}

export type DecorRole = "ancora" | "iluminacao" | "verde" | "arte" | "objeto" | "conforto";

export interface DecorPlacement {
  catalogItemId: string;
  role: DecorRole;
  x: number;
  y: number;
  rotation?: number;
  reason: string;
}

export interface QualityIssue {
  metric: "equilibrio" | "proporcao" | "circulacao" | "organizacao" | "coerencia";
  message: string;
  severity: "aviso" | "critico";
}

export interface QualityReport {
  score: number;
  balance: number;
  proportion: number;
  circulation: number;
  organization: number;
  coherence: number;
  issues: QualityIssue[];
  ok: boolean;
}
