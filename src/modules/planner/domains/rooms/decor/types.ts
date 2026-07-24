/**
 * Fase 3.8 — IA Decoradora: tipos.
 *
 * Descreve estilos, sugestões, planos de decoração, iluminação e paletas
 * de materiais. Todos os itens gerados aplicam-se ao MESMO grafo
 * paramétrico (`PlannerRoom.nodes`) via `updateProject`. Nenhum novo
 * motor/store/DB.
 */
import type { PlannerRoomType } from "@/modules/planner/shared/types/project";

export type DecorStyleId =
  | "moderno"
  | "contemporaneo"
  | "minimalista"
  | "industrial"
  | "escandinavo"
  | "classico"
  | "luxo"
  | "japandi"
  | "boho"
  | "rustico"
  | "corporativo"
  | "infantil";

export type DecorLightTemperature = "quente" | "neutra" | "fria";
export type DecorLightRole = "ambiente" | "tarefa" | "destaque" | "decorativa";
export type DecorLightKind =
  | "led"
  | "spot"
  | "fita_led"
  | "pendente"
  | "perfil_led"
  | "abajur"
  | "arandela"
  | "plafon";

export type DecorItemKind =
  | "sofa"
  | "poltrona"
  | "cadeira"
  | "mesa"
  | "tapete"
  | "quadro"
  | "espelho"
  | "vaso"
  | "planta"
  | "luminaria"
  | "pendente"
  | "abajur"
  | "cortina"
  | "persiana"
  | "eletrodomestico"
  | "objeto_decorativo"
  | "livro"
  | "utensilio";

export type DecorMaterialFamily =
  | "madeira"
  | "pedra"
  | "porcelanato"
  | "marmore"
  | "granito"
  | "metal"
  | "vidro"
  | "tecido"
  | "cor"
  | "combinacao";

/** Estilo decorativo — paleta, materiais, iluminação e afinidades. */
export interface DecorStyle {
  id: DecorStyleId;
  name: string;
  description: string;
  /** Paleta principal (hex). */
  palette: readonly string[];
  /** Materiais preferidos (livre). */
  materials: readonly string[];
  /** Temperatura de luz dominante. */
  lightTemperature: DecorLightTemperature;
  /** Ambientes onde combina bem. */
  suitedFor: readonly PlannerRoomType[];
  tags: readonly string[];
}

export interface DecorItemDefaults {
  width: number;
  depth: number;
  height: number;
}

/** Item decorativo — template paramétrico independente da Biblioteca. */
export interface DecorItem {
  id: string;
  name: string;
  kind: DecorItemKind;
  description: string;
  defaults: DecorItemDefaults;
  /** Afinidade de estilo — quanto maior, mais provável a IA sugerir. */
  styles: readonly DecorStyleId[];
  /** Papel funcional/estético (auxilia a heurística). */
  role: "principal" | "apoio" | "decoracao" | "textil" | "verde" | "luminaria" | "eletro";
  color?: string;
  material?: string;
  tags: readonly string[];
}

/** Cena de iluminação — conjunto pré-definido de luminárias. */
export interface DecorLightingScene {
  id: string;
  name: string;
  description: string;
  /** Lista de emissores com temperatura e função. */
  emitters: readonly {
    kind: DecorLightKind;
    role: DecorLightRole;
    temperature: DecorLightTemperature;
    wattage?: number;
    color?: string;
  }[];
  styles: readonly DecorStyleId[];
  suitedFor: readonly PlannerRoomType[];
}

/** Amostra de material sugerida pela IA (não gera nó no projeto). */
export interface DecorMaterialSample {
  id: string;
  family: DecorMaterialFamily;
  name: string;
  description: string;
  color: string;
  tags: readonly string[];
  styles: readonly DecorStyleId[];
}

export type DecorSuggestionStatus = "pending" | "accepted" | "rejected";

/** Sugestão individual — o usuário aceita ou rejeita. */
export interface DecorSuggestion {
  id: string;
  /** Tipo de sugestão. */
  target: "item" | "lighting" | "material" | "palette";
  title: string;
  reason: string;
  score: number;
  status: DecorSuggestionStatus;
  /** Payload conforme `target`. */
  itemId?: string;
  lightingSceneId?: string;
  materialId?: string;
  paletteHex?: readonly string[];
  /** Posição sugerida no cômodo (mm). */
  at?: { x: number; y: number };
  rotation?: number;
  overrides?: Partial<DecorItemDefaults>;
}

/** Contexto de análise do ambiente — insumo do motor de regras. */
export interface DecorContext {
  roomType: PlannerRoomType;
  areaM2: number;
  perimeterMm: number;
  hasWalls: boolean;
  hasDoors: boolean;
  hasWindows: boolean;
  existingFurnitureCount: number;
  existingLightingCount: number;
  existingPalette: readonly string[];
  /** Circulação estimada (mm) — distância livre média. */
  circulationMm: number;
}

export interface DecorPlan {
  id: string;
  styleId: DecorStyleId;
  context: DecorContext;
  suggestions: DecorSuggestion[];
  createdAt: string;
  provider: string;
}

export type DecorSessionStatus =
  | "idle"
  | "analyzing"
  | "review"
  | "partial"
  | "applied"
  | "error";

export interface DecorSession {
  id: string;
  status: DecorSessionStatus;
  styleId: DecorStyleId;
  providerId: string;
  plan: DecorPlan | null;
  /** Snapshot dos ids de nós existentes antes de aplicar — usado para "antes × depois". */
  beforeNodeIds: readonly string[];
  /** Ids de nós inseridos por sugestões aceitas. */
  appliedNodeIds: readonly string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}