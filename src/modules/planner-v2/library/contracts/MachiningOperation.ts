import type { JoineryDefinition, JoineryFace } from "./JoineryDefinition";
import type { ManufacturingProvenance } from "./HardwareManufacturingSpec";

export type MachiningOperationType = "drilling" | "boring" | "countersink" | "groove" | "profile";

export type MachiningReadinessStatus = "READY" | "INCOMPLETE" | "NOT_REQUIRED";

export type ManufacturingClassification =
  | "ASSEMBLY"
  | "MACHINING"
  | "PURCHASED_HARDWARE"
  | "PROFILE";

export type PartLocalOrigin = {
  kind: "part-center";
  partId: string;
};

export type PartLocalCoordinates = {
  coordinateSpace: "part-local";
  origin: PartLocalOrigin;
  face: JoineryFace;
  positionMm: { x: number; y: number; z: number };
};

export interface MachiningOperation {
  id: string;
  type: MachiningOperationType;
  instanceId: string;
  partId: string;
  hardwareId?: string;
  hardwareVariantId?: string;
  sourceJoineryId?: string;
  relatedPartIds: string[];
  coordinates: PartLocalCoordinates;
  diameterMm?: number;
  depthMm?: number;
  widthMm?: number;
  lengthMm?: number;
  angleDeg?: number;
  toolHint?: string;
  parameters: Record<string, string | number | boolean | null>;
  readiness: MachiningReadinessStatus;
  missingParameters: string[];
  provenance?: ManufacturingProvenance;
}

export interface AssemblyReadiness {
  id: string;
  instanceId: string;
  hardwareId?: string;
  hardwareVariantId?: string;
  relatedPartIds: string[];
  status: "READY" | "INCOMPLETE";
  missingParameters: string[];
  provenance?: ManufacturingProvenance;
  reason: string;
}

export interface MachiningReadiness {
  operationId: string;
  instanceId: string;
  partId: string;
  hardwareId?: string;
  hardwareVariantId?: string;
  type: MachiningOperationType;
  status: MachiningReadinessStatus;
  missingParameters: string[];
  reasons: string[];
}

export interface ManufacturingClassificationRecord {
  id: string;
  instanceId: string;
  partId: string;
  hardwareId?: string;
  sourceJoineryId?: string;
  classification: ManufacturingClassification;
  relatedPartIds: string[];
  reason: string;
}

export type MachiningReport = {
  operations: MachiningOperation[];
  readiness: MachiningReadiness[];
  assemblyReadiness: AssemblyReadiness[];
  classifications: ManufacturingClassificationRecord[];
  system32: "IMPLEMENTED" | "NOT_REQUIRED" | "NOT_ENOUGH_DATA";
  warnings: string[];
};

export type JoinerySourceOperation = Pick<
  JoineryDefinition,
  "id" | "kind" | "moduleInstanceId" | "partId" | "hardwareId" | "face" | "relatedPartIds" | "parameters"
> & {
  positionMm: { x: number; y: number };
};
