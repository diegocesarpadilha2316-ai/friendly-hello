import type { JoineryFace } from "./JoineryDefinition";
import type { ManufacturingProvenance } from "./HardwareManufacturingSpec";
import type { ResolvedCarcass, ResolvedCarcassPanel } from "./CarcassConstructionRule";

export type StructuralJointRelation =
  | "side-left-to-base"
  | "side-right-to-base"
  | "side-left-to-top"
  | "side-right-to-top";

export type StructuralJointStrategy = "eccentric-cam-panel-connector";
export type StructuralPlacementPolicy = "symmetric-pair";
export type StructuralQuantityPolicy = "front-rear-pair";
export type StructuralAssemblyPolicy = "detachable";
export type StructuralMachiningPolicy = "manufacturer-data-only";

export type StructuralConnectorManufacturingSpec = {
  kind: "structural-connector";
  family: "MINIFIX";
  housingDiameterMm: 15;
  housingDepthMm: 12.5;
  housingDepthToleranceMm: 0.5;
  minimumPanelThicknessMm: 16;
  housingReferenceFromEdgeMm: 8;
  connectingBoltDrillingDistanceMm: 24 | 34;
  connectingBoltThreadLengthMm: 15 | 11 | 8;
  connectingBoltHoleDiameterMm?: number;
  connectingBoltHoleDepthMm?: number;
  countersink?: {
    diameterMm?: number;
    depthMm?: number;
  };
  tool?: string;
  provenance: ManufacturingProvenance;
};

export type StructuralJoineryRule = {
  id: string;
  moduleDefinitionId: string;
  connectorHardwareId: string;
  manufacturingVariantId: string;
  jointStrategy: StructuralJointStrategy;
  eligibleRelations: StructuralJointRelation[];
  placementPolicy: StructuralPlacementPolicy;
  quantityPolicy: StructuralQuantityPolicy;
  assemblyPolicy: StructuralAssemblyPolicy;
  machiningPolicy: StructuralMachiningPolicy;
  connectorSpec: StructuralConnectorManufacturingSpec;
  placement: {
    frontOffsetFromRearMm: number;
    rearOffsetFromFrontMm: number;
    minimumClearSpanMm: number;
  };
  provenance: ManufacturingProvenance;
};

export type StructuralJointStatus = "READY" | "INCOMPLETE" | "INVALID";

export type ResolvedStructuralJoint = {
  id: string;
  relationId: StructuralJointRelation;
  relationOccurrence: 1 | 2;
  instanceId: string;
  moduleDefinitionId: string;
  ruleId: string;
  connectorHardwareId: string;
  manufacturingVariantId: string;
  hostPartId: string;
  targetPartId: string;
  hostFace: JoineryFace;
  targetFace: JoineryFace;
  jointAxis: "X" | "Y" | "Z";
  positionMm: { x: number; y: number; z: number };
  positionSemantics: "manufacturer-pattern" | "family-application-rule";
  quantityIndex: number;
  assemblyStatus: "READY" | "INCOMPLETE" | "INVALID";
  machiningStatus: StructuralJointStatus;
  unknownParameters: string[];
  diagnostics: string[];
  provenance: {
    manufacturer: ManufacturingProvenance;
    applicationRule: ManufacturingProvenance;
  };
};

export type StructuralJoineryResolution = {
  status: "READY" | "INCOMPLETE" | "INVALID";
  joints: ResolvedStructuralJoint[];
  diagnostics: string[];
  carcassId: string;
  ruleId?: string;
};

export type StructuralJoineryResolverInput = {
  instanceId: string;
  moduleDefinitionId: string;
  resolvedCarcass: ResolvedCarcass;
  rule: StructuralJoineryRule;
  connectorSpec: StructuralConnectorManufacturingSpec;
  parts: readonly ResolvedCarcassPanel[];
};
