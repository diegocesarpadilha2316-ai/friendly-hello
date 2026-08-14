import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDoors } from "./carcass";

export const DemoUpperCabinet: ModuleDefinition = {
  id: "demo-upper-cabinet",
  familyId: "generic",
  category: "Demonstrativos",
  name: "Módulo aéreo (demo)",
  description: "Aéreo suspenso de validação: caixa real, prateleira e duas portas.",
  defaultDimensionsMm: { width: 800, height: 700, depth: 350 },
  minDimensionsMm: { width: 300, height: 300, depth: 250 },
  maxDimensionsMm: { width: 1200, height: 900, depth: 450 },
  dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    floorMounted: false,
    wallMounted: true,
    allowedWalls: ["back", "left", "right"],
    minHeightFromFloorMm: 1450,
    maxHeightFromFloorMm: 2200,
    acceptsUpperModule: false,
  },
  defaultMaterialId: "mdf-white",
  allowedMaterialIds: [
    "mdf-white",
    "mdf-wood-natural",
    "mdf-graphite",
    "mdf-taupe",
    "glass-smoked",
  ],
  defaultHardwareIds: ["hinge-soft-close", "handle-profile", "shelf-support"],
  build: ({ dimensionsMm, materialId }) => {
    const moduleId = DemoUpperCabinet.id;
    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, materialId, { shelves: 1 }),
      ...buildDoors(moduleId, dimensionsMm, materialId, { leaves: 2 }),
    ];
    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: DemoUpperCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};
