import type { FamilyId } from "./FamilyDefinition";
import type { PartDefinition } from "./PartDefinition";
import type { PlacementRules } from "./PlacementRules";

export interface Dimensions3 {
  width: number;
  height: number;
  depth: number;
}

export interface ThicknessProfileMm {
  panelMm?: number;
  doorMm?: number;
  shelfMm?: number;
  backMm?: number;
}

export interface BuildModuleInput {
  instanceId: string;
  dimensionsMm: Dimensions3;
  materialId: string;
  materialOverrides?: Record<string, string>;
  hardwareOverrides?: Record<string, string>;
  thicknessMm?: ThicknessProfileMm;
}

export interface ModuleBuildResult {
  parts: PartDefinition[];
  boundingBoxMm: Dimensions3;
  hardwareIds: string[];
  warnings: string[];
}

export type KitchenModuleKind =
  | "base"
  | "drawer"
  | "upper"
  | "tower"
  | "countertop"
  | "sink"
  | "cooktop"
  | "corner"
  | "island"
  | "peninsula"
  | "complement";

export interface ModuleDefinition {
  id: string;
  familyId: FamilyId;
  category: string;
  subcategory?: string;
  kind?: KitchenModuleKind;
  name: string;
  description?: string;
  defaultDimensionsMm: Dimensions3;
  minDimensionsMm: Dimensions3;
  maxDimensionsMm: Dimensions3;
  dimensionalRules: {
    widthStepMm?: number;
    heightStepMm?: number;
    depthStepMm?: number;
  };
  placementRules: PlacementRules;
  defaultMaterialId: string;
  allowedMaterialIds: string[];
  defaultHardwareIds: string[];
  technical?: {
    cutout?: { widthMm: number; depthMm: number; clearanceMm: number };
    appliance?: "oven" | "microwave" | "dishwasher" | "fridge";
    sinkClearance?: { widthMm: number; depthMm: number; plumbingZoneMm: number };
    countertop?: { thicknessMm: number; overhangMm: number };
  };
  build: (input: BuildModuleInput) => ModuleBuildResult;
}
