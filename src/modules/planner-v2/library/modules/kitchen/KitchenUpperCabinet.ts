import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDoors } from "../demo/carcass";

export const KitchenUpperCabinet: ModuleDefinition = {
  id: "kitchen-upper-2-doors",
  familyId: "kitchen",
  category: "Aéreos",
  name: "Aéreo 2 Portas",
  description: "Módulo aéreo superior com duas portas e prateleira interna.",
  defaultDimensionsMm: { width: 800, height: 600, depth: 350 },
  minDimensionsMm: { width: 600, height: 300, depth: 250 },
  maxDimensionsMm: { width: 1200, height: 900, depth: 450 },
  dimensionalRules: { widthStepMm: 10, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    wallMounted: true,
    minHeightFromFloorMm: 1400,
  },
  defaultMaterialId: "mdf-white",
  allowedMaterialIds: ["mdf-white", "mdf-wood-natural", "mdf-graphite", "mdf-green", "mdf-taupe"],
  defaultHardwareIds: ["hinge-standard", "handle-bar"],
  build: ({ dimensionsMm, materialId }) => {
    const moduleId = KitchenUpperCabinet.id;
    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, materialId, { toeKickMm: 0, shelves: 1 }),
      ...buildDoors(moduleId, dimensionsMm, materialId, { toeKickMm: 0, leaves: 2 }),
    ];
    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: KitchenUpperCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};
