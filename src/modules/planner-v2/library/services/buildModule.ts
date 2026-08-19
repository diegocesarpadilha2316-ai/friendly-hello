import type { Dimensions3, ModuleBuildResult } from "../contracts/ModuleDefinition";
import type { PartDefinition } from "../contracts/PartDefinition";
import { ModuleRegistry } from "../registry/ModuleRegistry";
import { MaterialRegistry, resolveMaterialThicknessProfile } from "../registry/MaterialRegistry";
import { validateModule, type RoomBoundsMm } from "./validateModule";
import type { ValidationIssue, ValidationResult } from "../contracts/ValidationResult";
import type { ThicknessProfileMm } from "../contracts/ModuleDefinition";
import { validateFurnitureSlotMap } from "../contracts/FurnitureSlot";

export interface BuildRequest {
  moduleId: string;
  instanceId: string;
  dimensionsMm?: Partial<Dimensions3>;
  materialId?: string;
  materialOverrides?: Record<string, string>;
  hardwareOverrides?: Record<string, string>;
  thicknessMm?: ThicknessProfileMm;
  positionMm?: { x: number; y: number; z: number };
  rotationDeg?: { x: number; y: number; z: number };
  room?: RoomBoundsMm;
  instances?: any[]; // Para colisão móvel x móvel
}

export interface BuildOutcome {
  ok: boolean;
  error?: string;
  parts: PartDefinition[];
  dimensionsMm: Dimensions3;
  hardwareIds: string[];
  validation?: ValidationResult;
  result?: ModuleBuildResult;
  thicknessMm?: ThicknessProfileMm;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Constrói as peças reais de um módulo, aplicando overrides de material e validando. */
export function buildModule(request: BuildRequest): BuildOutcome {
  const definition = ModuleRegistry.get(request.moduleId);
  if (!definition) {
    return {
      ok: false,
      error: `Módulo não registrado no ModuleRegistry: ${request.moduleId}`,
      parts: [],
      dimensionsMm: { width: 0, height: 0, depth: 0 },
      hardwareIds: [],
    };
  }

  const requested = { ...definition.defaultDimensionsMm, ...request.dimensionsMm };
  const dimensionErrors: ValidationIssue[] = (['width', 'height', 'depth'] as const).flatMap(
    (axis): ValidationIssue[] => {
    const value = request.dimensionsMm?.[axis];
    if (value === undefined) return [];
    if (value < definition.minDimensionsMm[axis]) {
      return [{
        code: 'dimension-below-min',
        message: `${axis} ${value}mm abaixo do mínimo (${definition.minDimensionsMm[axis]}mm).`,
        constraints: { min: definition.minDimensionsMm[axis], requested: value },
      }];
    }
    if (value > definition.maxDimensionsMm[axis]) {
      return [{
        code: 'dimension-above-max',
        message: `${axis} ${value}mm acima do máximo (${definition.maxDimensionsMm[axis]}mm).`,
        constraints: { max: definition.maxDimensionsMm[axis], requested: value },
      }];
    }
      return [];
    },
  );
  if (dimensionErrors.length > 0) {
    return {
      ok: false,
      error: dimensionErrors.map((issue) => `[${issue.code}] ${issue.message}`).join(' | '),
      parts: [],
      dimensionsMm: requested as Dimensions3,
      hardwareIds: [],
      validation: {
        valid: false,
        errors: dimensionErrors,
        warnings: [],
        metadata: {
          partCount: 0,
          checkedAt: new Date().toISOString(),
          moduleId: definition.id,
        },
      },
    };
  }
  const dimensionsMm: Dimensions3 = {
    width: clamp(
      requested.width,
      definition.minDimensionsMm.width,
      definition.maxDimensionsMm.width,
    ),
    height: clamp(
      requested.height,
      definition.minDimensionsMm.height,
      definition.maxDimensionsMm.height,
    ),
    depth: clamp(
      requested.depth,
      definition.minDimensionsMm.depth,
      definition.maxDimensionsMm.depth,
    ),
  };

  const materialId =
    request.materialId && MaterialRegistry.has(request.materialId)
      ? request.materialId
      : definition.defaultMaterialId;
  const slotDiagnostics = validateFurnitureSlotMap({
    ...(request.materialOverrides ?? {}),
    ...(request.hardwareOverrides ?? {}),
  });
  const effectiveMaterialId = request.materialOverrides?.body ?? materialId;
  const thicknessMm = resolveMaterialThicknessProfile(effectiveMaterialId, request.thicknessMm);

  let result: ModuleBuildResult;
  try {
    result = definition.build({
      instanceId: request.instanceId,
      dimensionsMm,
      materialId,
      materialOverrides: request.materialOverrides,
      hardwareOverrides: request.hardwareOverrides,
      thicknessMm,
    });
    result = {
      ...result,
      warnings: [...result.warnings, ...slotDiagnostics.warnings],
    };
  } catch (error) {
    return {
      ok: false,
      error: `Falha técnica no build de ${definition.id}: ${(error as Error).message}`,
      parts: [],
      dimensionsMm,
      hardwareIds: [],
    };
  }

  const overrides = request.materialOverrides ?? {};
  const parts = result.parts.map((part) => {
    const resolvedMaterialId = overrides[part.role] ?? overrides[part.id] ?? part.materialId;
    const resolvedMaterial = MaterialRegistry.get(resolvedMaterialId);
    const partThicknessMm =
      part.role === "countertop"
        ? resolvedMaterial?.stone?.thicknessMm ?? thicknessMm.panelMm
        : part.role === "back"
          ? thicknessMm.backMm
          : part.role === "door" || part.role === "drawer-front"
            ? thicknessMm.doorMm
            : part.role === "shelf" || part.role === "drawer-bottom"
              ? thicknessMm.shelfMm
              : thicknessMm.panelMm;
    return {
    ...part,
    materialType: resolvedMaterial?.category,
    thicknessMm: part.role === "hardware" ? undefined : partThicknessMm,
    volumeType:
      part.volumeType ??
      (part.interactive && part.interactive.type !== "none"
        ? "opening"
        : part.role === "hardware"
          ? "technical"
          : part.role === "back"
            ? "safety"
            : "physical"),
    clearanceMm: part.clearanceMm ?? (part.interactive && part.interactive.type !== "none" ? 8 : 0),
    id: part.id.replace(definition.id, request.instanceId),
    moduleId: request.instanceId,
    parentInstanceId: request.instanceId,
    groupId: part.groupId?.replace(definition.id, request.instanceId),
    materialId: resolvedMaterialId,
    };
  });

  const validation = validateModule({
    definition,
    dimensionsMm,
    parts,
    hardwareIds: result.hardwareIds,
    positionMm: request.positionMm,
    room: request.room,
    instances: request.instances,
  });

  if (!validation.valid) {
    return {
      ok: false,
      error: validation.errors.map((issue) => `[${issue.code}] ${issue.message}`).join(" | "),
      parts,
      dimensionsMm,
      hardwareIds: result.hardwareIds,
      validation,
      result,
      thicknessMm,
    };
  }

  return {
    ok: true,
    parts,
    dimensionsMm,
    hardwareIds: result.hardwareIds,
    validation,
    result,
    thicknessMm,
  };
}
