import type {
  Dimensions3,
  ModuleBuildResult,
  ThicknessProfileMm,
} from "../../contracts/ModuleDefinition";
import type { PartDefinition } from "../../contracts/PartDefinition";
import { HARDWARE_MATERIAL_ID, MaterialRegistry } from "../../registry/MaterialRegistry";
import { HardwareRegistry } from "../../registry/HardwareRegistry";
import {
  KITCHEN_CONFIG,
  kitchenBackMaterial,
  kitchenBodyMaterial,
  kitchenCountertopMaterial,
  kitchenFrontMaterial,
} from "./config";

const c = KITCHEN_CONFIG;

type BuildOptions = {
  materialId: string;
  thicknessMm?: ThicknessProfileMm;
  materialOverrides?: Record<string, string>;
  hardwareOverrides?: Record<string, string>;
  toeKickMm?: number;
  shelves?: number;
  doorLeaves?: 0 | 1 | 2 | 3;
  drawerCount?: number;
  handle?: string;
  hinge?: string;
  slide?: string;
  towerLayout?: "oven" | "oven-microwave" | "fridge" | "pantry";
  glass?: boolean;
};

const grainForRole = (role: PartDefinition["role"]): PartDefinition["grainDirection"] => {
  if (["door", "side-left", "side-right", "divider"].includes(role)) return "vertical";
  if (["base", "top", "shelf", "drawer-bottom", "countertop"].includes(role)) return "horizontal";
  return "none";
};

function part(
  moduleId: string,
  id: string,
  role: PartDefinition["role"],
  name: string,
  dimensionsMm: Dimensions3,
  positionMm: { x: number; y: number; z: number },
  materialId: string,
  extra: Partial<PartDefinition> = {},
): PartDefinition {
  return {
    id: `${moduleId}:${id}`,
    moduleId,
    role,
    name,
    dimensionsMm,
    positionMm,
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
    grainDirection: grainForRole(role),
    ...extra,
  };
}

function hardwareGeometryFor(hardwareId: string): PartDefinition["hardwareGeometry"] {
  const definition = HardwareRegistry.get(hardwareId);
  if (definition?.mesh3d === "gola") return { kind: "gola", lipMm: 8, recessMm: 16 };
  if (definition?.mesh3d === "cava") return { kind: "cava", lipMm: 6, recessMm: 12 };
  if (definition?.mesh3d === "profile") return { kind: "profile", radiusMm: 3 };
  if (definition?.mesh3d === "cylinder")
    return { kind: "cylinder", radiusMm: Math.max(2, definition.dimensionsMm.width / 2) };
  return { kind: "box" };
}

function hardware(
  moduleId: string,
  id: string,
  name: string,
  dimensionsMm: Dimensions3,
  positionMm: { x: number; y: number; z: number },
  hardwareId: string,
  groupId?: string,
): PartDefinition {
  return part(moduleId, id, "hardware", name, dimensionsMm, positionMm, HARDWARE_MATERIAL_ID, {
    hardwareId,
    hardwareGeometry: hardwareGeometryFor(hardwareId),
    groupId,
  });
}

function handleDimensions(
  frontWidth: number,
  hardwareId: string,
  fallback: Dimensions3,
): Dimensions3 {
  const definition = HardwareRegistry.get(hardwareId);
  if (!definition) return fallback;
  const width =
    hardwareId === "handle-gola" || hardwareId === "handle-cava"
      ? Math.max(120, Math.min(frontWidth - 24, definition.dimensionsMm.width))
      : Math.min(frontWidth * 0.65, definition.dimensionsMm.width);
  return { width, height: definition.dimensionsMm.height, depth: definition.dimensionsMm.depth };
}

function materials(options: BuildOptions) {
  const body = kitchenBodyMaterial(options.materialOverrides, options.materialId);
  const front = kitchenFrontMaterial(options.materialOverrides, options.materialId);
  const back = kitchenBackMaterial(options.materialOverrides, options.materialId);
  const countertop = kitchenCountertopMaterial(options.materialOverrides);
  return { body, front, back, countertop };
}

export function buildCarcass(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): PartDefinition[] {
  const { body, back } = materials(options);
  const panel = options.thicknessMm?.panelMm ?? c.panelMm;
  const shelf = options.thicknessMm?.shelfMm ?? panel;
  const backMm = options.thicknessMm?.backMm ?? c.backMm;
  const toe = options.toeKickMm ?? c.toeKickMm;
  const shelves = options.shelves ?? 0;
  const bodyHeight = Math.max(panel * 3, dims.height - toe);
  const innerWidth = Math.max(panel, dims.width - 2 * panel);
  const innerHeight = Math.max(panel, bodyHeight - 2 * panel);
  const parts: PartDefinition[] = [];
  const fullBand = { front: body };

  parts.push(
    part(
      moduleId,
      "side-left",
      "side-left",
      "Lateral esquerda",
      { width: panel, height: bodyHeight, depth: dims.depth },
      { x: -(dims.width - panel) / 2, y: toe + bodyHeight / 2, z: 0 },
      body,
      { edgeBanding: fullBand },
    ),
  );
  parts.push(
    part(
      moduleId,
      "side-right",
      "side-right",
      "Lateral direita",
      { width: panel, height: bodyHeight, depth: dims.depth },
      { x: (dims.width - panel) / 2, y: toe + bodyHeight / 2, z: 0 },
      body,
      { edgeBanding: fullBand },
    ),
  );
  parts.push(
    part(
      moduleId,
      "base",
      "base",
      "Base",
      { width: innerWidth, height: panel, depth: dims.depth },
      { x: 0, y: toe + panel / 2, z: 0 },
      body,
      { edgeBanding: fullBand },
    ),
  );
  parts.push(
    part(
      moduleId,
      "top",
      "top",
      "Topo",
      { width: innerWidth, height: panel, depth: dims.depth },
      { x: 0, y: dims.height - panel / 2, z: 0 },
      body,
      { edgeBanding: fullBand },
    ),
  );
  parts.push(
    part(
      moduleId,
      "back",
      "back",
      "Fundo",
      { width: innerWidth, height: innerHeight, depth: backMm },
      { x: 0, y: toe + bodyHeight / 2, z: -dims.depth / 2 + backMm / 2 },
      back,
    ),
  );

  for (let index = 0; index < shelves; index += 1) {
    const ratio = (index + 1) / (shelves + 1);
    parts.push(
      part(
        moduleId,
        `shelf-${index + 1}`,
        "shelf",
        `Prateleira ${index + 1}`,
        { width: innerWidth - 2, height: shelf, depth: Math.max(shelf, dims.depth - 20) },
        { x: 0, y: toe + panel + innerHeight * ratio, z: 10 },
        body,
        { edgeBanding: { front: body } },
      ),
    );
  }

  if (toe > 0) {
    parts.push(
      part(
        moduleId,
        "toe-kick",
        "toe-kick",
        "Rodapé",
        { width: innerWidth, height: toe, depth: panel },
        { x: 0, y: toe / 2, z: dims.depth / 2 - panel },
        HARDWARE_MATERIAL_ID,
      ),
    );
    const footWidth = Math.min(50, Math.max(30, (dims.width - panel * 2) / 8));
    const footDepth = Math.min(50, Math.max(30, (dims.depth - panel * 2) / 8));
    const footY = Math.max(25, toe - 25);
    const footX = Math.max(footWidth, dims.width / 2 - panel - footWidth / 2);
    const footZ = Math.max(footDepth, dims.depth / 2 - panel - footDepth / 2);
    const footPositions: Array<[number, number]> = [
      [-footX, -footZ],
      [footX, -footZ],
      [-footX, footZ],
      [footX, footZ],
    ];
    for (const [footXPosition, footZPosition] of footPositions) {
      parts.push(
        hardware(
          moduleId,
          `foot-${footXPosition < 0 ? "left" : "right"}-${footZPosition < 0 ? "back" : "front"}`,
          "Pé regulável",
          { width: footWidth, height: 50, depth: footDepth },
          { x: footXPosition, y: footY, z: footZPosition },
          "leg-adjustable",
        ),
      );
    }
  }
  return parts;
}

export function buildDoors(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): PartDefinition[] {
  const { front } = materials(options);
  const doorMm = options.thicknessMm?.doorMm ?? options.thicknessMm?.panelMm ?? c.panelMm;
  const leaves = options.doorLeaves ?? 2;
  if (!leaves) return [];
  const toe = options.toeKickMm ?? c.toeKickMm;
  const doorHeight = Math.max(c.panelMm * 2, dims.height - toe - c.doorGapMm * 2);
  const totalWidth = dims.width - c.doorGapMm * 2;
  const doorWidth = leaves === 1 ? totalWidth : totalWidth / leaves - c.doorGapMm;
  const hingeId = options.hinge ?? "hinge-soft-close";
  const handleId = options.handle ?? "handle-bar";
  const parts: PartDefinition[] = [];

  for (let index = 0; index < leaves; index += 1) {
    const hingeSide: "left" | "right" =
      leaves === 1 ? "left" : index < Math.ceil(leaves / 2) ? "left" : "right";
    const x =
      leaves === 1 ? 0 : -totalWidth / 2 + doorWidth / 2 + index * (doorWidth + c.doorGapMm);
    const doorId = `door-${index + 1}`;
    const groupId = `${moduleId}:${doorId}`;
    parts.push(
      part(
        moduleId,
        doorId,
        "door",
        `Porta ${index + 1}`,
        { width: doorWidth, height: doorHeight, depth: doorMm },
        { x, y: toe + c.doorGapMm + doorHeight / 2, z: dims.depth / 2 + doorMm / 2 },
        front,
        {
          edgeBanding: { top: front, bottom: front, left: front, right: front },
          pivotMm: {
            x: x + (hingeSide === "left" ? -doorWidth / 2 : doorWidth / 2),
            y: toe + c.doorGapMm + doorHeight / 2,
            z: dims.depth / 2 + doorMm / 2,
          },
          groupId,
          hardwareId: hingeId,
          interactive: { type: "door", hingeSide, maxOpenAngleDeg: 95 },
        },
      ),
    );
    parts.push(
      hardware(
        moduleId,
        `${doorId}:hinge`,
        "Dobradiça",
        { width: 35, height: 70, depth: 16 },
        {
          x: x + (hingeSide === "left" ? -doorWidth / 2 + 35 : doorWidth / 2 - 35),
          y: toe + doorHeight / 2,
          z: dims.depth / 2 + doorMm,
        },
        hingeId,
        groupId,
      ),
    );
    if (handleId !== "handle-none") {
      const handleSize = handleDimensions(doorWidth, handleId, {
        width: 160,
        height: 24,
        depth: 30,
      });
      const isContinuous = handleId === "handle-gola" || handleId === "handle-cava";
      const handleX = isContinuous
        ? x
        : x +
          (hingeSide === "left"
            ? doorWidth / 2 - handleSize.width / 2 - 30
            : -doorWidth / 2 + handleSize.width / 2 + 30);
      const handleY = isContinuous
        ? toe + c.doorGapMm + doorHeight - handleSize.height / 2 - 10
        : toe + doorHeight / 2;
      parts.push(
        hardware(
          moduleId,
          `${doorId}:handle`,
          isContinuous ? "Puxador contínuo" : "Puxador",
          handleSize,
          { x: handleX, y: handleY, z: dims.depth / 2 + doorMm * 1.5 },
          handleId,
          groupId,
        ),
      );
    }
  }
  return parts;
}

export function buildDrawers(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): PartDefinition[] {
  const { front, body } = materials(options);
  const panel = options.thicknessMm?.panelMm ?? c.panelMm;
  const doorMm = options.thicknessMm?.doorMm ?? panel;
  const backMm = options.thicknessMm?.backMm ?? c.backMm;
  const count = Math.max(1, options.drawerCount ?? 3);
  const toe = options.toeKickMm ?? c.toeKickMm;
  const usable = Math.max(panel * 3, dims.height - toe - panel - c.drawerGapMm);
  const frontHeight = Math.max(80, usable / count - c.drawerGapMm);
  const frontWidth = dims.width - c.drawerGapMm * 2;
  const boxWidth = Math.max(panel * 2, dims.width - 2 * panel - 26);
  const boxDepth = Math.max(100, dims.depth - 60);
  const travel = Math.round(boxDepth * 0.85);
  const slideId = options.slide ?? "slide-hidden-soft-close";
  const handleId = options.handle ?? "handle-bar";
  const parts: PartDefinition[] = [];

  for (let index = 0; index < count; index += 1) {
    const groupId = `${moduleId}:drawer-${index + 1}`;
    const centerY = toe + panel + frontHeight / 2 + index * (frontHeight + c.drawerGapMm);
    parts.push(
      part(
        moduleId,
        `drawer-${index + 1}:front`,
        "drawer-front",
        `Frente gaveta ${index + 1}`,
        { width: frontWidth, height: frontHeight, depth: doorMm },
        { x: 0, y: centerY, z: dims.depth / 2 + doorMm / 2 },
        front,
        {
          groupId,
          hardwareId: handleId,
          edgeBanding: { top: front, bottom: front, left: front, right: front },
          interactive: { type: "drawer", maxTravelMm: travel },
        },
      ),
    );
    parts.push(
      part(
        moduleId,
        `drawer-${index + 1}:side-left`,
        "drawer-side",
        `Lateral gaveta ${index + 1} esquerda`,
        { width: 15, height: Math.max(80, frontHeight - 40), depth: boxDepth },
        { x: -boxWidth / 2, y: centerY, z: 10 },
        body,
        { groupId, hardwareId: slideId, interactive: { type: "drawer", maxTravelMm: travel } },
      ),
    );
    parts.push(
      part(
        moduleId,
        `drawer-${index + 1}:side-right`,
        "drawer-side",
        `Lateral gaveta ${index + 1} direita`,
        { width: 15, height: Math.max(80, frontHeight - 40), depth: boxDepth },
        { x: boxWidth / 2, y: centerY, z: 10 },
        body,
        { groupId, hardwareId: slideId, interactive: { type: "drawer", maxTravelMm: travel } },
      ),
    );
    parts.push(
      part(
        moduleId,
        `drawer-${index + 1}:back`,
        "back",
        `Traseira gaveta ${index + 1}`,
        { width: boxWidth, height: Math.max(80, frontHeight - 40), depth: panel },
        { x: 0, y: centerY, z: -boxDepth / 2 },
        body,
        { groupId, interactive: { type: "drawer", maxTravelMm: travel } },
      ),
    );
    parts.push(
      part(
        moduleId,
        `drawer-${index + 1}:bottom`,
        "drawer-bottom",
        `Fundo gaveta ${index + 1}`,
        { width: boxWidth - 15, height: backMm, depth: boxDepth },
        { x: 0, y: centerY - Math.max(80, frontHeight - 40) / 2, z: 10 },
        body,
        { groupId, hardwareId: slideId, interactive: { type: "drawer", maxTravelMm: travel } },
      ),
    );
    parts.push(
      hardware(
        moduleId,
        `drawer-${index + 1}:slide-left`,
        "Corrediça esquerda",
        { width: 14, height: 48, depth: boxDepth },
        { x: -boxWidth / 2, y: centerY, z: 0 },
        slideId,
        groupId,
      ),
    );
    parts.push(
      hardware(
        moduleId,
        `drawer-${index + 1}:slide-right`,
        "Corrediça direita",
        { width: 14, height: 48, depth: boxDepth },
        { x: boxWidth / 2, y: centerY, z: 0 },
        slideId,
        groupId,
      ),
    );
    if (handleId !== "handle-none") {
      const handleSize = handleDimensions(frontWidth, handleId, {
        width: Math.min(320, frontWidth * 0.5),
        height: 22,
        depth: 28,
      });
      const isContinuous = handleId === "handle-gola" || handleId === "handle-cava";
      const handleY = isContinuous
        ? centerY + frontHeight / 2 - handleSize.height / 2 - 10
        : centerY;
      parts.push(
        hardware(
          moduleId,
          `drawer-${index + 1}:handle`,
          isContinuous ? "Puxador contínuo" : "Puxador",
          handleSize,
          { x: 0, y: handleY, z: dims.depth / 2 + doorMm * 1.5 },
          handleId,
          groupId,
        ),
      );
    }
  }
  return parts;
}

export function buildBase(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const parts = [
    ...buildCarcass(moduleId, dims, options),
    ...buildDoors(moduleId, dims, options),
    ...(options.drawerCount && options.drawerCount > 0
      ? buildDrawers(moduleId, dims, options)
      : []),
  ];
  return {
    parts,
    boundingBoxMm: dims,
    hardwareIds: [
      options.hinge ?? "hinge-soft-close",
      options.slide ?? "slide-hidden-soft-close",
      options.handle ?? "handle-bar",
      "leg-adjustable",
    ],
    warnings: [],
  };
}

export function buildUpper(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions & { flap?: boolean; niche?: boolean },
): ModuleBuildResult {
  const upperOptions = {
    ...options,
    toeKickMm: 0,
    shelves: options.shelves ?? (options.niche ? 2 : 1),
  };
  const parts = buildCarcass(moduleId, dims, upperOptions);
  if (!options.niche) parts.push(...buildDoors(moduleId, dims, upperOptions));
  if (options.glass) {
    const glassWidth = (dims.width - c.doorGapMm * 3) / 2;
    for (let index = 0; index < 2; index += 1) {
      const x = -dims.width / 2 + c.doorGapMm + glassWidth / 2 + index * (glassWidth + c.doorGapMm);
      parts.push(
        part(
          moduleId,
          `glass-door-${index + 1}`,
          "door",
          `Porta de vidro ${index + 1}`,
          { width: glassWidth, height: dims.height - c.doorGapMm * 2, depth: c.panelMm },
          { x, y: dims.height / 2, z: dims.depth / 2 + c.panelMm / 2 },
          "glass-clear",
          {
            edgeBanding: {
              top: "mdf-freijo",
              bottom: "mdf-freijo",
              left: "mdf-freijo",
              right: "mdf-freijo",
            },
            groupId: `${moduleId}:glass-door-${index + 1}`,
          },
        ),
      );
    }
  }
  if (options.flap) {
    parts.push(
      part(
        moduleId,
        "flap",
        "door",
        "Basculante",
        {
          width: dims.width - c.doorGapMm * 2,
          height: dims.height - c.doorGapMm * 2,
          depth: c.panelMm,
        },
        { x: 0, y: dims.height / 2, z: dims.depth / 2 + c.panelMm / 2 },
        materials(options).front,
        {
          groupId: `${moduleId}:flap`,
          hardwareId: "piston-gas",
          pivotMm: { x: 0, y: dims.height - c.doorGapMm, z: dims.depth / 2 + c.panelMm / 2 },
          interactive: { type: "flap", hingeSide: "left", maxOpenAngleDeg: 100 },
        },
      ),
    );
  }
  return {
    parts,
    boundingBoxMm: dims,
    hardwareIds: [
      options.hinge ?? "hinge-soft-close",
      options.handle ?? "handle-bar",
      options.flap ? "piston-gas" : "hinge-standard",
    ],
    warnings: [],
  };
}

export function buildCountertop(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const { countertop } = materials(options);
  const countertopDefinition = MaterialRegistry.get(countertop);
  const thickness = countertopDefinition?.stone?.thicknessMm ?? c.countertopThicknessMm;
  const parts = [
    part(
      moduleId,
      "countertop",
      "countertop",
      "Bancada",
      {
        width: dims.width + c.countertopOverhangMm * 2,
        height: thickness,
        depth: dims.depth + c.countertopOverhangMm,
      },
      { x: 0, y: dims.height + thickness / 2, z: 0 },
      countertop,
      {
        edgeBanding: { front: countertop, left: countertop, right: countertop },
        grainDirection: "horizontal",
      },
    ),
  ];
  return {
    parts,
    boundingBoxMm: {
      width: dims.width + c.countertopOverhangMm * 2,
      height: thickness,
      depth: dims.depth + c.countertopOverhangMm,
    },
    hardwareIds: [],
    warnings: [],
  };
}

export function buildComplement(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions & { role?: PartDefinition["role"]; name?: string },
): ModuleBuildResult {
  const { body } = materials(options);
  const role = options.role ?? "decorative";
  const parts = [
    part(
      moduleId,
      "panel",
      role,
      options.name ?? "Complemento",
      dims,
      { x: 0, y: dims.height / 2, z: 0 },
      body,
      { edgeBanding: { front: body } },
    ),
  ];
  return { parts, boundingBoxMm: dims, hardwareIds: [], warnings: [] };
}

export function buildIsland(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const base = buildBase(moduleId, dims, { ...options, toeKickMm: c.toeKickMm });
  const countertop = buildCountertop(`${moduleId}:countertop`, dims, options);
  return {
    parts: [...base.parts, ...countertop.parts],
    boundingBoxMm: dims,
    hardwareIds: [...base.hardwareIds],
    warnings: [],
  };
}

export function buildCorner(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const { body } = materials(options);
  const inner = Math.max(c.panelMm * 2, dims.width - c.panelMm);
  const parts = [
    part(
      moduleId,
      "side-left",
      "side-left",
      "Lateral esquerda do canto",
      { width: c.panelMm, height: dims.height - c.toeKickMm, depth: dims.depth },
      { x: -(dims.width - c.panelMm) / 2, y: c.toeKickMm + (dims.height - c.toeKickMm) / 2, z: 0 },
      body,
    ),
    part(
      moduleId,
      "side-right",
      "side-right",
      "Lateral direita do canto",
      { width: c.panelMm, height: dims.height - c.toeKickMm, depth: inner },
      { x: 0, y: c.toeKickMm + (dims.height - c.toeKickMm) / 2, z: (dims.depth - inner) / 2 },
      body,
    ),
    part(
      moduleId,
      "base",
      "base",
      "Base em L",
      { width: dims.width, height: c.panelMm, depth: dims.depth },
      { x: -c.panelMm / 2, y: c.toeKickMm + c.panelMm / 2, z: 0 },
      body,
    ),
    part(
      moduleId,
      "door",
      "door",
      "Porta de canto",
      {
        width: dims.width - c.panelMm * 2,
        height: dims.height - c.toeKickMm - c.panelMm * 2,
        depth: c.panelMm,
      },
      { x: 0, y: c.toeKickMm + (dims.height - c.toeKickMm) / 2, z: dims.depth / 2 + c.panelMm / 2 },
      materials(options).front,
      {
        groupId: `${moduleId}:door`,
        hardwareId: options.hinge ?? "hinge-soft-close",
        pivotMm: {
          x: -(dims.width - c.panelMm * 2) / 2,
          y: c.toeKickMm + (dims.height - c.toeKickMm) / 2,
          z: dims.depth / 2 + c.panelMm / 2,
        },
        interactive: { type: "door", hingeSide: "left", maxOpenAngleDeg: 95 },
      },
    ),
  ];
  const footWidth = 42;
  const footDepth = 42;
  const footY = Math.max(25, c.toeKickMm - 25);
  const footPositions: Array<[number, number]> = [
    [-(dims.width / 2 - c.panelMm - footWidth / 2), -(dims.depth / 2 - c.panelMm - footDepth / 2)],
    [dims.width / 2 - c.panelMm - footWidth / 2, -(dims.depth / 2 - c.panelMm - footDepth / 2)],
    [-(dims.width / 2 - c.panelMm - footWidth / 2), dims.depth / 2 - c.panelMm - footDepth / 2],
    [dims.width / 2 - c.panelMm - footWidth / 2, dims.depth / 2 - c.panelMm - footDepth / 2],
  ];
  footPositions.forEach(([x, z], index) => {
    parts.push(
      hardware(
        moduleId,
        `foot-${index + 1}`,
        "Pé regulável de canto",
        { width: footWidth, height: 50, depth: footDepth },
        { x, y: footY, z },
        "leg-adjustable",
      ),
    );
  });
  return {
    parts,
    boundingBoxMm: dims,
    hardwareIds: [
      options.hinge ?? "hinge-soft-close",
      options.handle ?? "handle-bar",
      "leg-adjustable",
    ],
    warnings: [],
  };
}

export function buildSink(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const base = buildBase(moduleId, dims, { ...options, doorLeaves: 2, drawerCount: 0 });
  const sinkWidth = Math.min(dims.width - c.panelMm * 2, 600);
  const sinkDepth = Math.min(dims.depth - c.panelMm * 2, 480);
  const rim = 18;
  const basinDepth = Math.max(220, sinkDepth - rim * 2);
  const basinHeight = 165;
  const basinY = dims.height - c.panelMm - basinHeight / 2;
  const plumbingZoneDepth = Math.max(180, sinkDepth - 40);
  base.parts.push(
    part(
      moduleId,
      "sink-basin",
      "decorative",
      "Zona técnica da cuba — Cuba inox",
      { width: sinkWidth - rim * 2, height: basinHeight, depth: basinDepth },
      { x: 0, y: basinY, z: 0 },
      "metal-inox",
      { volumeType: "technical" },
    ),
    part(
      moduleId,
      "sink-siphon-zone",
      "decorative",
      "Zona técnica do sifão",
      { width: sinkWidth - rim * 2, height: 240, depth: plumbingZoneDepth },
      { x: 0, y: 240, z: -20 },
      "metal-black",
      { volumeType: "technical" },
    ),
    part(
      moduleId,
      "sink-plumbing-recess",
      "back",
      "Recuo técnico da hidráulica",
      { width: sinkWidth - rim * 2, height: 420, depth: 180 },
      { x: 0, y: 300, z: -dims.depth / 2 + 90 },
      "metal-black",
      { volumeType: "technical" },
    ),
    part(
      moduleId,
      "sink-rim-front",
      "hardware",
      "Aro frontal da cuba",
      { width: sinkWidth, height: rim, depth: rim },
      { x: 0, y: dims.height - c.panelMm - rim / 2, z: sinkDepth / 2 - rim / 2 },
      "metal-inox",
      { hardwareId: "sink-bowl" },
    ),
    part(
      moduleId,
      "sink-rim-back",
      "hardware",
      "Aro traseiro da cuba",
      { width: sinkWidth, height: rim, depth: rim },
      { x: 0, y: dims.height - c.panelMm - rim / 2, z: -sinkDepth / 2 + rim / 2 },
      "metal-inox",
      { hardwareId: "sink-bowl" },
    ),
    part(
      moduleId,
      "sink-rim-left",
      "hardware",
      "Aro esquerdo da cuba",
      { width: rim, height: rim, depth: basinDepth },
      { x: -sinkWidth / 2 + rim / 2, y: dims.height - c.panelMm - rim / 2, z: 0 },
      "metal-inox",
      { hardwareId: "sink-bowl" },
    ),
    part(
      moduleId,
      "sink-rim-right",
      "hardware",
      "Aro direito da cuba",
      { width: rim, height: rim, depth: basinDepth },
      { x: sinkWidth / 2 - rim / 2, y: dims.height - c.panelMm - rim / 2, z: 0 },
      "metal-inox",
      { hardwareId: "sink-bowl" },
    ),
  );
  return {
    ...base,
    warnings: ["Cuba estrutural composta por bacia, aro e zona técnica de sifão."],
  };
}

export function buildCooktop(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions,
): ModuleBuildResult {
  const base = buildBase(moduleId, dims, { ...options, doorLeaves: 0, drawerCount: 2 });
  const cutoutWidth = Math.min(dims.width - c.panelMm * 2, 720);
  const cutoutDepth = Math.min(dims.depth - c.panelMm * 2, 500);
  const plateY = dims.height - 8;
  const trim = 24;
  base.parts.push(
    part(
      moduleId,
      "cooktop-plate",
      "decorative",
      "Recorte técnico do cooktop — Placa técnica",
      { width: cutoutWidth, height: 8, depth: cutoutDepth },
      { x: 0, y: plateY, z: 0 },
      "metal-black",
      { volumeType: "technical" },
    ),
    part(
      moduleId,
      "cooktop-trim-front",
      "hardware",
      "Moldura frontal do cooktop",
      { width: cutoutWidth + trim * 2, height: 10, depth: trim },
      { x: 0, y: plateY + 2, z: cutoutDepth / 2 - trim / 2 },
      "metal-black",
    ),
    part(
      moduleId,
      "cooktop-trim-back",
      "hardware",
      "Moldura traseira do cooktop",
      { width: cutoutWidth + trim * 2, height: 10, depth: trim },
      { x: 0, y: plateY + 2, z: -cutoutDepth / 2 + trim / 2 },
      "metal-black",
    ),
    part(
      moduleId,
      "cooktop-trim-left",
      "hardware",
      "Moldura esquerda do cooktop",
      { width: trim, height: 10, depth: cutoutDepth },
      { x: -cutoutWidth / 2 - trim / 2, y: plateY + 2, z: 0 },
      "metal-black",
    ),
    part(
      moduleId,
      "cooktop-trim-right",
      "hardware",
      "Moldura direita do cooktop",
      { width: trim, height: 10, depth: cutoutDepth },
      { x: cutoutWidth / 2 + trim / 2, y: plateY + 2, z: 0 },
      "metal-black",
    ),
  );
  const burnerPositions: Array<[number, number]> = [
    [-cutoutWidth * 0.27, -cutoutDepth * 0.25],
    [cutoutWidth * 0.27, -cutoutDepth * 0.25],
    [-cutoutWidth * 0.27, cutoutDepth * 0.25],
    [cutoutWidth * 0.27, cutoutDepth * 0.25],
  ];
  burnerPositions.forEach(([x, z], index) => {
    const diameter = index % 2 === 0 ? 150 : 190;
    base.parts.push(
      part(
        moduleId,
        `cooktop-burner-${index + 1}`,
        "decorative",
        `Queimador ${index + 1}`,
        { width: diameter, height: 5, depth: diameter },
        { x, y: plateY + 7, z },
        "metal-black",
        { volumeType: "technical" },
      ),
    );
  });
  return {
    ...base,
    warnings: ["Cooktop estrutural composto por placa técnica, moldura e quatro queimadores."],
  };
}

export function buildTower(
  moduleId: string,
  dims: Dimensions3,
  options: BuildOptions & { appliance?: "oven" | "microwave" | "fridge" },
): ModuleBuildResult {
  const { body, front } = materials(options);
  const layout = options.towerLayout ?? (options.appliance === "fridge" ? "fridge" : "oven");
  const toe = c.toeKickMm;
  const innerWidth = Math.max(c.panelMm, dims.width - 2 * c.panelMm);
  const innerDepth = Math.max(c.panelMm, dims.depth - 2 * c.panelMm);
  const parts = buildCarcass(moduleId, dims, {
    ...options,
    toeKickMm: toe,
    shelves: layout === "pantry" ? 3 : 0,
  });
  const addTechnicalNiche = (id: string, name: string, height: number, centerY: number) => {
    parts.push(
      part(
        moduleId,
        id,
        "decorative",
        name,
        { width: innerWidth, height, depth: innerDepth },
        { x: 0, y: centerY, z: 0 },
        body,
        { volumeType: "technical" },
      ),
    );
  };

  if (layout === "fridge") {
    addTechnicalNiche(
      "appliance-niche",
      "Nicho técnico da geladeira",
      dims.height - toe - c.panelMm * 2,
      toe + (dims.height - toe) / 2,
    );
  } else if (layout === "oven-microwave") {
    const lowerHeight = 600;
    const upperHeight = 500;
    const dividerY = toe + c.panelMm + lowerHeight;
    addTechnicalNiche(
      "oven-niche",
      "Nicho técnico do forno",
      lowerHeight,
      toe + c.panelMm + lowerHeight / 2,
    );
    addTechnicalNiche(
      "microwave-niche",
      "Nicho técnico do micro-ondas",
      upperHeight,
      dividerY + c.panelMm + upperHeight / 2,
    );
    parts.push(
      part(
        moduleId,
        "appliance-divider",
        "divider",
        "Divisória entre forno e micro-ondas",
        { width: innerWidth, height: c.panelMm, depth: innerDepth },
        { x: 0, y: dividerY, z: 0 },
        body,
        { edgeBanding: { front: body } },
      ),
    );
  } else {
    const nicheHeight =
      layout === "pantry" ? Math.max(300, dims.height - toe - c.panelMm * 2) : 600;
    addTechnicalNiche(
      "appliance-niche",
      layout === "pantry" ? "Nicho interno da despensa" : "Nicho técnico do forno",
      nicheHeight,
      toe + c.panelMm + nicheHeight / 2,
    );
    if (layout === "oven") {
      parts.push(
        part(
          moduleId,
          "oven-shelf",
          "shelf",
          "Prateleira de apoio do forno",
          { width: innerWidth - 2, height: c.panelMm, depth: innerDepth - 20 },
          { x: 0, y: toe + c.panelMm + nicheHeight + c.panelMm, z: 10 },
          body,
          { edgeBanding: { front: body } },
        ),
      );
    }
  }

  const lowerDoorHeight = layout === "fridge" ? 300 : Math.max(300, dims.height - 700 - toe);
  parts.push(
    ...buildDoors(
      moduleId,
      { ...dims, height: lowerDoorHeight },
      { ...options, toeKickMm: 0, doorLeaves: 2, materialId: front },
    ),
  );
  return {
    parts,
    boundingBoxMm: dims,
    hardwareIds: [options.hinge ?? "hinge-soft-close", options.handle ?? "handle-bar"],
    warnings: [],
  };
}
