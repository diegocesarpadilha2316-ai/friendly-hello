import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDoors } from "../../families/kitchen/builders";

export const KitchenBaseCabinet: ModuleDefinition = {
  id: "kitchen-base-2-doors",
  familyId: "kitchen",
  category: "Inferiores",
  name: "Balcão 2 Portas",
  description: "Balcão inferior padrão com duas portas e prateleira interna.",
  defaultDimensionsMm: { width: 800, height: 870, depth: 580 },
  minDimensionsMm: { width: 600, height: 600, depth: 300 },
  maxDimensionsMm: { width: 1200, height: 1000, depth: 700 },
  dimensionalRules: { widthStepMm: 10, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    requiresCountertop: true,
    acceptsUpperModule: true,
  },
  defaultMaterialId: "mdf-white",
  allowedMaterialIds: ["mdf-white", "mdf-wood-natural", "mdf-graphite", "mdf-green", "mdf-taupe"],
  defaultHardwareIds: ["hinge-standard", "handle-bar", "leg-adjustable"],
  build: ({ dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) => {
    const moduleId = KitchenBaseCabinet.id;
    const toeKickMm = 150; // Padrão cozinha brasileira
    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        toeKickMm,
        shelves: 1,
        thicknessMm,
      }),
      ...buildDoors(moduleId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        toeKickMm,
        doorLeaves: 2,
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
        mountingPlate: hardwareOverrides?.mountingPlate,
        thicknessMm,
      }),
    ];
    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: KitchenBaseCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};
