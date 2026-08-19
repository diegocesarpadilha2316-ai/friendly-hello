export type ManufacturingSourceType = "manufacturer-documentation";

export type ManufacturingProvenance = {
  id?: string;
  sourceType: ManufacturingSourceType;
  sourceTitle: string;
  manufacturer?: string;
  documentRevision?: string;
  sourceReference: string;
  verifiedAt: string;
  notes?: string;
};

export type ManufacturingReference =
  | "HINGE_EDGE"
  | "DOOR_BOTTOM"
  | "DOOR_TOP"
  | "PART_CENTER"
  | "FRONT_EDGE"
  | "CABINET_FRONT_EDGE";

export type FastenerSpec = {
  screwDiameterMm: number;
  screwLengthMm: number;
  provenance: ManufacturingProvenance;
};

export type HingeCupSpec = {
  cupDiameterMm: number;
  cupDepthMm: number;
  boringDistanceRangeMm: { min: number; max: number };
  edgeReference: ManufacturingReference;
};

export type MountingPlateSpec = {
  kind: "mounting-plate";
  pattern: "cruciform-37-32";
  /** Distância entre os furos da placa; não é o spacing do sistema. */
  holeSpacingMm: 32;
  /** Distância do sistema da placa, documentada como spacing 0. */
  plateSystemDistanceMm: 0;
  plateReferenceFromFrontEdgeMm: 37;
  heightMm: 8.5;
  fastener: FastenerSpec;
  pilotHole?: {
    pilotHoleDiameterMm: number;
    pilotHoleDepthMm: number;
    provenance: ManufacturingProvenance;
  };
  provenance: ManufacturingProvenance;
};

export type HingeManufacturingSpec = {
  kind: "hinge";
  cup: HingeCupSpec;
  provenance: ManufacturingProvenance;
};

export type RunnerDrawerDimensionRules = {
  internalDrawerWidthFormula: "LW - 42 mm";
  internalDrawerWidthToleranceMm: { min: -1.5; max: 0 };
  drawerLengthFormula: "NL - 10 mm";
  sidePanelMaximumThicknessMm: 16;
  recessHeightMm: { min: 12; max: 15 };
  recessDepthMaximumMm: 15;
};

export type RunnerAttachmentSpec = {
  drillingTemplateId: "T65.1000.02";
  chipboardScrew: { diameterMm: 3.5; lengthMm: 15; manufacturerCode: "609.1500" };
  systemScrew: { diameterMm: 6; lengthMm: 14.5; manufacturerCode: "661.1450.HG" };
  optionalStabilityFixing: boolean;
};

export type RunnerManufacturingSpec = {
  kind: "runner";
  family: "MOVENTO";
  variant: "760H";
  dynamicCarryingCapacityKg: 40;
  nominalLengthMm: number;
  supportedNominalLengthsMm: number[];
  drawerDimensionRules: RunnerDrawerDimensionRules;
  attachment: RunnerAttachmentSpec;
  provenance: ManufacturingProvenance;
};

export type RunnerManufacturingVariant = {
  id: string;
  hardwareId: string;
  manufacturer: "Blum";
  model: "MOVENTO 760H";
  manufacturerCode?: string;
  revision: string;
  source: ManufacturingProvenance;
  manufacturingSpec: RunnerManufacturingSpec;
};

export type HardwareManufacturingVariant = {
  id: string;
  hardwareId: string;
  manufacturer: string;
  model: string;
  manufacturerCode: string;
  revision?: string;
  source: ManufacturingProvenance;
  manufacturingSpec: HingeManufacturingSpec;
  compatibleMountingPlateVariantIds: string[];
};

export type MountingPlateManufacturingVariant = {
  id: string;
  hardwareId: string;
  manufacturer: string;
  model: string;
  manufacturerCode: string;
  revision?: string;
  source: ManufacturingProvenance;
  manufacturingSpec: MountingPlateSpec;
  compatibleHardwareVariantIds: string[];
};

import type { StructuralConnectorManufacturingSpec } from "./StructuralJoinery";

export type StructuralConnectorManufacturingVariant = {
  id: string;
  hardwareId: string;
  manufacturer: string;
  model: string;
  manufacturerCode?: string;
  revision?: string;
  source: ManufacturingProvenance;
  manufacturingSpec: StructuralConnectorManufacturingSpec;
};

export type AnyHardwareManufacturingVariant =
  | HardwareManufacturingVariant
  | MountingPlateManufacturingVariant
  | RunnerManufacturingVariant
  | StructuralConnectorManufacturingVariant;
