import type { DrawerBoxRule, DrawerSlideApplicationRule, DrawerStackRule } from "../../contracts/DrawerRules";

export const GOLDEN_DRAWER_3_ID = "kitchen-drawer-3";

export const GOLDEN_DRAWER_3_STACK_RULE: DrawerStackRule = {
  id: "kitchen-drawer-3:drawer-stack:equal-v1",
  moduleDefinitionId: GOLDEN_DRAWER_3_ID,
  drawerCount: 3,
  distribution: "equal",
  topRevealMm: 2,
  bottomRevealMm: 2,
  interDrawerGapMm: 2,
  provenance: {
    sourceType: "family-rule",
    sourceTitle: "Dioris Golden Drawer equal stack",
    sourceReference: "dioris://planner-v2/kitchen-drawer-3/drawer-stack",
    verifiedAt: "2026-08-19",
    notes: "Equal distribution is the pilot contract; dimensions are derived from the resolved carcass opening.",
  },
};

export const GOLDEN_DRAWER_3_BOX_RULE: DrawerBoxRule = {
  id: "kitchen-drawer-3:drawer-box:legacy-visual-v1",
  moduleDefinitionId: GOLDEN_DRAWER_3_ID,
  sideThicknessMm: 15,
  backThicknessMm: 15,
  bottomThicknessMm: 15,
  frontBackClearanceMm: 60,
  sideHeightReductionMm: 40,
  readiness: "READY",
};

export const GOLDEN_DRAWER_3_SLIDE_RULE: DrawerSlideApplicationRule = {
  id: "kitchen-drawer-3:slide-application:generic-visual-v1",
  moduleDefinitionId: GOLDEN_DRAWER_3_ID,
  slideHardwareId: "slide-hidden-soft-close",
  lateralClearanceLeftMm: 13,
  lateralClearanceRightMm: 13,
  depthClearanceMm: 60,
  travelPolicy: "visual-safe",
  manufacturingStatus: "INCOMPLETE",
  machiningStatus: "INCOMPLETE",
  provenance: {
    sourceType: "generic-domain-rule",
    sourceTitle: "Dioris legacy visual drawer clearance",
    sourceReference: "dioris://planner-v2/kitchen-drawer-3/legacy-buildDrawers",
    verifiedAt: "2026-08-19",
    notes: "The 26 mm total lateral and 60 mm depth clearances preserve the existing visual builder output. They are not manufacturer data and do not make slide manufacturing READY.",
  },
};
