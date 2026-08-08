import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDrawers } from "../demo/carcass";

export const KitchenDrawerCabinet: ModuleDefinition = {
  id: "kitchen-drawer-3",
  familyId: "kitchen",
  category: "Inferiores",
  name: "Gaveteiro 3 Gavetas",
  description: "Balcão inferior com 3 gavetas (2 baixas e 1 gavetão).",
  defaultDimensionsMm: { width: 600, height: 870, depth: 580 },
  minDimensionsMm: { width: 300, height: 600, depth: 400 },
  maxDimensionsMm: { width: 1000, height: 1000, depth: 700 },
  dimensionalRules: { widthStepMm: 10, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    requiresCountertop: true,
  },
  defaultMaterialId: "mdf-white",
  allowedMaterialIds: [
    "mdf-white",
    "mdf-wood-natural",
    "mdf-graphite",
    "mdf-green",
    "mdf-taupe",
  ],
  defaultHardwareIds: ["slide-hidden", "handle-bar", "leg-adjustable"],
  build: ({ dimensionsMm, materialId }) => {
    const moduleId = KitchenDrawerCabinet.id;
    const toeKickMm = 150;
    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, materialId, { toeKickMm, shelves: 0 }),
      ...buildDrawers(moduleId, dimensionsMm, materialId, { toeKickMm, count: 3 }),
    ];
    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: KitchenDrawerCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};
