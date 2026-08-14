import type { Dimensions3 } from "../contracts/ModuleDefinition";

export type WallId = string;
export type WallAnchor = "floor" | "wall" | "countertop" | "appliance-zone";
export type LayoutAlignment = "front" | "center" | "left" | "right";
export type OpeningType = "window" | "door" | "passage";

export interface WallOpening {
  id: string;
  wallId: WallId;
  type: OpeningType;
  startX: number;
  endX: number;
  bottomY: number;
  topY: number;
  depthMm?: number;
}

export interface KitchenWall {
  id: WallId;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  originMm: { x: number; y: number; z: number };
  openings: WallOpening[];
}

export interface LayoutRelation {
  wallId: WallId;
  anchor: WallAnchor;
  sequenceIndex: number;
  previousModuleId?: string;
  nextModuleId?: string;
  anchorModuleId?: string;
  alignment: LayoutAlignment;
  clearanceMm: number;
}

export interface LayoutModuleSpec {
  id: string;
  moduleId: string;
  kind?: string;
  dimensionsMm: Dimensions3;
  relation: LayoutRelation;
}

export interface ApplianceZone {
  id: string;
  wallId: WallId;
  moduleId: string;
  startX: number;
  endX: number;
  bottomY: number;
  topY: number;
  depthMm: number;
  clearanceMm: number;
}

export interface LayoutPlacement {
  moduleId: string;
  moduleDefinitionId: string;
  wallId: WallId;
  anchor: WallAnchor;
  sequenceIndex: number;
  startX: number;
  endX: number;
  bottomY: number;
  topY: number;
  depthMm: number;
  positionMm: { x: number; y: number; z: number };
  previousModuleId?: string;
  nextModuleId?: string;
  supported: boolean;
  collision: boolean;
  clearanceMm: number;
  applianceZoneId?: string;
}

export interface CountertopSpan {
  id: string;
  wallId: string;
  supportModuleIds: string[];
  startX: number;
  endX: number;
  topY: number;
  depthMm: number;
  thicknessMm: number;
  supported: boolean;
}

export interface TechnicalRelationship {
  id: string;
  type: "sink" | "cooktop" | "hood";
  parentModuleId: string;
  countertopId?: string;
  targetCooktopId?: string;
  centerX: number;
  topY: number;
  clearanceMm: number;
  valid: boolean;
}

export interface LayoutAuditIssue {
  code: string;
  message: string;
  moduleId?: string;
}

export interface KitchenLayoutResult {
  placements: LayoutPlacement[];
  countertops: CountertopSpan[];
  applianceZones: ApplianceZone[];
  technicalRelationships: TechnicalRelationship[];
  issues: LayoutAuditIssue[];
  valid: boolean;
}
