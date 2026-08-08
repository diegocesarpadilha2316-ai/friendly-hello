import type { PartDefinition } from "../../contracts/PartDefinition";
import type { Dimensions3 } from "../../contracts/ModuleDefinition";
import { HARDWARE_MATERIAL_ID } from "../../registry/MaterialRegistry";

export const PANEL_MM = 18;
export const BACK_MM = 6;
export const FRONT_GAP_MM = 3;

export interface CarcassOptions {
  toeKickMm?: number;
  shelves?: number;
}

/** Gera a caixa real do módulo (laterais, base, topo, fundo, prateleiras, rodapé). */
export function buildCarcass(
  moduleId: string,
  dims: Dimensions3,
  materialId: string,
  options: CarcassOptions = {}
): PartDefinition[] {
  const toe = options.toeKickMm ?? 0;
  const shelves = options.shelves ?? 0;
  const bodyHeight = dims.height - toe;
  const innerWidth = dims.width - 2 * PANEL_MM;
  const parts: PartDefinition[] = [];

  const banding = { top: materialId, bottom: materialId, left: materialId, right: materialId };

  parts.push({
    id: `${moduleId}:side-left`,
    moduleId,
    role: "side-left",
    name: "Lateral esquerda",
    dimensionsMm: { width: PANEL_MM, height: bodyHeight, depth: dims.depth },
    positionMm: { x: -(dims.width - PANEL_MM) / 2, y: toe + bodyHeight / 2, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
    edgeBanding: banding,
  });

  parts.push({
    id: `${moduleId}:side-right`,
    moduleId,
    role: "side-right",
    name: "Lateral direita",
    dimensionsMm: { width: PANEL_MM, height: bodyHeight, depth: dims.depth },
    positionMm: { x: (dims.width - PANEL_MM) / 2, y: toe + bodyHeight / 2, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
    edgeBanding: banding,
  });

  parts.push({
    id: `${moduleId}:base`,
    moduleId,
    role: "base",
    name: "Base",
    dimensionsMm: { width: innerWidth, height: PANEL_MM, depth: dims.depth },
    positionMm: { x: 0, y: toe + PANEL_MM / 2, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
    edgeBanding: banding,
  });

  parts.push({
    id: `${moduleId}:top`,
    moduleId,
    role: "top",
    name: "Topo",
    dimensionsMm: { width: innerWidth, height: PANEL_MM, depth: dims.depth },
    positionMm: { x: 0, y: dims.height - PANEL_MM / 2, z: 0 },
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
    edgeBanding: banding,
  });

  parts.push({
    id: `${moduleId}:back`,
    moduleId,
    role: "back",
    name: "Fundo",
    dimensionsMm: {
      width: innerWidth,
      height: bodyHeight - 2 * PANEL_MM,
      depth: BACK_MM,
    },
    positionMm: {
      x: 0,
      y: toe + bodyHeight / 2,
      z: -dims.depth / 2 + BACK_MM / 2,
    },
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId,
  });

  const usableBottom = toe + PANEL_MM;
  const usableTop = dims.height - PANEL_MM;
  for (let index = 0; index < shelves; index += 1) {
    const ratio = (index + 1) / (shelves + 1);
    parts.push({
      id: `${moduleId}:shelf-${index + 1}`,
      moduleId,
      role: "shelf",
      name: `Prateleira ${index + 1}`,
      dimensionsMm: { width: innerWidth - 2, height: PANEL_MM, depth: dims.depth - 20 },
      positionMm: {
        x: 0,
        y: usableBottom + (usableTop - usableBottom) * ratio,
        z: 10,
      },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId,
      edgeBanding: { top: materialId },
    });
  }

  if (toe > 0) {
    parts.push({
      id: `${moduleId}:toe-kick`,
      moduleId,
      role: "toe-kick",
      name: "Rodapé",
      dimensionsMm: { width: innerWidth, height: toe, depth: PANEL_MM },
      positionMm: { x: 0, y: toe / 2, z: dims.depth / 2 - 60 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId: HARDWARE_MATERIAL_ID,
    });
  }

  return parts;
}

/** Puxador simples (peça de ferragem visível). */
export function buildHandle(
  moduleId: string,
  id: string,
  positionMm: { x: number; y: number; z: number },
  widthMm: number,
  vertical = false
): PartDefinition {
  return {
    id,
    moduleId,
    role: "hardware",
    name: "Puxador",
    dimensionsMm: vertical
      ? { width: 22, height: widthMm, depth: 28 }
      : { width: widthMm, height: 22, depth: 28 },
    positionMm,
    rotationDeg: { x: 0, y: 0, z: 0 },
    materialId: HARDWARE_MATERIAL_ID,
  };
}

/** Portas duplas ou simples com dobradiça real e puxador. */
export function buildDoors(
  moduleId: string,
  dims: Dimensions3,
  materialId: string,
  options: { toeKickMm?: number; leaves?: 1 | 2 }
): PartDefinition[] {
  const toe = options.toeKickMm ?? 0;
  const leaves = options.leaves ?? 2;
  const doorHeight = dims.height - toe - FRONT_GAP_MM * 2;
  const doorZ = dims.depth / 2 + PANEL_MM / 2;
  const totalWidth = dims.width - FRONT_GAP_MM * 2;
  const doorWidth = leaves === 2 ? totalWidth / 2 - 1.5 : totalWidth;
  const parts: PartDefinition[] = [];

  for (let index = 0; index < leaves; index += 1) {
    const hingeSide: "left" | "right" = leaves === 1 ? "left" : index === 0 ? "left" : "right";
    const x =
      leaves === 1 ? 0 : index === 0 ? -(doorWidth / 2 + 1.5) : doorWidth / 2 + 1.5;
    const doorId = `${moduleId}:part-interactive-door-${index + 1}`;
    parts.push({

      id: doorId,
      moduleId,
      role: "door",
      name: `Porta ${hingeSide === "left" ? "esquerda" : "direita"}`,
      dimensionsMm: { width: doorWidth, height: doorHeight, depth: PANEL_MM },
      positionMm: { x, y: toe + FRONT_GAP_MM + doorHeight / 2, z: doorZ },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId,
      edgeBanding: {
        top: materialId,
        bottom: materialId,
        left: materialId,
        right: materialId,
      },
      groupId: doorId,
      interactive: { type: "door", hingeSide, maxOpenAngleDeg: 95 },
    });

    const handleX = hingeSide === "left" ? x + doorWidth / 2 - 45 : x - doorWidth / 2 + 45;
    parts.push({
      ...buildHandle(
        moduleId,
        `${doorId}:handle`,
        { x: handleX, y: toe + FRONT_GAP_MM + doorHeight / 2, z: doorZ + PANEL_MM },
        Math.min(240, doorHeight * 0.4),
        true
      ),
      groupId: doorId,
    });
  }

  return parts;
}

/** Gavetas reais: frente, laterais e fundo, com curso de abertura. */
export function buildDrawers(
  moduleId: string,
  dims: Dimensions3,
  materialId: string,
  options: { toeKickMm?: number; count: number }
): PartDefinition[] {
  const toe = options.toeKickMm ?? 0;
  const count = options.count;
  const zone = dims.height - toe - PANEL_MM - FRONT_GAP_MM;
  const frontHeight = zone / count - FRONT_GAP_MM;
  const frontWidth = dims.width - FRONT_GAP_MM * 2;
  const frontZ = dims.depth / 2 + PANEL_MM / 2;
  const boxWidth = dims.width - 2 * PANEL_MM - 26;
  const boxDepth = dims.depth - 60;
  const travel = Math.round(boxDepth * 0.85);
  const parts: PartDefinition[] = [];

  for (let index = 0; index < count; index += 1) {
    const groupId = `${moduleId}:part-interactive-${index + 1}`;
    const centerY = toe + PANEL_MM + frontHeight / 2 + index * (frontHeight + FRONT_GAP_MM);

    parts.push({
      id: `${groupId}:front`,
      moduleId,
      role: "drawer-front",
      name: `Frente gaveta ${index + 1}`,
      dimensionsMm: { width: frontWidth, height: frontHeight, depth: PANEL_MM },
      positionMm: { x: 0, y: centerY, z: frontZ },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId,
      edgeBanding: {
        top: materialId,
        bottom: materialId,
        left: materialId,
        right: materialId,
      },
      groupId,
      interactive: { type: "drawer", maxTravelMm: travel },
    });

    parts.push({
      ...buildHandle(
        moduleId,
        `${groupId}:handle`,
        { x: 0, y: centerY + frontHeight / 2 - 40, z: frontZ + PANEL_MM },
        Math.min(320, frontWidth * 0.5)
      ),
      groupId,
    });

    (["left", "right"] as const).forEach((side) => {
      parts.push({
        id: `${groupId}:side-${side}`,
        moduleId,
        role: "drawer-side",
        name: `Lateral gaveta ${index + 1} (${side === "left" ? "esq." : "dir."})`,
        dimensionsMm: { width: 15, height: Math.max(80, frontHeight - 40), depth: boxDepth },

        positionMm: {
          x: side === "left" ? -boxWidth / 2 : boxWidth / 2,
          y: centerY,
          z: 10,
        },
        rotationDeg: { x: 0, y: 0, z: 0 },
        materialId,
        groupId,
        interactive: { type: "drawer", maxTravelMm: travel },
      });
    });

    parts.push({
      id: `${groupId}:bottom`,
      moduleId,
      role: "drawer-bottom",
      name: `Fundo gaveta ${index + 1}`,
      dimensionsMm: { width: boxWidth - 15, height: BACK_MM, depth: boxDepth },
      positionMm: {
        x: 0,
        y: centerY - Math.max(80, frontHeight - 40) / 2 + BACK_MM / 2,
        z: 10,
      },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId,
      groupId,
      interactive: { type: "drawer", maxTravelMm: travel },
    });
  }

  return parts;
}