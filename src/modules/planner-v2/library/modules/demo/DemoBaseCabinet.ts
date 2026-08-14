import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDrawers } from "./carcass";

export const DemoBaseCabinet: ModuleDefinition = {
  id: "demo-base-cabinet",
  familyId: "generic",
  category: "Demonstrativos",
  name: "Módulo inferior (demo)",
  description: "Gaveteiro inferior de validação: caixa real, 3 gavetas e puxadores.",
  defaultDimensionsMm: { width: 800, height: 870, depth: 580 },
  minDimensionsMm: { width: 300, height: 600, depth: 300 },
  maxDimensionsMm: { width: 1200, height: 1000, depth: 700 },
  dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    requiresCountertop: true,
    acceptsUpperModule: true,
  },
  defaultMaterialId: "mdf-white",
  allowedMaterialIds: ["mdf-white", "mdf-wood-natural", "mdf-graphite", "mdf-green", "mdf-taupe"],
  defaultHardwareIds: ["slide-hidden", "handle-bar", "leg-adjustable"],
  build: ({ dimensionsMm, materialId }) => {
    const moduleId = DemoBaseCabinet.id;
    const toeKickMm = 100;
    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, materialId, { toeKickMm, shelves: 0 }),
      ...buildDrawers(moduleId, dimensionsMm, materialId, { toeKickMm, count: 3 }),
    ];
    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: DemoBaseCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};
