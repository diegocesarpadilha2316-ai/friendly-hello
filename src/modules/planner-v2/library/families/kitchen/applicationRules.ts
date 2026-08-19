import type { FurnitureAssemblyRule } from "../../contracts/HardwareApplicationRule";

export const GOLDEN_71B3550_173H7100_RULE: FurnitureAssemblyRule = {
  id: "kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100",
  moduleDefinitionId: "kitchen-base-2-doors",
  hardwareSlot: "hinge",
  mountingPlateSlot: "mountingPlate",
  hardwareVariantId: "blum-71b3550-standard-110",
  mountingPlateVariantId: "blum-173h7100-37-32",
  applicationType: "paired-full-overlay",
  hingeEdgeOffsetMm: 35,
  verticalEdgeOffsetMm: 110,
  threeHingeThresholdDoorHeightMm: 900,
  constraints: {
    targetPartRoles: ["door", "side-left", "side-right"],
    requiresDoorThickness: true,
    requiresOverlayAndReveal: true,
    allowedBoringDistanceRangeMm: { min: 3, max: 7 },
  },
  provenance: {
    id: "kitchen-base-2-doors:paired-full-overlay:application-rule-source",
    sourceType: "family-rule",
    sourceTitle: "Golden Module application rule derived from current kitchen builder",
    sourceReference: "src/modules/planner-v2/library/families/kitchen/applicationRules.ts",
    verifiedAt: "2026-08-18",
    notes: "Family-scoped rule. Manufacturer dimensions remain in HardwareRegistry; this rule records only the Golden application decisions and constraints.",
  },
};

export function getKitchenApplicationRule(
  moduleDefinitionId: string,
  hardwareVariantId?: string,
  mountingPlateVariantId?: string,
): FurnitureAssemblyRule | undefined {
  if (moduleDefinitionId !== GOLDEN_71B3550_173H7100_RULE.moduleDefinitionId) return undefined;
  if (
    hardwareVariantId === GOLDEN_71B3550_173H7100_RULE.hardwareVariantId &&
    mountingPlateVariantId === GOLDEN_71B3550_173H7100_RULE.mountingPlateVariantId
  ) {
    return GOLDEN_71B3550_173H7100_RULE;
  }
  return undefined;
}
