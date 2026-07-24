/**
 * Fase 3.18 — Plano de Corte Enterprise (Nesting).
 * Contratos puros. Zero providers, stores, managers, migrations.
 * Toda persistência de mutações continua via `updateProject()`.
 */
export type NestingAlgorithm =
  | "best-fit"
  | "first-fit"
  | "guillotine"
  | "skyline"
  | "max-rects"
  | "bin-packing";

export type GrainMode = "respect" | "ignore";
export type RotationMode = "auto" | "locked";

export interface NestingBoardSpec {
  readonly id: string;
  readonly material: string;
  readonly brand: string;
  readonly color: string;
  readonly thicknessMm: number;
  readonly lengthMm: number;
  readonly widthMm: number;
  readonly supplier: string;
  readonly weightKg: number;
  readonly price: number;
  readonly grain: "horizontal" | "vertical" | "none";
}

export interface NestingPart {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly material: string;
  readonly color: string;
  readonly qty: number;
  readonly grain: "horizontal" | "vertical" | "none";
  readonly edgeTape?: string;
  readonly label?: string;
  readonly locked?: boolean;
  readonly pinned?: boolean;
}

export interface NestingPlacement {
  readonly partId: string;
  readonly code: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rotated: boolean;
  readonly grainRespected: boolean;
  readonly locked: boolean;
  readonly pinned: boolean;
}

export interface NestingBoard {
  readonly index: number;
  readonly spec: NestingBoardSpec;
  readonly placements: readonly NestingPlacement[];
  readonly usedM2: number;
  readonly wasteM2: number;
  readonly usageRatio: number;
  readonly weightKg: number;
  readonly offcuts: readonly NestingOffcut[];
}

export interface NestingOffcut {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly areaM2: number;
  readonly material: string;
  readonly thicknessMm: number;
  readonly color: string;
  readonly status: "available" | "reserved" | "used";
  readonly projectId?: string;
  readonly tenantId?: string;
}

export interface NestingOptions {
  readonly algorithm: NestingAlgorithm;
  readonly kerfMm: number;
  readonly rotation: RotationMode;
  readonly grainMode: GrainMode;
  readonly marginMm: number;
  readonly minOffcutMm: number;
}

export interface NestingStatistics {
  readonly boardsCount: number;
  readonly partsCount: number;
  readonly usedAreaM2: number;
  readonly wasteAreaM2: number;
  readonly offcutAreaM2: number;
  readonly totalWeightKg: number;
  readonly avgUsageRatio: number;
  readonly totalCost: number;
  readonly estimatedTimeMin: number;
}

export interface NestingPlan {
  readonly algorithm: NestingAlgorithm;
  readonly options: NestingOptions;
  readonly boards: readonly NestingBoard[];
  readonly unplaced: readonly NestingPart[];
  readonly statistics: NestingStatistics;
  readonly generatedAt: string;
}

export interface NestingComparison {
  readonly algorithm: NestingAlgorithm;
  readonly plan: NestingPlan;
  readonly savingsPercent: number;
  readonly savingsAreaM2: number;
  readonly deltaBoards: number;
}
