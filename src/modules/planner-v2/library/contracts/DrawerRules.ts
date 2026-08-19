export type DrawerDistribution = "equal";
export type DrawerReadiness = "READY" | "INCOMPLETE" | "INVALID";

export type DrawerStackRule = {
  id: string;
  moduleDefinitionId: string;
  drawerCount: number;
  distribution: DrawerDistribution;
  topRevealMm: number;
  bottomRevealMm: number;
  interDrawerGapMm: number;
  provenance: {
    sourceType: "family-rule";
    sourceTitle: string;
    sourceReference: string;
    verifiedAt: string;
    notes?: string;
  };
};

export type DrawerBoxRule = {
  id: string;
  moduleDefinitionId: string;
  sideThicknessMm: number;
  backThicknessMm: number;
  bottomThicknessMm: number;
  frontBackClearanceMm: number;
  sideHeightReductionMm: number;
  readiness: "READY";
};

export type DrawerIndustrialSlideRule = {
  id: string;
  moduleDefinitionId: string;
  hardwareId: string;
  manufacturingVariantId: string;
  manufacturer: "Blum";
  family: "MOVENTO";
  variant: "760H";
  nominalLengthMm: number;
  drawerSideThicknessMm: number;
  boxDepthPolicy: "manufacturer-drawer-length";
  mountingStatus: "READY" | "INCOMPLETE";
  machiningStatus: "READY" | "INCOMPLETE";
  provenance: {
    sourceType: "manufacturer-documentation";
    sourceTitle: string;
    sourceReference: string;
    verifiedAt: string;
    notes?: string;
  };
};

export type DrawerSlideApplicationRule = {
  id: string;
  moduleDefinitionId: string;
  slideHardwareId: string;
  lateralClearanceLeftMm: number;
  lateralClearanceRightMm: number;
  depthClearanceMm: number;
  travelPolicy: "visual-safe";
  manufacturingStatus: "INCOMPLETE";
  machiningStatus: "INCOMPLETE";
  provenance: {
    sourceType: "generic-domain-rule";
    sourceTitle: string;
    sourceReference: string;
    verifiedAt: string;
    notes?: string;
  };
};

export type ResolvedDrawerOpening = {
  status: DrawerReadiness;
  internalWidthMm: number;
  internalHeightMm: number;
  internalDepthMm: number;
  diagnostics: string[];
};

export type ResolvedDrawerStackItem = {
  drawerId: string;
  index: number;
  frontId: string;
  frontWidthMm: number;
  frontHeightMm: number;
  frontCenterYmm: number;
  frontTopMm: number;
  frontBottomMm: number;
  gapAboveMm: number;
  gapBelowMm: number;
  boxWidthMm: number;
  boxHeightMm: number;
  boxDepthMm: number;
  slideClearanceLeftMm: number;
  slideClearanceRightMm: number;
  slideTravelMm: number;
};

export type ResolvedDrawerIndustrialSlide = {
  status: DrawerReadiness;
  ruleId: string;
  manufacturer: "Blum";
  family: "MOVENTO";
  variant: "760H";
  nominalLengthMm: number;
  drawerLengthMm: number;
  drawerWidthMm: number;
  drawerSideThicknessMm: number;
  mountingStatus: "READY" | "INCOMPLETE";
  machiningStatus: "READY" | "INCOMPLETE";
  diagnostics: string[];
};

export type ResolvedDrawerStack = {
  status: DrawerReadiness;
  moduleDefinitionId: string;
  opening: ResolvedDrawerOpening;
  ruleId: string;
  drawerCount: number;
  items: ResolvedDrawerStackItem[];
  diagnostics: string[];
  industrialSlide?: ResolvedDrawerIndustrialSlide;
};
