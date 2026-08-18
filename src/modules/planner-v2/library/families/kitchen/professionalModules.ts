import type {
  Dimensions3,
  ModuleDefinition,
  ModuleBuildResult,
} from "../../contracts/ModuleDefinition";
import { DEFAULT_PLACEMENT } from "../../contracts/PlacementRules";
import { KITCHEN_MATERIAL_IDS, KITCHEN_COUNTERTOP_MATERIAL_IDS } from "./config";
import {
  buildBase,
  buildComplement,
  buildCorner,
  buildCountertop,
  buildCooktop,
  buildIsland,
  buildSink,
  buildTower,
  buildUpper,
} from "./builders";

const materials = [...KITCHEN_MATERIAL_IDS];
const countertopMaterials = [...KITCHEN_COUNTERTOP_MATERIAL_IDS];

const basePlacement = { ...DEFAULT_PLACEMENT, requiresCountertop: true, acceptsUpperModule: true };
const upperPlacement = {
  ...DEFAULT_PLACEMENT,
  wallMounted: true,
  minHeightFromFloorMm: 1500,
  defaultHeightFromFloorMm: 1500,
  acceptsUpperModule: true,
};
const towerPlacement = {
  ...DEFAULT_PLACEMENT,
  requiresCountertop: false,
  wallMounted: false,
  defaultHeightFromFloorMm: 0,
};

function definition(
  config: Omit<ModuleDefinition, "build">,
  build: (input: Parameters<ModuleDefinition["build"]>[0]) => ModuleBuildResult,
): ModuleDefinition {
  return { ...config, build };
}

const base = (config: {
  id: string;
  name: string;
  defaultWidth: number;
  doorLeaves?: 0 | 1 | 2 | 3;
  drawerCount?: number;
  shelves?: number;
  includeCountertop?: boolean;
  description: string;
  kind?: ModuleDefinition["kind"];
}) =>
  definition(
    {
      id: config.id,
      familyId: "kitchen",
      category: "Inferiores",
      subcategory: config.drawerCount ? "Gaveteiros" : "Balcões",
      kind: config.kind ?? (config.drawerCount ? "drawer" : "base"),
      name: config.name,
      description: config.description,
      defaultDimensionsMm: { width: config.defaultWidth, height: 870, depth: 580 },
      minDimensionsMm: { width: 300, height: 600, depth: 400 },
      maxDimensionsMm: { width: 1200, height: 1000, depth: 700 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: [
        "hinge-soft-close",
        "slide-hidden-soft-close",
        "handle-bar",
        "leg-adjustable",
      ],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildBase(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        doorLeaves: config.doorLeaves ?? 2,
        drawerCount: config.drawerCount ?? 0,
        shelves: config.shelves ?? (config.doorLeaves && config.doorLeaves > 0 ? 1 : 0),
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
        slide: hardwareOverrides?.slide,
        includeCountertop: config.includeCountertop,
      }),
  );

const upper = (config: {
  id: string;
  name: string;
  defaultWidth: number;
  doorLeaves?: 0 | 1 | 2 | 3;
  shelves?: number;
  handle?: string;
  flap?: boolean;
  niche?: boolean;
  glass?: boolean;
  description: string;
}) =>
  definition(
    {
      id: config.id,
      familyId: "kitchen",
      category: "Aéreos",
      subcategory: config.niche ? "Nichos" : "Portas e basculantes",
      kind: "upper",
      name: config.name,
      description: config.description,
      defaultDimensionsMm: { width: config.defaultWidth, height: 700, depth: 350 },
      minDimensionsMm: { width: 300, height: 300, depth: 250 },
      maxDimensionsMm: { width: 1200, height: 1200, depth: 450 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
      placementRules: upperPlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: [
        config.flap ? "piston-gas" : "hinge-soft-close",
        config.handle ?? "handle-bar",
      ],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildUpper(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        doorLeaves: config.doorLeaves ?? 2,
        shelves: config.shelves,
        flap: config.flap,
        niche: config.niche,
        glass: config.glass,
        handle: hardwareOverrides?.handle ?? config.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  );

const tower = (config: {
  id: string;
  name: string;
  defaultWidth: number;
  appliance: "oven" | "fridge";
  description: string;
  technicalAppliance?: "oven" | "microwave" | "fridge";
}) =>
  definition(
    {
      id: config.id,
      familyId: "kitchen",
      category: "Torres",
      subcategory: "Eletros",
      kind: "tower",
      name: config.name,
      description: config.description,
      defaultDimensionsMm: { width: config.defaultWidth, height: 2200, depth: 620 },
      minDimensionsMm: { width: 500, height: 1800, depth: 500 },
      maxDimensionsMm: { width: 1200, height: 2600, depth: 750 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
      placementRules: towerPlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["hinge-soft-close", "handle-bar"],
      technical: config.technicalAppliance ? { appliance: config.technicalAppliance } : undefined,
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildTower(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        appliance: config.appliance,
        towerLayout:
          config.technicalAppliance === "microwave"
            ? "oven-microwave"
            : config.technicalAppliance === "fridge"
              ? "fridge"
              : config.technicalAppliance === "oven"
                ? "oven"
                : "pantry",
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  );

export const professionalKitchenModules: ModuleDefinition[] = [
  base({
    id: "kitchen-base-1-door",
    name: "Balcão 1 Porta",
    defaultWidth: 450,
    doorLeaves: 1,
    description: "Balcão inferior estreito com uma porta.",
  }),
  base({
    id: "kitchen-base-2-doors",
    name: "Balcão 2 Portas",
    defaultWidth: 800,
    doorLeaves: 2,
    includeCountertop: true,
    description: "Balcão inferior com duas portas, prateleira interna e tampo de bancada.",
  }),
  base({
    id: "kitchen-base-3-doors",
    name: "Balcão 3 Portas",
    defaultWidth: 1200,
    doorLeaves: 3,
    description: "Balcão inferior largo com três portas.",
  }),
  base({
    id: "kitchen-drawer-1",
    name: "Gaveteiro 1 Gaveta",
    defaultWidth: 450,
    doorLeaves: 0,
    drawerCount: 1,
    description: "Gaveteiro inferior com uma caixa completa e corrediças.",
  }),
  base({
    id: "kitchen-drawer-2",
    name: "Gaveteiro 2 Gavetas",
    defaultWidth: 600,
    doorLeaves: 0,
    drawerCount: 2,
    description: "Gaveteiro inferior com duas caixas completas.",
  }),
  base({
    id: "kitchen-drawer-3",
    name: "Gaveteiro 3 Gavetas",
    defaultWidth: 600,
    doorLeaves: 0,
    drawerCount: 3,
    description: "Gaveteiro inferior com três caixas completas.",
  }),
  base({
    id: "kitchen-drawer-4",
    name: "Gaveteiro 4 Gavetas",
    defaultWidth: 600,
    doorLeaves: 0,
    drawerCount: 4,
    description: "Gaveteiro inferior com quatro caixas completas.",
  }),
  base({
    id: "kitchen-base-door-drawer",
    name: "Balcão Porta + Gaveta",
    defaultWidth: 600,
    doorLeaves: 1,
    drawerCount: 1,
    description: "Balcão combinado com porta e gaveta independente.",
  }),
  base({
    id: "kitchen-base-open-shelves",
    name: "Balcão Aberto com Prateleiras",
    defaultWidth: 800,
    doorLeaves: 0,
    shelves: 2,
    description: "Balcão inferior aberto com prateleiras estruturais.",
  }),
  base({
    id: "kitchen-appliance-cabinet",
    name: "Módulo Inferior para Eletrodoméstico",
    defaultWidth: 600,
    doorLeaves: 0,
    description: "Módulo inferior técnico para eletrodoméstico, com caixa e folga de instalação.",
  }),
  definition(
    {
      id: "kitchen-sink-cabinet",
      familyId: "kitchen",
      category: "Inferiores",
      subcategory: "Eletros",
      kind: "sink",
      name: "Balcão para Pia",
      description: "Balcão com zona técnica livre para cuba, sifão e tubulação.",
      defaultDimensionsMm: { width: 800, height: 870, depth: 580 },
      minDimensionsMm: { width: 600, height: 600, depth: 450 },
      maxDimensionsMm: { width: 1200, height: 1000, depth: 700 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["hinge-soft-close", "handle-bar", "leg-adjustable"],
      technical: { sinkClearance: { widthMm: 600, depthMm: 480, plumbingZoneMm: 180 } },
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildSink(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  ),
  definition(
    {
      id: "kitchen-cooktop-cabinet",
      familyId: "kitchen",
      category: "Inferiores",
      subcategory: "Eletros",
      kind: "cooktop",
      name: "Balcão para Cooktop",
      description: "Balcão com recorte técnico superior para cooktop.",
      defaultDimensionsMm: { width: 800, height: 870, depth: 580 },
      minDimensionsMm: { width: 600, height: 600, depth: 450 },
      maxDimensionsMm: { width: 1200, height: 1000, depth: 700 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 10 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["slide-hidden-soft-close", "handle-bar", "leg-adjustable"],
      technical: {
        cutout: { widthMm: 720, depthMm: 500, clearanceMm: 40 },
        appliance: "dishwasher",
      },
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildCooktop(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        handle: hardwareOverrides?.handle,
        slide: hardwareOverrides?.slide,
      }),
  ),
  definition(
    {
      id: "kitchen-corner-base",
      familyId: "kitchen",
      category: "Cantos",
      subcategory: "Inferiores",
      kind: "corner",
      name: "Balcão de Canto",
      description: "Balcão em L para encaixe em duas paredes.",
      defaultDimensionsMm: { width: 900, height: 870, depth: 900 },
      minDimensionsMm: { width: 700, height: 600, depth: 700 },
      maxDimensionsMm: { width: 1400, height: 1000, depth: 1400 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 50 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["hinge-soft-close", "handle-bar", "leg-adjustable"],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildCorner(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  ),
  upper({
    id: "kitchen-golden-upper-800",
    name: "Golden Module — Aéreo 800×700×350",
    defaultWidth: 800,
    doorLeaves: 2,
    shelves: 3,
    handle: "handle-cava",
    description:
      "Módulo de validação estrutural: MDF 18 mm, duas portas, três prateleiras, fundo 6 mm, folgas e ferragens reais.",
  }),
  upper({
    id: "kitchen-upper-1-door",
    name: "Aéreo 1 Porta",
    defaultWidth: 450,
    doorLeaves: 1,
    description: "Aéreo compacto com uma porta.",
  }),
  upper({
    id: "kitchen-upper-2-doors",
    name: "Aéreo 2 Portas",
    defaultWidth: 800,
    doorLeaves: 2,
    description: "Aéreo com duas portas.",
  }),
  upper({
    id: "kitchen-upper-3-doors",
    name: "Aéreo 3 Portas",
    defaultWidth: 1200,
    doorLeaves: 3,
    description: "Aéreo largo com três portas.",
  }),
  upper({
    id: "kitchen-upper-flap",
    name: "Aéreo Basculante",
    defaultWidth: 800,
    flap: true,
    description: "Aéreo com abertura basculante e pistão.",
  }),
  upper({
    id: "kitchen-upper-open-niche",
    name: "Aéreo Nicho Aberto",
    defaultWidth: 800,
    niche: true,
    description: "Aéreo aberto com prateleiras internas.",
  }),
  upper({
    id: "kitchen-upper-shelves-800",
    name: "Aéreo com Prateleiras",
    defaultWidth: 800,
    niche: true,
    description: "Aéreo aberto parametrizado com três prateleiras estruturais.",
  }),
  upper({
    id: "kitchen-upper-microwave",
    name: "Aéreo para Micro-ondas",
    defaultWidth: 600,
    niche: true,
    description: "Aéreo técnico aberto para micro-ondas, com folgas de ventilação.",
  }),
  upper({
    id: "kitchen-upper-hood",
    name: "Aéreo para Coifa/Depurador",
    defaultWidth: 900,
    niche: true,
    description: "Aéreo técnico para coifa ou depurador, com passagem de instalação.",
  }),
  upper({
    id: "kitchen-upper-over-fridge",
    name: "Aéreo sobre Geladeira",
    defaultWidth: 900,
    niche: true,
    description: "Aéreo superior sobre geladeira, com profundidade e folgas ajustáveis.",
  }),
  upper({
    id: "kitchen-upper-glass-2-doors",
    name: "Vitrine 2 Portas",
    defaultWidth: 800,
    glass: true,
    description: "Aéreo com duas portas de vidro, prateleiras e iluminação interna.",
  }),
  upper({
    id: "kitchen-upper-corner",
    name: "Aéreo de Canto",
    defaultWidth: 700,
    doorLeaves: 1,
    description: "Aéreo de canto para encontro de paredes.",
  }),
  tower({
    id: "kitchen-tower-oven",
    name: "Torre para Forno",
    defaultWidth: 600,
    appliance: "oven",
    technicalAppliance: "oven",
    description: "Torre com nicho técnico para forno.",
  }),
  tower({
    id: "kitchen-tower-oven-microwave",
    name: "Torre Forno + Micro-ondas",
    defaultWidth: 700,
    appliance: "oven",
    technicalAppliance: "microwave",
    description: "Torre com nichos editáveis para forno e micro-ondas.",
  }),
  tower({
    id: "kitchen-tower-pantry",
    name: "Torre Despenseiro",
    defaultWidth: 600,
    appliance: "oven",
    description: "Torre alta com nichos e portas de despensa.",
  }),
  tower({
    id: "kitchen-tower-fridge",
    name: "Torre Geladeira",
    defaultWidth: 900,
    appliance: "fridge",
    technicalAppliance: "fridge",
    description: "Estrutura configurável ao redor da geladeira.",
  }),
  tower({
    id: "kitchen-tower-appliance",
    name: "Torre para Eletrodomésticos",
    defaultWidth: 700,
    appliance: "oven",
    technicalAppliance: "oven",
    description: "Torre mista para eletrodomésticos com nichos técnicos configuráveis.",
  }),
  definition(
    {
      id: "kitchen-open-niche",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Nichos",
      kind: "complement",
      name: "Nicho aberto",
      description: "Nicho aberto independente.",
      defaultDimensionsMm: { width: 600, height: 400, depth: 350 },
      minDimensionsMm: { width: 300, height: 200, depth: 250 },
      maxDimensionsMm: { width: 1200, height: 1200, depth: 600 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 50, depthStepMm: 10 },
      placementRules: DEFAULT_PLACEMENT,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: [],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildComplement(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        thicknessMm,
        role: "decorative",
        name: "Nicho aberto",
      }),
  ),
  definition(
    {
      id: "kitchen-shelf",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Prateleiras",
      kind: "complement",
      name: "Prateleira",
      description: "Prateleira independente com fita frontal.",
      defaultDimensionsMm: { width: 800, height: 18, depth: 300 },
      minDimensionsMm: { width: 300, height: 18, depth: 200 },
      maxDimensionsMm: { width: 1800, height: 40, depth: 500 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 2, depthStepMm: 10 },
      placementRules: DEFAULT_PLACEMENT,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["shelf-support"],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildComplement(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        thicknessMm,
        role: "shelf",
        name: "Prateleira",
      }),
  ),
  definition(
    {
      id: "kitchen-side-panel",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Acabamentos",
      kind: "complement",
      name: "Painel lateral",
      description: "Painel de acabamento lateral.",
      defaultDimensionsMm: { width: 18, height: 870, depth: 580 },
      minDimensionsMm: { width: 18, height: 300, depth: 200 },
      maxDimensionsMm: { width: 40, height: 2600, depth: 800 },
      dimensionalRules: { widthStepMm: 2, heightStepMm: 10, depthStepMm: 10 },
      placementRules: DEFAULT_PLACEMENT,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: [],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildComplement(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        thicknessMm,
        role: "decorative",
        name: "Painel lateral",
      }),
  ),
  definition(
    {
      id: "kitchen-valance",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Acabamentos",
      kind: "complement",
      name: "Testeira",
      description: "Testeira frontal parametrizada.",
      defaultDimensionsMm: { width: 800, height: 100, depth: 18 },
      minDimensionsMm: { width: 300, height: 50, depth: 18 },
      maxDimensionsMm: { width: 1800, height: 250, depth: 40 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 2 },
      placementRules: DEFAULT_PLACEMENT,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: [],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildComplement(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        thicknessMm,
        role: "decorative",
        name: "Testeira",
      }),
  ),
  definition(
    {
      id: "kitchen-toe-kick",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Acabamentos",
      kind: "complement",
      name: "Rodapé",
      description: "Rodapé independente para alinhamento inferior.",
      defaultDimensionsMm: { width: 800, height: 150, depth: 18 },
      minDimensionsMm: { width: 300, height: 80, depth: 18 },
      maxDimensionsMm: { width: 2400, height: 250, depth: 40 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 2 },
      placementRules: DEFAULT_PLACEMENT,
      defaultMaterialId: "metal-black",
      allowedMaterialIds: ["metal-black", "metal-inox", ...materials],
      defaultHardwareIds: ["leg-adjustable"],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildComplement(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        thicknessMm,
        role: "toe-kick",
        name: "Rodapé",
      }),
  ),
  definition(
    {
      id: "kitchen-countertop",
      familyId: "kitchen",
      category: "Bancadas",
      subcategory: "Pedras",
      kind: "countertop",
      name: "Bancada",
      description: "Bancada parametrizada encaixável sobre módulos inferiores.",
      defaultDimensionsMm: { width: 800, height: 20, depth: 600 },
      minDimensionsMm: { width: 300, height: 12, depth: 300 },
      maxDimensionsMm: { width: 6000, height: 60, depth: 1200 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 2, depthStepMm: 10 },
      placementRules: { ...basePlacement, defaultHeightFromFloorMm: 870 },
      defaultMaterialId: "stone-light",
      allowedMaterialIds: countertopMaterials,
      defaultHardwareIds: [],
      technical: { countertop: { thicknessMm: 20, overhangMm: 20 } },
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, thicknessMm }) =>
      buildCountertop(instanceId, dimensionsMm, { materialId, materialOverrides, thicknessMm }),
  ),
  definition(
    {
      id: "kitchen-island-base",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Ilhas",
      kind: "island",
      name: "Ilha base",
      description: "Ilha central com módulos e bancada integrada.",
      defaultDimensionsMm: { width: 1200, height: 870, depth: 700 },
      minDimensionsMm: { width: 600, height: 600, depth: 500 },
      maxDimensionsMm: { width: 2400, height: 1000, depth: 1200 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 50 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["hinge-soft-close", "handle-bar", "leg-adjustable"],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildIsland(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  ),
  definition(
    {
      id: "kitchen-peninsula-base",
      familyId: "kitchen",
      category: "Complementos",
      subcategory: "Ilhas",
      kind: "peninsula",
      name: "Península base",
      description: "Península base para composição linear ou em L.",
      defaultDimensionsMm: { width: 1200, height: 870, depth: 600 },
      minDimensionsMm: { width: 600, height: 600, depth: 450 },
      maxDimensionsMm: { width: 2400, height: 1000, depth: 1000 },
      dimensionalRules: { widthStepMm: 50, heightStepMm: 10, depthStepMm: 50 },
      placementRules: basePlacement,
      defaultMaterialId: "mdf-white",
      allowedMaterialIds: materials,
      defaultHardwareIds: ["hinge-soft-close", "handle-bar", "leg-adjustable"],
    },
    ({ instanceId, dimensionsMm, materialId, materialOverrides, hardwareOverrides, thicknessMm }) =>
      buildIsland(instanceId, dimensionsMm, {
        materialId,
        materialOverrides,
        hardwareOverrides,
        thicknessMm,
        handle: hardwareOverrides?.handle,
        hinge: hardwareOverrides?.hinge,
      }),
  ),
];

export const professionalKitchenModuleIds = professionalKitchenModules.map((module) => module.id);
