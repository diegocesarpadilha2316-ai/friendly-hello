import type { Dimensions3, ThicknessProfileMm } from "./ModuleDefinition";
import type { EdgeBand, PartRole } from "./PartDefinition";
import type { GrainDirection } from "./MaterialDefinition";

export type CarcassRelation =
  | "full-height"
  | "full-height-above-toe-kick"
  | "between-sides"
  | "between-sides-flush-with-top"
  | "between-sides-flush-with-rear"
  | "between-sides-supported"
  | "separate-profile-supported-by-feet";

export type CarcassMaterialSlot = "body" | "back" | "toe-kick";

export interface CarcassConstructionRule {
  id: string;
  moduleDefinitionId: string;
  sideRelation: Extract<CarcassRelation, "full-height" | "full-height-above-toe-kick">;
  baseRelation: "between-sides";
  topRelation: "between-sides-flush-with-top";
  backRelation: "between-sides-flush-with-rear";
  shelfRelation: "between-sides-supported";
  toeKickRelation: "none" | "separate-profile-supported-by-feet";
  shelfSideClearanceMm: number;
  shelfDepthInsetMm: number;
  toeKickInsetMm: number;
  edgeBandingEdgesByRole: Partial<Record<PartRole, EdgeBand[]>>;
}

export interface CarcassPanelRelation {
  relation: CarcassRelation;
  references: string[];
  explanation: string;
}

export interface ResolvedCarcassPanel {
  idSuffix: string;
  role: Extract<PartRole, "side-left" | "side-right" | "base" | "top" | "back" | "shelf">;
  name: string;
  dimensionsMm: Dimensions3;
  positionMm: { x: number; y: number; z: number };
  thicknessMm: number;
  materialSlot: CarcassMaterialSlot;
  grainDirection: GrainDirection;
  edgeBandingEdges: EdgeBand[];
  relation: CarcassPanelRelation;
}

export interface ResolvedCarcassToeKick {
  idSuffix: "toe-kick";
  role: "toe-kick";
  dimensionsMm: Dimensions3;
  positionMm: { x: number; y: number; z: number };
  relation: CarcassPanelRelation;
}

export type CarcassValidationCode =
  | "INVALID_TOE_KICK"
  | "UNEXPECTED_TOE_KICK"
  | "MISSING_REQUIRED_TOE_KICK"
  | "NEGATIVE_INTERNAL_WIDTH"
  | "NEGATIVE_INTERNAL_HEIGHT"
  | "INVALID_PANEL_THICKNESS"
  | "PANEL_OUTSIDE_CABINET"
  | "UNEXPECTED_OVERLAP"
  | "STRUCTURAL_GAP"
  | "ASYMMETRIC_SIDES"
  | "INVALID_DIMENSIONS";

export interface CarcassDiagnostic {
  code: CarcassValidationCode;
  message: string;
  partId?: string;
}

export interface ResolvedCarcass {
  id: string;
  moduleDefinitionId: string;
  dimensionsMm: Dimensions3;
  thicknessProfileMm: Required<ThicknessProfileMm>;
  toeKickMm: number;
  internalWidthMm: number;
  internalHeightMm: number;
  internalDepthMm: number;
  bodyHeightMm: number;
  panels: ResolvedCarcassPanel[];
  toeKick?: ResolvedCarcassToeKick;
  validationStatus: "READY" | "INCOMPLETE" | "INVALID";
  diagnostics: CarcassDiagnostic[];
}
