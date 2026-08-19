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

export type AnyHardwareManufacturingVariant =
  | HardwareManufacturingVariant
  | MountingPlateManufacturingVariant;
