import type { StructuralJoineryRule } from "../../contracts/StructuralJoinery";

const HAFELE_MINIFIX_PROVENANCE = {
  id: "hafele-minifix15-official-product-pages",
  sourceType: "manufacturer-documentation" as const,
  sourceTitle: "Häfele Minifix 15 connector housing and turned connecting bolt official product pages",
  manufacturer: "Häfele",
  documentRevision: "Official product pages accessed 2026-08-19",
  sourceReference: "https://www.hafele.com/us/en/product/connector-housing-minifix-15/P-00861332/; https://www.hafele.com/us/en/product/connecting-bolt-turned-minifix-system/P-00861784/",
  verifiedAt: "2026-08-19",
  notes: "Manufacturer facts are kept separate from Dioris placement policy. The product page exposes Minifix 15 housing options for wood thickness >=16 mm, housing drilling depth 12.5 mm +0.5 mm, Dim. A 8 mm, and the turned bolt page exposes drilling dimensions 24/34 mm and thread lengths 8/11/15 mm. Unlisted target-hole diameter/depth/tool remain unknown.",
};

const MINIFIX_SPEC = {
  kind: "structural-connector" as const,
  family: "MINIFIX" as const,
  housingDiameterMm: 15 as const,
  housingDepthMm: 12.5 as const,
  housingDepthToleranceMm: 0.5 as const,
  minimumPanelThicknessMm: 16 as const,
  housingReferenceFromEdgeMm: 8 as const,
  connectingBoltDrillingDistanceMm: 24 as const,
  connectingBoltThreadLengthMm: 15 as const,
  provenance: HAFELE_MINIFIX_PROVENANCE,
};

function rule(moduleDefinitionId: string, id: string): StructuralJoineryRule {
  return {
    id,
    moduleDefinitionId,
    connectorHardwareId: "structural-minifix-15",
    manufacturingVariantId: "hafele-minifix15-p00861332",
    jointStrategy: "eccentric-cam-panel-connector",
    eligibleRelations: [
      "side-left-to-base",
      "side-right-to-base",
      "side-left-to-top",
      "side-right-to-top",
    ],
    placementPolicy: "symmetric-pair",
    quantityPolicy: "front-rear-pair",
    assemblyPolicy: "detachable",
    machiningPolicy: "manufacturer-data-only",
    connectorSpec: MINIFIX_SPEC,
    placement: {
      frontOffsetFromRearMm: 80,
      rearOffsetFromFrontMm: 80,
      minimumClearSpanMm: 80,
    },
    provenance: {
      ...HAFELE_MINIFIX_PROVENANCE,
      id: `${id}-application-provenance`,
      notes: "A policy de placement front/rear e a seleção das relações são decisões construtivas do Dioris; não são apresentadas como dados do fabricante.",
    },
  };
}

export const GOLDEN_BASE_STRUCTURAL_JOINERY_RULE = rule(
  "kitchen-base-2-doors",
  "kitchen-base-2-doors:structural-joinery-minifix-v1",
);

export const GOLDEN_DRAWER_STRUCTURAL_JOINERY_RULE = rule(
  "kitchen-drawer-3",
  "kitchen-drawer-3:structural-joinery-minifix-v1",
);
