import type { FamilyId } from "./FamilyDefinition";
import type { PartDefinition } from "./PartDefinition";
import type { PlacementRules } from "./PlacementRules";

export interface Dimensions3 {
  width: number;
  height: number;
  depth: number;
}

export interface BuildModuleInput {
  instanceId: string;
  dimensionsMm: Dimensions3;
  materialId: string;
  materialOverrides?: Record<string, string>;
  hardwareOverrides?: Record<string, string>;
}

export interface ModuleBuildResult {
  parts: PartDefinition[];
  boundingBoxMm: Dimensions3;
  hardwareIds: string[];
  warnings: string[];
}

export interface ModuleDefinition {
  id: string;
  familyId: FamilyId;
  category: string;
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
  build: (input: BuildModuleInput) => ModuleBuildResult;
}
