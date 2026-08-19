export type FrontLayoutValidationStatus = "READY" | "INCOMPLETE" | "INVALID";
export type FrontLayoutDiagnosticCode =
  | "NEGATIVE_GAP"
  | "FRONTS_OVERFLOW"
  | "ASYMMETRIC_LAYOUT"
  | "INVALID_FRONT_COUNT"
  | "ZERO_OR_NEGATIVE_FRONT_SIZE";

export type FrontLayoutApplicationType = "symmetric-paired-overlay" | "paired-overlay" | "single-front";

export interface FrontLayoutRule {
  id: string;
  moduleDefinitionId: string;
  applicationType: FrontLayoutApplicationType;
  frontCount: number;
  symmetric: boolean;
  leftRevealMm: number;
  rightRevealMm: number;
  interFrontGapMm: number;
  topRevealMm: number;
  bottomRevealMm: number;
  frontThicknessMm: number;
  toleranceMm: number;
}

export interface ResolvedFrontLayout {
  id: string;
  ruleId: string;
  moduleDefinitionId: string;
  cabinetWidthMm: number;
  cabinetHeightMm: number;
  cabinetDepthMm: number;
  frontCount: number;
  leftRevealMm: number;
  rightRevealMm: number;
  interFrontGapsMm: number[];
  doorWidthsMm: number[];
  doorCentersMm: number[];
  doorEdgesMm: Array<{ left: number; right: number }>;
  topRevealMm: number;
  bottomRevealMm: number;
  doorHeightMm: number;
  frontZMm: number;
  hingeSides: Array<"left" | "right">;
  pivotXByFrontMm: number[];
  validationStatus: FrontLayoutValidationStatus;
  diagnostics: string[];
  diagnosticCodes: FrontLayoutDiagnosticCode[];
}
