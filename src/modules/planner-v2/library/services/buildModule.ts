import type { Dimensions3, ModuleBuildResult } from "../contracts/ModuleDefinition";
import type { PartDefinition } from "../contracts/PartDefinition";
import { ModuleRegistry } from "../registry/ModuleRegistry";
import { MaterialRegistry } from "../registry/MaterialRegistry";
import { validateModule, type RoomBoundsMm } from "./validateModule";
import type { ValidationResult } from "../contracts/ValidationResult";
import type { ThicknessProfileMm } from "../contracts/ModuleDefinition";

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

  let result: ModuleBuildResult;
  try {
    result = definition.build({
      instanceId: request.instanceId,
      dimensionsMm,
      materialId,
      materialOverrides: request.materialOverrides,
      hardwareOverrides: request.hardwareOverrides,
      thicknessMm: request.thicknessMm,
    });
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
  const parts = result.parts.map((part) => ({
    ...part,
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
    materialId: overrides[part.role] ?? overrides[part.id] ?? part.materialId,
  }));

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
    };
  }

  return {
    ok: true,
    parts,
    dimensionsMm,
    hardwareIds: result.hardwareIds,
    validation,
    result,
  };
}
