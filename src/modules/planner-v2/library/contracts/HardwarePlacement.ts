import type { FurnitureAssemblyRule } from "./HardwareApplicationRule";
import type { ResolvedFrontLayout } from "./FrontLayoutRule";

export type HardwarePlacementPoint = {
  x: number;
  y: number;
};

export type DoorHardwarePlacementInput = {
  frontLayout: ResolvedFrontLayout;
  applicationRule: FurnitureAssemblyRule;
  doorIndex: number;
  doorPartId: string;
  toeKickMm: number;
  cabinetDepthMm: number;
  doorThicknessMm: number;
  targetSidePartId?: string;
};

export type ResolvedDoorHardwarePlacement = {
  id: string;
  doorPartId: string;
  hingeSide: "left" | "right";
  targetSidePartId?: string;
  hingeCount: number;
  verticalOffsetsMm: number[];
  hingeEdgeOffsetMm: number;
  hingePositionsMm: HardwarePlacementPoint[];
  mountingPlatePositionsMm: HardwarePlacementPoint[];
  hingePartIds: string[];
  mountingPlatePartIds: string[];
  doorBottomMm: number;
  doorHeightMm: number;
  status: "READY" | "INVALID";
  diagnostics: string[];
};

export type HardwarePlacementConsistencyIssue = {
  partId: string;
  axis: "x" | "y";
  expectedMm: number;
  actualMm: number;
  deltaMm: number;
};

export type HardwarePlacementConsistency = {
  valid: boolean;
  toleranceMm: number;
  issues: HardwarePlacementConsistencyIssue[];
};

export type PlacementResolutionContext = {
  frontLayout: ResolvedFrontLayout;
  applicationRule: FurnitureAssemblyRule;
  toeKickMm: number;
  cabinetDepthMm: number;
  doorThicknessMm: number;
};
