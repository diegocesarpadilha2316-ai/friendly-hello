import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { JoineryDefinition, JoineryFace } from "../contracts/JoineryDefinition";
import type {
  AssemblyReadiness,
  MachiningOperation,
  MachiningReadiness,
  MachiningReport,
  ManufacturingClassificationRecord,
  PartLocalCoordinates,
} from "../contracts/MachiningOperation";
import { HardwareRegistry } from "../registry/HardwareRegistry";
import { ConstructionProfileRegistry } from "../registry/ConstructionProfileRegistry";
import { resolveHardwareApplication } from "./hardwareApplicationResolver";
import type { ResolvedHardwareApplication } from "../contracts/HardwareApplicationRule";


function localCoordinates(
  targetPart: { id: string; positionMm: { x: number; y: number; z: number } },
  modulePosition: { x: number; y: number; z: number },
  face: JoineryFace,
): PartLocalCoordinates {
  return {
    coordinateSpace: "part-local",
    origin: { kind: "part-center", partId: targetPart.id },
    face,
    positionMm: {
      x: modulePosition.x - targetPart.positionMm.x,
      y: modulePosition.y - targetPart.positionMm.y,
      z: modulePosition.z - targetPart.positionMm.z,
    },
  };
}

function readinessFor(operation: MachiningOperation, reasons: string[]): MachiningReadiness {
  return {
    operationId: operation.id,
    instanceId: operation.instanceId,
    partId: operation.partId,
    hardwareId: operation.hardwareId,
    hardwareVariantId: operation.hardwareVariantId,
    type: operation.type,
    status: operation.readiness,
    missingParameters: operation.missingParameters,
    reasons,
  };
}

function makeHingeMachiningOperation(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  door: FurnitureInstance["parts"][number],
  targetPart: FurnitureInstance["parts"][number],
  type: "hinge-cup" | "hinge-fixing",
  resolvedApplication: ResolvedHardwareApplication | undefined,
): MachiningOperation {
  const hingePartId = source.relatedPartIds?.find((id) => id !== door.id) ?? source.partId;
  const variantId = instance.hardwareVariantIds?.hinge;
  const variant = source.hardwareId
    ? HardwareRegistry.getManufacturingVariant(source.hardwareId, variantId)
    : undefined;
  const spec = variant?.manufacturingSpec.kind === "hinge" ? variant.manufacturingSpec : undefined;
  const cupReady = type === "hinge-cup" && resolvedApplication?.applicationStatus === "READY";
  const operationType = type === "hinge-cup" ? "boring" : "drilling";
  const genericMissing =
    type === "hinge-cup"
      ? ["cupDiameterMm", "cupDepthMm", "boringDistanceSelection", "manufacturerVariantId"]
      : ["pilotHoleDiameterMm", "pilotHoleDepthMm", "manufacturerVariantId"];
  const missingParameters = cupReady
    ? []
    : type === "hinge-cup"
      ? [
          ...(variant ? [] : ["manufacturerVariantId"]),
          ...(spec ? [] : ["cupDiameterMm", "cupDepthMm", "boringDistanceRangeMm"]),
          ...(resolvedApplication?.missingParameters ?? ["selectedBoringDistanceMm"]),
        ].filter((value, index, values) => values.indexOf(value) === index)
      : genericMissing;
  const hardware = source.hardwareId ? HardwareRegistry.get(source.hardwareId) : undefined;

  return {
    id: `${source.id}:machining`,
    type: operationType,
    instanceId: instance.id,
    partId: targetPart.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: variant?.id,
    sourceJoineryId: source.id,
    relatedPartIds: [door.id, hingePartId, targetPart.id].filter(
      (id, index, ids) => ids.indexOf(id) === index,
    ),
    coordinates: source.positionMm && source.face
      ? localCoordinates(targetPart, {
          x: source.positionMm.x,
          y: source.positionMm.y,
          z: door.positionMm.z + (type === "hinge-cup" ? door.dimensionsMm.depth / 2 : 0),
        }, source.face)
      : undefined,
    diameterMm: type === "hinge-cup" ? spec?.cup.cupDiameterMm : undefined,
    depthMm: type === "hinge-cup" ? spec?.cup.cupDepthMm : undefined,
    toolHint: type === "hinge-cup" ? undefined : "pilot-hole-not-specified",
    parameters: spec
      ? type === "hinge-cup"
        ? {
            doorPartId: door.id,
            hingePartId,
            targetPartId: targetPart.id,
            hingeSide: door.interactive?.hingeSide ?? null,
            cupDiameterMm: spec.cup.cupDiameterMm,
            cupDepthMm: spec.cup.cupDepthMm,
            boringDistanceMinMm: spec.cup.boringDistanceRangeMm.min,
            boringDistanceMaxMm: spec.cup.boringDistanceRangeMm.max,
            selectedBoringDistanceMm: resolvedApplication?.parameters.selectedBoringDistanceMm ?? null,
            applicationRuleId: resolvedApplication?.ruleId ?? null,
            applicationRuleStatus: resolvedApplication?.applicationStatus ?? "INCOMPLETE",
            applicationType: resolvedApplication?.applicationType ?? null,
            edgeReference: spec.cup.edgeReference,
            verticalPlacementRule: resolvedApplication?.ruleId ?? null,
          }
        : {
            doorPartId: door.id,
            hingePartId,
            targetPartId: targetPart.id,
            hingeSide: door.interactive?.hingeSide ?? null,
            pilotHoleDiameterMm: null,
            pilotHoleDepthMm: null,
            applicationRuleId: resolvedApplication?.ruleId ?? null,
          }
      : {
          doorPartId: door.id,
          hingePartId,
          targetPartId: targetPart.id,
          hingeSide: door.interactive?.hingeSide ?? null,
          catalogHardwareName: hardware?.name ?? null,
        },
    readiness: cupReady ? "READY" : "INCOMPLETE",
    missingParameters,
    provenance: spec?.provenance,
  };
}

function makeMountingPlatePilotOperation(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  plate: FurnitureInstance["parts"][number],
  targetPart: FurnitureInstance["parts"][number],
  hingePartId: string,
  doorId: string,
): MachiningOperation {
  const plateVariantId = instance.hardwareVariantIds?.mountingPlate;
  const plateVariant = source.hardwareId
    ? HardwareRegistry.getManufacturingVariant(source.hardwareId, plateVariantId)
    : undefined;
  const plateSpec = plateVariant?.manufacturingSpec.kind === "mounting-plate"
    ? plateVariant.manufacturingSpec
    : undefined;
  return {
    id: `${source.id}:pilot-drilling`,
    type: "drilling",
    instanceId: instance.id,
    partId: targetPart.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: plateVariant?.id,
    sourceJoineryId: source.id,
    relatedPartIds: [doorId, hingePartId, plate.id, targetPart.id].filter(
      (id, index, ids) => ids.indexOf(id) === index,
    ),
    coordinates: source.positionMm && source.face
      ? localCoordinates(targetPart, { x: source.positionMm.x, y: source.positionMm.y, z: targetPart.positionMm.z }, source.face)
      : undefined,
    toolHint: "pilot-hole-not-specified",
    parameters: {
      mountingPlatePartId: plate.id,
      hingePartId,
      doorPartId: doorId,
      mountingPlatePattern: plateSpec?.pattern ?? null,
      plateReferenceFromFrontEdgeMm: plateSpec?.plateReferenceFromFrontEdgeMm ?? null,
      holeSpacingMm: plateSpec?.holeSpacingMm ?? null,
      plateSystemDistanceMm: plateSpec?.plateSystemDistanceMm ?? null,
      screwDiameterMm: plateSpec?.fastener.screwDiameterMm ?? null,
      screwLengthMm: plateSpec?.fastener.screwLengthMm ?? null,
      pilotHoleDiameterMm: plateSpec?.pilotHole?.pilotHoleDiameterMm ?? null,
      pilotHoleDepthMm: plateSpec?.pilotHole?.pilotHoleDepthMm ?? null,
      pilotHoleSource: plateSpec?.pilotHole?.provenance.id ?? null,
    },
    readiness: plateSpec?.pilotHole ? "READY" : "INCOMPLETE",
    missingParameters: plateSpec?.pilotHole ? [] : ["pilotHoleDiameterMm", "pilotHoleDepthMm"],
    provenance: plateSpec?.provenance,
  };
}

function makeShelfSupportMachiningOperation(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  targetPart: FurnitureInstance["parts"][number],
  shelfPartId: string,
): MachiningOperation {
  const supportPartId = source.relatedPartIds?.find((id) => id !== shelfPartId) ?? source.partId;
  return {
    id: `${source.id}:machining`,
    type: "drilling",
    instanceId: instance.id,
    partId: targetPart.id,
    hardwareId: source.hardwareId,
    sourceJoineryId: source.id,
    relatedPartIds: [targetPart.id, shelfPartId, supportPartId].filter(
      (id, index, ids) => ids.indexOf(id) === index,
    ),
    coordinates: source.positionMm && source.face
      ? localCoordinates(targetPart, {
          x: source.positionMm.x,
          y: source.positionMm.y,
          z: source.positionMm.x < 0 ? targetPart.positionMm.z + targetPart.dimensionsMm.depth / 2 : targetPart.positionMm.z - targetPart.dimensionsMm.depth / 2,
        }, source.face)
      : undefined,
    parameters: {
      shelfPartId,
      supportPartId,
      targetPartId: targetPart.id,
      patternPitchMm: null,
      system32: false,
    },
    readiness: "INCOMPLETE",
    missingParameters: ["holeDiameterMm", "holeDepthMm", "edgeOffsetMm", "patternPitchMm"],
  };
}

function makeStructuralMachiningOperation(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  targetPart: FurnitureInstance["parts"][number],
): MachiningOperation {
  const variant = source.hardwareId ? HardwareRegistry.getManufacturingVariant(source.hardwareId, source.hardwareVariantId) : undefined;
  const spec = variant?.manufacturingSpec.kind === "structural-connector" ? variant.manufacturingSpec : undefined;
  const ready = source.kind === "minifix-head" && Boolean(source.position3dMm && source.face && source.diameterMm !== undefined && source.depthMm !== undefined && spec);
  return {
    id: `${source.id}:machining`,
    type: source.kind === "minifix-head" ? "boring" : "drilling",
    instanceId: instance.id,
    partId: targetPart.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: source.hardwareVariantId,
    sourceJoineryId: source.id,
    relatedPartIds: source.relatedPartIds ?? [source.partId],
    coordinates: source.position3dMm && source.face ? localCoordinates(targetPart, source.position3dMm, source.face) : undefined,
    diameterMm: source.diameterMm,
    depthMm: source.depthMm,
    toolHint: ready ? "manufacturer-tool-unspecified" : "NOT_ASSIGNED",
    parameters: {
      ...(source.parameters ?? {}),
      manufacturingRole: source.manufacturingRole,
      truthStatus: source.truthStatus,
      coordinateStatus: source.position3dMm && source.face ? "READY" : "UNKNOWN",
    },
    readiness: ready ? "READY" : "INCOMPLETE",
    missingParameters: ready ? [] : source.unknownParameters.length > 0 ? source.unknownParameters : ["position", "face", "diameterMm", "depthMm"],
    provenance: spec?.provenance,
  };
}

function makeMoventoSlideMachiningOperation(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  targetPart: FurnitureInstance["parts"][number],
): MachiningOperation {
  const variantId = instance.hardwareVariantIds?.slide;
  const variant = source.hardwareId ? HardwareRegistry.getManufacturingVariant(source.hardwareId, variantId) : undefined;
  const spec = variant?.manufacturingSpec.kind === "runner" ? variant.manufacturingSpec : undefined;
  return {
    id: `${source.id}:movento-machining`,
    type: "drilling",
    instanceId: instance.id,
    partId: targetPart.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: variant?.id,
    sourceJoineryId: source.id,
    relatedPartIds: source.relatedPartIds ?? [source.partId],
    coordinates: source.positionMm && source.face ? localCoordinates(targetPart, targetPart.positionMm, source.face) : undefined,
    toolHint: "NOT_ASSIGNED",
    parameters: {
      coordinateStatus: "UNKNOWN",
      drillingTemplateId: spec?.attachment.drillingTemplateId ?? null,
      nominalLengthMm: spec?.nominalLengthMm ?? null,
      drawerLengthMm: spec ? spec.nominalLengthMm - 10 : null,
      chipboardScrewCode: spec?.attachment.chipboardScrew.manufacturerCode ?? null,
      systemScrewCode: spec?.attachment.systemScrew.manufacturerCode ?? null,
    },
    readiness: "INCOMPLETE",
    missingParameters: ["runnerMountingCoordinates", "drawerHookCoordinates", "pilotHoleDecision"],
    provenance: spec?.provenance,
  };
}

function classification(
  instance: FurnitureInstance,
  source: JoineryDefinition,
  classificationValue: ManufacturingClassificationRecord["classification"],
  reason: string,
): ManufacturingClassificationRecord {
  return {
    id: `${source.id}:classification`,
    instanceId: instance.id,
    partId: source.partId,
    hardwareId: source.hardwareId,
    sourceJoineryId: source.id,
    classification: classificationValue,
    relatedPartIds: source.relatedPartIds ?? [source.partId],
    reason,
  };
}

function hingeAssemblyReadiness(instance: FurnitureInstance, source: JoineryDefinition): AssemblyReadiness {
  const variantId = instance.hardwareVariantIds?.hinge;
  const variant = source.hardwareId ? HardwareRegistry.getManufacturingVariant(source.hardwareId, variantId) : undefined;
  const spec = variant?.manufacturingSpec.kind === "hinge" ? variant.manufacturingSpec : undefined;
  return {
    id: `${source.id}:assembly`,
    instanceId: instance.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: variant?.id,
    relatedPartIds: source.relatedPartIds ?? [source.partId],
    status: spec ? "READY" : "INCOMPLETE",
    missingParameters: spec ? [] : ["manufacturerVariantId"],
    provenance: spec?.provenance,
    reason: "Hinge fixing is assembly semantics; pilot-hole machining is not inferred from fastener data.",
  };
}

function mountingPlateAssemblyReadiness(
  instance: FurnitureInstance,
  source: JoineryDefinition,
): AssemblyReadiness {
  const plateVariantId = instance.hardwareVariantIds?.mountingPlate;
  const plateVariant = source.hardwareId
    ? HardwareRegistry.getManufacturingVariant(source.hardwareId, plateVariantId)
    : undefined;
  const compatible = Boolean(
          plateVariant?.manufacturingSpec.kind === "mounting-plate" &&
      "compatibleHardwareVariantIds" in plateVariant &&
      plateVariant.compatibleHardwareVariantIds.includes(instance.hardwareVariantIds?.hinge ?? ""),

  );
  const plateSpec = plateVariant?.manufacturingSpec.kind === "mounting-plate"
    ? plateVariant.manufacturingSpec
    : undefined;
  return {
    id: `${source.id}:assembly`,
    instanceId: instance.id,
    hardwareId: source.hardwareId,
    hardwareVariantId: plateVariant?.id,
    relatedPartIds: source.relatedPartIds ?? [source.partId],
    status: compatible && Boolean(plateSpec?.fastener) ? "READY" : "INCOMPLETE",
    missingParameters: compatible && plateSpec?.fastener ? [] : ["compatibleMountingPlateVariantId"],
    provenance: plateSpec?.provenance,
    reason: "Placement and fastener specification are assembly data; pilot-hole machining is reported separately.",
  };
}

export function evaluateMachiningReadiness(
  operations: readonly MachiningOperation[],
): MachiningReadiness[] {
  return operations.map((operation) =>
    readinessFor(
      operation,
      operation.readiness === "READY"
        ? []
        : operation.missingParameters.map((parameter) => `Parâmetro ausente: ${parameter}`),
    ),
  );
}

export function buildMachiningReport(
  instances: readonly FurnitureInstance[],
  joineryOperations: readonly JoineryDefinition[],
): MachiningReport {
  const operations: MachiningOperation[] = [];
  const readiness: MachiningReadiness[] = [];
  const assemblyReadiness: AssemblyReadiness[] = [];
  const classifications: ManufacturingClassificationRecord[] = [];
  const warnings: string[] = [];

  for (const instance of instances) {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId);
    const instanceJoinery = joineryOperations.filter((operation) => operation.moduleInstanceId === instance.id);
    const partsById = new Map(instance.parts.map((part) => [part.id, part]));
    const doors = instance.parts.filter((part) => part.role === "door");
    if (!profile) {
      instanceJoinery.forEach((source) => classifications.push(classification(instance, source, "ASSEMBLY", "LEGACY_DEFAULT isolado: não promover operação sem provenance profissional.")));
      continue;
    }
    const resolvedApplication = resolveHardwareApplication(instance);
    const requestedVariantId = instance.hardwareVariantIds?.hinge;
    if (requestedVariantId && !HardwareRegistry.getManufacturingVariant(instance.hardwareOverrides.hinge, requestedVariantId)) {
      warnings.push(`Variante de dobradiça não encontrada: ${requestedVariantId}`);
    }

    for (const source of instanceJoinery) {
      if (source.source === "LEGACY_DEFAULT") {
        classifications.push(classification(instance, source, "ASSEMBLY", "LEGACY_DEFAULT encontrado dentro do dispatch profissional; não promover para machining."));
        continue;
      }
      if (source.kind === "minifix-head" || source.kind === "minifix-body") {
        const targetPart = partsById.get(source.partId);
        if (!targetPart) {
          warnings.push(`Operação ${source.id}: parte estrutural ${source.partId} não encontrada.`);
          continue;
        }
        const operation = makeStructuralMachiningOperation(instance, source, targetPart);
        operations.push(operation);
        readiness.push(...evaluateMachiningReadiness([operation]));
        classifications.push(classification(instance, source, "MACHINING", source.kind === "minifix-head" ? "Housing Minifix derivado de ManufacturerSpec oficial." : "Bolt Minifix permanece operação INCOMPLETE sem dados industriais completos."));
        if (source.kind === "minifix-head") {
          const variant = source.hardwareId ? HardwareRegistry.getManufacturingVariant(source.hardwareId, source.hardwareVariantId) : undefined;
          const spec = variant?.manufacturingSpec.kind === "structural-connector" ? variant.manufacturingSpec : undefined;
          assemblyReadiness.push({
            id: `${source.id}:assembly`,
            instanceId: instance.id,
            hardwareId: source.hardwareId,
            hardwareVariantId: source.hardwareVariantId,
            relatedPartIds: source.relatedPartIds ?? [source.partId],
            status: "READY",
            missingParameters: [],
            provenance: spec?.provenance,
            reason: "Relação estrutural Minifix é desmontável e foi resolvida pelo profile; readiness de furação é independente.",
          });
        }
        continue;
      }
      if (source.kind === "runner-installation") {
        const targetPart = partsById.get(source.partId);
        const variantId = instance.hardwareVariantIds?.slide;
        const variant = source.hardwareId ? HardwareRegistry.getManufacturingVariant(source.hardwareId, variantId) : undefined;
        const spec = variant?.manufacturingSpec.kind === "runner" ? variant.manufacturingSpec : undefined;
        if (!targetPart || !spec || !variant) {
          warnings.push(`Operação ${source.id}: variante MOVENTO 760H não encontrada.`);
          continue;
        }
        const operation = makeMoventoSlideMachiningOperation(instance, source, targetPart);
        operations.push(operation);
        readiness.push(...evaluateMachiningReadiness([operation]));
        classifications.push(classification(instance, source, "MACHINING", "Candidato downstream MOVENTO; permanece INCOMPLETE enquanto coordenadas industriais não forem documentadas."));
        assemblyReadiness.push({
          id: `${source.id}:movento-assembly`,
          instanceId: instance.id,
          hardwareId: source.hardwareId,
          hardwareVariantId: variant.id,
          relatedPartIds: source.relatedPartIds ?? [source.partId],
          status: "READY",
          missingParameters: [],
          provenance: spec.provenance,
          reason: "Família, variante, NL, template e referências de fixação Blum verificados; coordenadas CNC permanecem em operação INCOMPLETE.",
        });
        classifications.push(classification(instance, source, "ASSEMBLY", "MOVENTO 760H é ferragem comprada; montagem documental READY e usinagem CNC INCOMPLETE."));
        continue;
      }

      if (source.kind === "hinge-cup" || source.kind === "hinge-fixing") {
        const door = partsById.get(source.partId);
        if (!door) {
          warnings.push(`Operação ${source.id}: porta ${source.partId} não encontrada.`);
          continue;
        }
        const targetPart = source.kind === "hinge-cup"
          ? door
          : instance.parts.find((part) => part.role === (door.interactive?.hingeSide === "left" ? "side-left" : "side-right"));
        if (!targetPart) {
          warnings.push(`Operação ${source.id}: lateral correspondente não encontrada.`);
          continue;
        }
        if (source.kind === "hinge-fixing") {
          assemblyReadiness.push(hingeAssemblyReadiness(instance, source));
          classifications.push(classification(instance, source, "ASSEMBLY", "Fixação de dobradiça é montagem; nenhum diâmetro/profundidade de pilot hole foi inventado."));
          continue;
        }
        const operation = makeHingeMachiningOperation(instance, source, door, targetPart, source.kind, resolvedApplication);
        operations.push(operation);
        readiness.push(...evaluateMachiningReadiness([operation]));
        classifications.push(classification(instance, source, "MACHINING", "Furação de copo derivada de ManufacturerSpec/ApplicationRule; readiness explícita."));
        continue;
      }

      if (source.kind === "mounting-plate-placement" || source.kind === "mounting-plate-fixing") {
        const plate = partsById.get(source.partId);
        const doorId = source.parameters?.doorPartId;
        const hingePartId = source.parameters?.hingePartId;
        const door = typeof doorId === "string" ? partsById.get(doorId) : undefined;
        const hingePart = typeof hingePartId === "string" ? partsById.get(hingePartId) : undefined;
        const targetPart = hingePart
          ? instance.parts.find((part) => part.role === (door?.interactive?.hingeSide === "left" ? "side-left" : "side-right"))
          : undefined;
        if (!plate || !door || !hingePart || !targetPart) {
          warnings.push(`Operação ${source.id}: placa/porta/dobradiça/lateral correspondente não encontrada.`);
          continue;
        }
        if (source.kind === "mounting-plate-placement") {
          assemblyReadiness.push(mountingPlateAssemblyReadiness(instance, source));
        } else {
          assemblyReadiness.push({
            ...mountingPlateAssemblyReadiness(instance, source),
            id: `${source.id}:fastener-assembly`,
            status: "INCOMPLETE",
            missingParameters: ["pilotHoleDiameterMm", "pilotHoleDepthMm"],
            reason: "Mounting plate fastener is assembly data; no pilot-hole machining is promoted without documented parameters.",
          });
          classifications.push(classification(instance, source, "ASSEMBLY", "Fixação da placa é montagem; screw diameter is not promoted to pilot-hole diameter."));
        }
        continue;
      }

      if (source.kind === "shelf-support") {
        assemblyReadiness.push({
          id: `${source.id}:assembly`,
          instanceId: instance.id,
          hardwareId: source.hardwareId,
          relatedPartIds: source.relatedPartIds ?? [source.partId],
          status: "INCOMPLETE",
          missingParameters: ["holeDiameterMm", "holeDepthMm", "edgeOffsetMm", "patternPitchMm"],
          reason: "Shelf/support/side relation is semantic assembly; no drilling is materialized without a documented hole rule.",
        });
        classifications.push(classification(instance, source, "ASSEMBLY", "Shelf support semantic relation retained without fabricated drilling."));
        classifications.push(classification(instance, source, "MACHINING", "Shelf support machining remains INCOMPLETE without hole specification."));
        continue;
      }

      if (source.kind === "gola-profile") {
        classifications.push(classification(instance, source, "PURCHASED_HARDWARE", "HARDWARE_VISUAL: Perfil Gola montado; não há variante oficial que comprove rasgo/cava nesta etapa."));
      } else if (source.kind === "adjustable-foot") {
        classifications.push(classification(instance, source, "PURCHASED_HARDWARE", "Pé regulável é ferragem comprada e montada; nenhuma furação foi inventada."));
      } else if (source.kind === "toe-kick-clip") {
        classifications.push(classification(instance, source, "PURCHASED_HARDWARE", "Clip é ferragem comprada e montada no conjunto do rodapé."));
      } else if (source.kind === "toe-kick-profile") {
        classifications.push(classification(instance, source, "PROFILE", "Rodapé/perfil é componente de perfil; não é operação CNC por si só."));
      } else if (source.kind === "confirmat" || source.kind === "dowel" || source.kind === "handle-through") {
        classifications.push(classification(instance, source, "MACHINING", "Sem regra/provenance industrial suficiente; permanece INCOMPLETE e não é promovida a operação geométrica."));
      }
    }

    for (const door of doors) {
      if (!door.hardwareId || door.hardwareId !== instance.hardwareOverrides.hinge) {
        warnings.push(`${door.id}: dobradiça sem associação consistente com hardwareOverrides.hinge.`);
      }
    }
  }

  return {
    operations,
    readiness,
    assemblyReadiness,
    classifications,
    system32: "NOT_REQUIRED",
    warnings,
  };
}
