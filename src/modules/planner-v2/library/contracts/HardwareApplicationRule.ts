import type { ManufacturingProvenance } from "./HardwareManufacturingSpec";

export type ApplicationRuleProvenance = {
  id: string;
  sourceType: "family-rule";
  sourceTitle: string;
  sourceReference: string;
  verifiedAt: string;
  notes?: string;
};

export type ApplicationRuleStatus = "READY" | "INCOMPLETE" | "INVALID";
export type ApplicationType = "paired-full-overlay";

export type FurnitureAssemblyRule = {
  id: string;
  moduleDefinitionId: string;
  hardwareSlot: "hinge";
  mountingPlateSlot: "mountingPlate";
  hardwareVariantId: string;
  mountingPlateVariantId: string;
  applicationType: ApplicationType;
  hingeEdgeOffsetMm: number;
  verticalEdgeOffsetMm: number;
  threeHingeThresholdDoorHeightMm: number;
  constraints: {
    targetPartRoles: ["door", "side-left", "side-right"];
    requiresDoorThickness: boolean;
    requiresOverlayAndReveal: boolean;
    allowedBoringDistanceRangeMm: { min: number; max: number };
  };
  provenance: ApplicationRuleProvenance;
};

export type ResolvedDoorInstallation = {
  doorPartId: string;
  hingeSide: "left" | "right";
  targetSidePartId?: string;
  hingeCount: number;
  /** DOOR-LOCAL: offsets verticais desde a base da porta. */
  verticalOffsetsMm: number[];
  /** MODULE-LOCAL: posições Y absolutas no sistema local do módulo. */
  hingePositionsMm: number[];
  hingePartIds: string[];
  mountingPlatePartIds: string[];
};

export type ResolvedHardwareApplication = {
  id: string;
  ruleId: string;
  instanceId: string;
  moduleDefinitionId: string;
  hardwareSlot: "hinge";
  hardwareVariantId?: string;
  mountingPlateVariantId?: string;
  applicationType?: ApplicationType;
  applicationStatus: ApplicationRuleStatus;
  compatibilityStatus: "READY" | "INCOMPLETE" | "INVALID";
  assemblyStatus: "READY" | "INCOMPLETE" | "INVALID";
  machiningStatus: "READY" | "INCOMPLETE";
  missingParameters: string[];
  diagnostics: string[];
  parameters: {
    cabinetWidthMm: number;
    cabinetSideThicknessMm?: number;
    doorThicknessMm?: number;
    doorGapMm?: number;
    centralGapMm?: number;
    outerGapsMm?: { left: number; right: number };
    overlayMm?: number;
    revealMm?: number;
    selectedBoringDistanceMm?: number;
    boringDistanceRangeMm?: { min: number; max: number };
  };
  derivedValues: {
    doorWidthMm: number[];
    doorHeightMm: number[];
    hingeCountByDoor: number[];
    /** DOOR-LOCAL: offsets relativos à base de cada porta. */
    verticalHingeOffsetsMm: number[][];
    /** MODULE-LOCAL: posições Y resolvidas no módulo. */
    verticalHingePositionsMm: number[][];
    hingeEdgeOffsetMm?: number;
  };
  doorInstallations: ResolvedDoorInstallation[];
  applicationRuleProvenance: ApplicationRuleProvenance;
  manufacturerProvenance?: ManufacturingProvenance;
};
