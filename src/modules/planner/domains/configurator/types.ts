/**
 * Fase 3.16 — Tipos públicos do Configurador Paramétrico.
 *
 * Todos os tipos são "read-derived": nunca criam banco, provider ou store.
 * Toda mutação retorna um PlannerProject atualizado que deve ser aplicado
 * via updateProject() do PlannerEditorProvider.
 */
import type { PlannerParametricNode, PlannerProject } from "@/modules/planner/shared";

export type ConfiguratorField =
  | {
      key: string;
      label: string;
      kind: "number";
      value: number;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
      group: ConfiguratorGroup;
      hint?: string;
    }
  | {
      key: string;
      label: string;
      kind: "boolean";
      value: boolean;
      group: ConfiguratorGroup;
      hint?: string;
    }
  | {
      key: string;
      label: string;
      kind: "select";
      value: string;
      options: readonly string[];
      group: ConfiguratorGroup;
      hint?: string;
    }
  | {
      key: string;
      label: string;
      kind: "text";
      value: string;
      group: ConfiguratorGroup;
      hint?: string;
    };

export type ConfiguratorGroup =
  | "medidas"
  | "estrutura"
  | "portas"
  | "gavetas"
  | "nichos"
  | "ferragens"
  | "iluminacao"
  | "material"
  | "acabamento";

export interface ConfiguratorSchema {
  nodeId: string;
  label: string;
  fields: readonly ConfiguratorField[];
}

/** Comando determinístico pt-BR reconhecido pelo Configurador/Chat IA. */
export interface ConfiguratorCommand {
  id: string;
  matched: string;
  intent:
    | "resize"
    | "material"
    | "color"
    | "doors.count"
    | "drawers.count"
    | "shelves.count"
    | "dividers.count"
    | "niches.count"
    | "hardware.brand"
    | "open.doors"
    | "close.doors"
    | "open.drawers"
    | "close.drawers"
    | "open.all"
    | "close.all"
    | "open.percent"
    | "add.led"
    | "add.mirror"
    | "add.glass"
    | "slatted";
  args: Readonly<Record<string, string | number | boolean>>;
  summary: string;
}

export type ConfiguratorLayerId =
  | "estrutura"
  | "portas"
  | "gavetas"
  | "ferragens"
  | "vidros"
  | "espelhos"
  | "led"
  | "decoracao"
  | "producao";

export interface ConfiguratorLayer {
  id: ConfiguratorLayerId;
  label: string;
  color: string;
  description: string;
}

export type WalkMode = "orbit" | "free" | "walk" | "fps";
export interface WalkModeSpec {
  id: WalkMode;
  label: string;
  description: string;
  collision: boolean;
  gravity: boolean;
  fov: number;
  speedMmPerSec: number;
}

export type SnapTargetKind =
  "paredes" | "moveis" | "eixos" | "centro" | "quinas" | "divisorias" | "portas" | "gavetas";

export interface SnapTarget {
  id: string;
  kind: SnapTargetKind;
  label: string;
  enabled: boolean;
  toleranceMm: number;
}

export interface AlignAction {
  id:
    "left" | "right" | "center-h" | "top" | "bottom" | "center-v" | "distribute-h" | "distribute-v";
  label: string;
  description: string;
}

export interface HistoryEntry {
  id: string;
  version: number;
  author: string;
  when: string;
  summary: string;
  changes: readonly { field: string; before: string; after: string }[];
}

export interface AiProviderStub {
  id: "openai" | "gemini" | "claude" | "mistral" | "oss";
  label: string;
  status: "ready" | "coming-soon";
  models: readonly string[];
  capabilities: readonly ("chat" | "vision" | "tools" | "structured")[];
}

/** Snapshot leve para painéis (não muta nada). */
export interface ConfiguratorSnapshot {
  selection: readonly PlannerParametricNode[];
  modules: readonly PlannerParametricNode[];
  schema: ConfiguratorSchema | null;
  layers: readonly (ConfiguratorLayer & { count: number; visible: boolean; locked: boolean })[];
  history: readonly HistoryEntry[];
  walk: readonly WalkModeSpec[];
  snapping: readonly SnapTarget[];
  align: readonly AlignAction[];
  providers: readonly AiProviderStub[];
  project: PlannerProject | null;
}
