import type { ModuleDefinition } from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { buildCarcass, buildDoors, buildDrawers } from "./carcass";

export const DemoTallCabinet: ModuleDefinition = {
  id: "demo-tall-cabinet",
  familyId: "generic",
  category: "Demonstrativos",
  name: "Torre / módulo alto (demo)",
  description: "Torre de validação: caixa real, 3 prateleiras, portas e gaveta inferior.",
  defaultDimensionsMm: { width: 700, height: 2200, depth: 600 },
  minDimensionsMm: { width: 400, height: 1400, depth: 350 },
  maxDimensionsMm: { width: 1000, height: 2600, depth: 700 },
  dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
  placementRules: {
    ...DEFAULT_PLACEMENT,
    allowedWalls: ["back", "left", "right"],
    acceptsUpperModule: false,
    acceptsAppliance: true,
  },
  defaultMaterialId: "mdf-wood-natural",
  allowedMaterialIds: [
    "mdf-white",
    "mdf-wood-natural",
    "mdf-graphite",
    "mdf-green",
    "mdf-taupe",
  ],
  defaultHardwareIds: ["hinge-soft-close", "handle-bar", "slide-telescopic", "leg-adjustable"],
  build: ({ dimensionsMm, materialId }) => {
    const moduleId = DemoTallCabinet.id;
    const toeKickMm = 100;
    const drawerZoneMm = 400;
    const doorZoneHeight = dimensionsMm.height - drawerZoneMm;

    const parts = [
      ...buildCarcass(moduleId, dimensionsMm, materialId, { toeKickMm, shelves: 3 }),
      ...buildDoors(
        moduleId,
        { ...dimensionsMm, height: doorZoneHeight },
        materialId,
        { toeKickMm: 0, leaves: 2 }
      ).map((part) => ({
        ...part,
        positionMm: { ...part.positionMm, y: part.positionMm.y + drawerZoneMm },
      })),
      ...buildDrawers(
        moduleId,
        { ...dimensionsMm, height: drawerZoneMm + toeKickMm },
        materialId,
        { toeKickMm, count: 1 }
      ),
    ];

    return {
      parts,
      boundingBoxMm: dimensionsMm,
      hardwareIds: DemoTallCabinet.defaultHardwareIds,
      warnings: [],
    };
  },
};