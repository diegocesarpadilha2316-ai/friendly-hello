import type { ModuleDefinition } from "../contracts/ModuleDefinition";
import type { Dimensions3 } from "../contracts/ModuleDefinition";
import type { PartDefinition } from "../contracts/PartDefinition";
import type { ValidationIssue, ValidationResult } from "../contracts/ValidationResult";
import { MaterialRegistry } from "../registry/MaterialRegistry";
import { HardwareRegistry } from "../registry/HardwareRegistry";

export interface RoomBoundsMm {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

export interface ValidateModuleInput {
  definition: ModuleDefinition;
  dimensionsMm: Dimensions3;
  parts: PartDefinition[];
  hardwareIds?: string[];
  positionMm?: { x: number; y: number; z: number };
  room?: RoomBoundsMm;
}

const TOLERANCE_MM = 2;

export function validateModule(input: ValidateModuleInput): ValidationResult {
  const { definition, dimensionsMm, parts, hardwareIds = [], positionMm, room } = input;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  (["width", "height", "depth"] as const).forEach((axis) => {
    const value = dimensionsMm[axis];
    if (value < definition.minDimensionsMm[axis]) {
      errors.push({
        code: "dimension-below-min",
        message: `${axis} ${value}mm abaixo do mínimo (${definition.minDimensionsMm[axis]}mm).`,
      });
    }
    if (value > definition.maxDimensionsMm[axis]) {
      errors.push({
        code: "dimension-above-max",
        message: `${axis} ${value}mm acima do máximo (${definition.maxDimensionsMm[axis]}mm).`,
      });
    }
  });

  if (parts.length === 0) {
    errors.push({ code: "no-parts", message: "Módulo não gerou nenhuma peça física." });
  }

  const seen = new Set<string>();
  parts.forEach((part) => {
    if (seen.has(part.id)) {
      errors.push({ code: "duplicate-part-id", message: `ID duplicado: ${part.id}`, partId: part.id });
    }
    seen.add(part.id);

    const { width, height, depth } = part.dimensionsMm;
    if (width <= 0 || height <= 0 || depth <= 0) {
      errors.push({
        code: "invalid-part-dimension",
        message: `Peça ${part.name} possui dimensão zero ou negativa.`,
        partId: part.id,
      });
    }

    if (!MaterialRegistry.has(part.materialId)) {
      errors.push({
        code: "invalid-material",
        message: `Material inválido em ${part.name}: ${part.materialId}`,
        partId: part.id,
      });
    }

    if (part.interactive?.type === "door" && !part.interactive.hingeSide) {
      errors.push({
        code: "door-without-hinge",
        message: `Porta ${part.name} sem pivô definido.`,
        partId: part.id,
      });
    }
    if (part.interactive?.type === "drawer" && !part.interactive.maxTravelMm) {
      errors.push({
        code: "drawer-without-travel",
        message: `Gaveta ${part.name} sem curso definido.`,
        partId: part.id,
      });
    }

    const bottom = part.positionMm.y - height / 2;
    if (bottom < -TOLERANCE_MM) {
      errors.push({
        code: "part-below-floor",
        message: `Peça ${part.name} abaixo da base do módulo.`,
        partId: part.id,
      });
    }

    const outsideX = Math.abs(part.positionMm.x) + width / 2 > dimensionsMm.width / 2 + TOLERANCE_MM;
    const outsideY = part.positionMm.y + height / 2 > dimensionsMm.height + TOLERANCE_MM;
    const outsideZ = Math.abs(part.positionMm.z) + depth / 2 > dimensionsMm.depth / 2 + TOLERANCE_MM * 2;
    if ((outsideX || outsideY || outsideZ) && part.role !== "hardware") {
      warnings.push({
        code: "part-outside-module",
        message: `Peça ${part.name} excede o envelope do módulo.`,
        partId: part.id,
      });
    }
  });

  hardwareIds.forEach((id) => {
    if (!HardwareRegistry.has(id)) {
      errors.push({ code: "invalid-hardware", message: `Ferragem inválida: ${id}` });
    }
  });

  if (positionMm && room) {
    const halfW = room.widthMm / 2;
    const halfD = room.depthMm / 2;
    
    // Envelope total do móvel em relação ao cômodo
    const minX = positionMm.x - dimensionsMm.width / 2;
    const maxX = positionMm.x + dimensionsMm.width / 2;
    const minY = positionMm.y;
    const maxY = positionMm.y + dimensionsMm.height;
    const minZ = positionMm.z - dimensionsMm.depth / 2;
    const maxZ = positionMm.z + dimensionsMm.depth / 2;

    if (minX < -halfW - 1) errors.push({ code: "module-outside-room", message: "Módulo atravessando parede esquerda." });
    if (maxX > halfW + 1) errors.push({ code: "module-outside-room", message: "Módulo atravessando parede direita." });
    if (minY < -1) errors.push({ code: "module-below-floor", message: "Módulo abaixo do piso." });
    if (maxY > room.heightMm + 1) errors.push({ code: "module-through-ceiling", message: "Módulo atravessando o teto." });
    if (minZ < -halfD - 1) errors.push({ code: "module-through-wall", message: "Módulo atravessando parede do fundo." });
    if (maxZ > halfD + 1) errors.push({ code: "module-outside-room", message: "Módulo fora da zona frontal." });

    // Validação de colisão móvel x móvel (simplificada via AABB)
    // Nota: Em um sistema real, leríamos todas as instâncias do store aqui ou passaríamos no input.
  }


  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      partCount: parts.length,
      boundingBoxMm: dimensionsMm,
      checkedAt: new Date().toISOString(),
      moduleId: definition.id,
    },
  };
}