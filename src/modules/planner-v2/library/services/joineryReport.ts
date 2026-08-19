import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { JoineryCapabilityReadiness, JoineryDefinition, JoineryManufacturingRole, JoineryTruthStatus } from "../contracts/JoineryDefinition";
import { ConstructionProfileRegistry } from "../registry/ConstructionProfileRegistry";
import type { PartDefinition } from "../contracts/PartDefinition";
import { resolveHardwareApplication } from "./hardwareApplicationResolver";
import { resolveStructuralJoineryForInstance, type StructuralJoineryApplication } from "./structuralJoineryApplication";
import type { StructuralJoineryResolution } from "../contracts/StructuralJoinery";

export type JoineryReport = {
  operations: JoineryDefinition[];
  readiness: JoineryCapabilityReadiness[];
  warnings: string[];
  structuralJoinery: StructuralJoineryResolution[];
};

const LEGACY_EDGE_OFFSET_RULE_ID = "legacy-edge-offset-37-v1";
const LEGACY_EDGE_OFFSET_MM = 37;

const truthByKind: Record<JoineryDefinition["kind"], { role: JoineryManufacturingRole; status: JoineryTruthStatus; unknownParameters: string[] }> = {
  "minifix-head": { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerFastenerSpec", "edgeReferenceMm"] },
  "minifix-body": { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerFastenerSpec", "edgeReferenceMm"] },
  dowel: { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerFastenerSpec", "edgeReferenceMm"] },
  confirmat: { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerFastenerSpec", "edgeReferenceMm"] },
  "hinge-cup": { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerVariantId", "selectedBoringDistanceMm"] },
  "hinge-fixing": { role: "ASSEMBLY", status: "INCOMPLETE", unknownParameters: ["pilotHoleDiameterMm", "pilotHoleDepthMm"] },
  "mounting-plate-placement": { role: "ASSEMBLY", status: "INCOMPLETE", unknownParameters: ["compatibleMountingPlateVariantId"] },
  "mounting-plate-fixing": { role: "ASSEMBLY", status: "INCOMPLETE", unknownParameters: ["pilotHoleDiameterMm", "pilotHoleDepthMm"] },
  "slide-fixing": { role: "ASSEMBLY", status: "INCOMPLETE", unknownParameters: ["runnerMountingCoordinates", "drawerHookCoordinates"] },
  "runner-installation": { role: "ASSEMBLY", status: "READY", unknownParameters: [] },
  "handle-through": { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["manufacturerHandleDrillingTemplate"] },
  "gola-profile": { role: "HARDWARE_VISUAL", status: "READY", unknownParameters: [] },
  "adjustable-foot": { role: "ASSEMBLY", status: "READY", unknownParameters: [] },
  "toe-kick-profile": { role: "PROFILE", status: "READY", unknownParameters: [] },
  "toe-kick-clip": { role: "ASSEMBLY", status: "READY", unknownParameters: [] },
  "shelf-support": { role: "ASSEMBLY", status: "INCOMPLETE", unknownParameters: ["holeDiameterMm", "holeDepthMm", "edgeOffsetMm", "patternPitchMm"] },
  "free-drilling": { role: "MACHINING", status: "INCOMPLETE", unknownParameters: ["drillingPurpose", "manufacturerPattern"] },
};

function semanticPartKey(partId: string): string {
  return partId.split(":").at(-1) ?? partId;
}

function structuralJoineryOperations(instance: FurnitureInstance, application: StructuralJoineryApplication): JoineryDefinition[] {
  if (!application.resolution || !application.rule || !application.spec) return [];
  const spec = application.spec;
  return application.resolution.joints.flatMap((joint) => {
    const host = instance.parts.find((part) => part.id === joint.hostPartId || semanticPartKey(part.id) === semanticPartKey(joint.hostPartId));
    const target = instance.parts.find((part) => part.id === joint.targetPartId || semanticPartKey(part.id) === semanticPartKey(joint.targetPartId));
    if (!host || !target) return [];
    const common: Partial<JoineryDefinition> = {
      moduleInstanceId: instance.id,
      hardwareId: joint.connectorHardwareId,
      hardwareVariantId: joint.manufacturingVariantId,
      manufacturerSpecId: joint.manufacturingVariantId,
      ruleId: joint.ruleId,
      relatedPartIds: [host.id, target.id],
      position3dMm: joint.positionMm,
      positionMm: { x: joint.positionMm.x, y: joint.positionMm.y },
      parameters: {
        relationId: joint.relationId,
        relationOccurrence: joint.relationOccurrence,
        hostPartId: host.id,
        targetPartId: target.id,
        hostFace: joint.hostFace,
        targetFace: joint.targetFace,
        housingDiameterMm: spec.housingDiameterMm,
        housingDepthMm: spec.housingDepthMm,
        connectingBoltDrillingDistanceMm: spec.connectingBoltDrillingDistanceMm,
        targetBoltHoleDiameterMm: null,
        targetBoltHoleDepthMm: null,
      },
      notes: "Structural joint resolvido por regra de aplicação; housing e bolt são operações distintas.",
    };
    return [
      op(instance, host.id, "minifix-head", joint.quantityIndex, {
        ...common,
        id: `${joint.id}:housing`,
        face: joint.hostFace,
        diameterMm: spec.housingDiameterMm,
        depthMm: spec.housingDepthMm,
        manufacturingRole: "MACHINING",
        truthStatus: "READY",
        unknownParameters: [],
        source: "MANUFACTURER_SPEC",
        provenance: { sourceId: spec.provenance.id ?? "hafele-minifix15", sourceRevision: spec.provenance.documentRevision, url: spec.provenance.sourceReference },
        notes: "Furação do housing Minifix 15 documentada pelo fabricante; não é a furação do bolt.",
      }),
      op(instance, target.id, "minifix-body", joint.quantityIndex, {
        ...common,
        id: `${joint.id}:bolt`,
        face: joint.targetFace,
        manufacturingRole: "MACHINING",
        truthStatus: "INCOMPLETE",
        unknownParameters: ["targetBoltHoleDiameterMm", "targetBoltHoleDepthMm", "targetTool"],
        source: "MANUFACTURER_SPEC",
        provenance: { sourceId: spec.provenance.id ?? "hafele-minifix15", sourceRevision: spec.provenance.documentRevision, url: spec.provenance.sourceReference },
        notes: "Furação do bolt permanece INCOMPLETE: screw/bolt identity não autoriza inferir diâmetro, profundidade ou tool.",
      }),
    ];
  });
}

function op(
  instance: FurnitureInstance,
  partId: string,
  kind: JoineryDefinition["kind"],
  index: number,
  overrides: Partial<JoineryDefinition> = {},
): JoineryDefinition {
  const truth = truthByKind[kind];
  return {
    id: `${instance.id}-${partId}-${kind}-${index}`,
    moduleInstanceId: instance.id,
    partId,
    kind,
    manufacturingRole: truth.role,
    truthStatus: truth.status,
    unknownParameters: truth.unknownParameters,
    source: truth.role === "MACHINING" ? "PROFILE_RULE" : "SEMANTIC_ASSEMBLY",
    ruleId: `joinery:${instance.moduleDefinitionId}:${kind}`,
    ...overrides,
  };
}

function goldenHingeOperations(instance: FurnitureInstance, door: PartDefinition): JoineryDefinition[] {
  const resolvedApplication = resolveHardwareApplication(instance);
  const hingeParts = instance.parts.filter(
    (part) =>
      part.role === "hardware" &&
      part.hardwareId === instance.hardwareOverrides.hinge &&
      part.groupId === door.groupId &&
      part.id.startsWith(`${door.id}:hinge-`),
  );

  return hingeParts.flatMap((hingePart, index) => {
    const logicalHinge = `${semanticPartKey(door.id)}:${semanticPartKey(hingePart.id)}`;
    const mountingPlate = instance.parts.find(
      (part) =>
        part.role === "hardware" &&
        part.hardwareId === (instance.hardwareOverrides.mountingPlate ?? "mounting-plate-37-32") &&
        part.groupId === door.groupId &&
        part.id.startsWith(`${door.id}:mounting-plate-${hingePart.id.replace(`${door.id}:hinge-`, "")}`),
    );
    const positionMm = {
      x: hingePart.positionMm.x,
      y: hingePart.positionMm.y,
    };
    const common = {
      face: "F1" as const,
      hardwareId: hingePart.hardwareId,
      relatedPartIds: [door.id, hingePart.id, ...(mountingPlate ? [mountingPlate.id] : [])],
      parameters: {
        doorPartId: door.id,
        hingePartId: hingePart.id,
        hingeSide: door.interactive?.hingeSide ?? null,
        clearanceMm: door.clearanceMm ?? null,
        quantity: 1,
        resolvedApplicationId: resolvedApplication?.id ?? null,
        applicationRuleId: resolvedApplication?.ruleId ?? null,
        applicationType: resolvedApplication?.applicationType ?? null,
      },
    } satisfies Partial<JoineryDefinition>;

    return [
      op(instance, door.id, "hinge-cup", index, {
        id: `${instance.id}:${logicalHinge}:cup`,
        positionMm,
        ...common,
        notes: "Copo de dobradiça derivado da peça de ferragem existente; parâmetros industriais ausentes não são inventados.",
      }),
      op(instance, door.id, "hinge-fixing", index, {
        id: `${instance.id}:${logicalHinge}:fixing`,
        positionMm,
        tool: "assembly-only",
        ...common,
        notes: "Fixação da dobradiça/placa não promove pré-furo sem pilot-hole documentado.",
      }),
      ...(mountingPlate
        ? [
            op(instance, mountingPlate.id, "mounting-plate-placement", index, {
              id: `${instance.id}:${logicalHinge}:plate-placement`,
              positionMm,
              tool: "assembly-only",
              hardwareId: mountingPlate.hardwareId,
              relatedPartIds: [door.id, hingePart.id, mountingPlate.id],
              parameters: {
                doorPartId: door.id,
                hingePartId: hingePart.id,
                mountingPlatePartId: mountingPlate.id,
                quantity: 1,
                resolvedApplicationId: resolvedApplication?.id ?? null,
                applicationRuleId: resolvedApplication?.ruleId ?? null,
                applicationType: resolvedApplication?.applicationType ?? null,
              },
              notes: "Posicionamento da placa de montagem como componente separado.",
            }),
            op(instance, mountingPlate.id, "mounting-plate-fixing", index, {
              id: `${instance.id}:${logicalHinge}:plate-fixing`,
              positionMm,
              tool: "assembly-only",
              hardwareId: mountingPlate.hardwareId,
              relatedPartIds: [door.id, hingePart.id, mountingPlate.id],
              parameters: {
                doorPartId: door.id,
                hingePartId: hingePart.id,
                mountingPlatePartId: mountingPlate.id,
                quantity: 1,
                resolvedApplicationId: resolvedApplication?.id ?? null,
                applicationRuleId: resolvedApplication?.ruleId ?? null,
                applicationType: resolvedApplication?.applicationType ?? null,
              },
              notes: "Fixação por parafuso documentada como fastener; pré-furo não inferido.",
            }),
          ]
        : []),
    ];
  });
}

function goldenConstructionOperations(instance: FurnitureInstance): JoineryDefinition[] {
  const operations: JoineryDefinition[] = [];
  const parts = instance.parts;
  const doors = parts.filter((part) => part.role === "door");
  const toeKick = parts.find((part) => part.hardwareId === "toe-kick-profile");
  const feet = parts.filter((part) => part.hardwareId === "leg-adjustable");
  const clips = parts.filter((part) => part.hardwareId === "toe-kick-clip");
  const shelfParts = parts.filter((part) => part.role === "shelf");
  const shelfSupports = parts.filter((part) => part.hardwareId === "shelf-support");

  for (const door of doors) {
    operations.push(...goldenHingeOperations(instance, door));
    const handle = parts.find(
      (part) => part.hardwareId === instance.hardwareOverrides.handle && part.groupId === door.groupId,
    );
    if (handle?.hardwareId === "handle-gola") {
      const geometry = handle.hardwareGeometry;
      operations.push(
        op(instance, door.id, "gola-profile", Number(semanticPartKey(door.id).replace("door-", "")), {
          id: `${instance.id}:${semanticPartKey(door.id)}:gola-profile`,
          hardwareId: handle.hardwareId,
          positionMm: { x: handle.positionMm.x, y: handle.positionMm.y },
          relatedPartIds: [door.id, handle.id],
          parameters: {
            handlePartId: handle.id,
            profileWidthMm: handle.dimensionsMm.width,
            profileHeightMm: handle.dimensionsMm.height,
            profileDepthMm: handle.dimensionsMm.depth,
            lipMm: geometry?.kind === "gola" ? geometry.lipMm : null,
            recessMm: geometry?.kind === "gola" ? geometry.recessMm : null,
            continuous: true,
          },
          notes: "Perfil Gola semântico; não é tratado apenas como mesh visual.",
        }),
      );
    }
  }

  if (toeKick) {
    operations.push(
      op(instance, toeKick.id, "toe-kick-profile", 1, {
        id: `${instance.id}:toe-kick:profile`,
        hardwareId: toeKick.hardwareId,
        relatedPartIds: [toeKick.id],
        positionMm: { x: toeKick.positionMm.x, y: toeKick.positionMm.y },
        parameters: {
          profileWidthMm: toeKick.dimensionsMm.width,
          profileHeightMm: toeKick.dimensionsMm.height,
          profileDepthMm: toeKick.dimensionsMm.depth,
          groupId: toeKick.groupId ?? null,
        },
        notes: "Rodapé/perfil derivado da peça existente do módulo.",
      }),
    );
  }

  feet.forEach((foot, index) => {
    operations.push(
      op(instance, foot.id, "adjustable-foot", index + 1, {
        id: `${instance.id}:${semanticPartKey(foot.id)}:install`,
        hardwareId: foot.hardwareId,
        relatedPartIds: [foot.id, ...(toeKick ? [toeKick.id] : [])],
        positionMm: { x: foot.positionMm.x, y: foot.positionMm.y },
        parameters: {
          footPartId: foot.id,
          supportsPartId: toeKick?.id ?? null,
          xMm: foot.positionMm.x,
          yMm: foot.positionMm.y,
          zMm: foot.positionMm.z,
        },
        notes: "Pé regulável derivado da peça hardware existente; relação com rodapé preservada.",
      }),
    );
  });

  clips.forEach((clip, index) => {
    const nearestFoot = feet
      .slice()
      .sort((a, b) => Math.abs(a.positionMm.x - clip.positionMm.x) - Math.abs(b.positionMm.x - clip.positionMm.x))[0];
    operations.push(
      op(instance, toeKick?.id ?? clip.id, "toe-kick-clip", index + 1, {
        id: `${instance.id}:${semanticPartKey(clip.id)}:install`,
        hardwareId: clip.hardwareId,
        relatedPartIds: [clip.id, ...(nearestFoot ? [nearestFoot.id] : []), ...(toeKick ? [toeKick.id] : [])],
        positionMm: { x: clip.positionMm.x, y: clip.positionMm.y },
        parameters: {
          clipPartId: clip.id,
          footPartId: nearestFoot?.id ?? null,
          toeKickPartId: toeKick?.id ?? null,
        },
        notes: "Clip do rodapé relacionado ao pé mais próximo e ao perfil do rodapé.",
      }),
    );
  });

  shelfSupports.forEach((support, index) => {
    const shelf = shelfParts.find(
      (candidate) => candidate.id === support.groupId || semanticPartKey(candidate.id) === support.groupId,
    );
    operations.push(
      op(instance, shelf?.id ?? support.id, "shelf-support", index + 1, {
        id: `${instance.id}:${semanticPartKey(support.id)}:install`,
        hardwareId: support.hardwareId,
        relatedPartIds: [support.id, ...(shelf ? [shelf.id] : [])],
        positionMm: { x: support.positionMm.x, y: support.positionMm.y },
        parameters: {
          supportPartId: support.id,
          shelfPartId: shelf?.id ?? null,
          xMm: support.positionMm.x,
          yMm: support.positionMm.y,
          zMm: support.positionMm.z,
        },
        notes: "Suporte de prateleira derivado da mesma prateleira e ferragem construídas.",
      }),
    );
  });

  return operations;
}

function legacyOp(
  instance: FurnitureInstance,
  partId: string,
  kind: JoineryDefinition["kind"],
  index: number,
  overrides: Partial<JoineryDefinition> = {},
): JoineryDefinition {
  const legacyDefaults: Partial<JoineryDefinition> = {
    face: "F1",
    positionMm: { x: LEGACY_EDGE_OFFSET_MM, y: LEGACY_EDGE_OFFSET_MM },
    diameterMm: kind === "dowel" ? 8 : kind.startsWith("minifix") ? 15 : kind === "confirmat" ? 5 : kind === "hinge-cup" ? 35 : kind === "handle-through" ? 5 : undefined,
    depthMm: kind === "hinge-cup" ? 12.5 : kind === "dowel" ? 30 : kind === "handle-through" ? 18 : kind === "slide-fixing" ? 12 : 13,
    tool: kind === "hinge-cup" ? "broca-forstner-35" : kind === "dowel" ? "broca-8" : kind.startsWith("minifix") ? "broca-15" : kind === "handle-through" ? "broca-5" : kind === "slide-fixing" ? "broca-5" : "sem-ferramenta-cam",
    parameters: { placementRuleId: LEGACY_EDGE_OFFSET_RULE_ID, placementRuleStatus: "LEGACY_ISOLATED" },
  };
  return op(instance, partId, kind, index, {
    ...legacyDefaults,
    source: "LEGACY_DEFAULT",
    truthStatus: "INCOMPLETE",
    unknownParameters: ["legacyDefaultNotManufacturerVerified"],
    ruleId: "legacy-default",
    ...overrides,
  });
}

function legacyBuildJoineryOperations(instance: FurnitureInstance): JoineryDefinition[] {
  const operations: JoineryDefinition[] = [];
  const parts = instance.parts;
  const structural = parts.filter((part) => ["side-left", "side-right", "base", "top", "shelf", "divider", "back"].includes(part.role));
  const fronts = parts.filter((part) => part.role === "door" || part.role === "drawer-front");
  const drawerParts = parts.filter((part) => part.role === "drawer-side" || part.role === "drawer-bottom");
  structural.forEach((part, index) => {
    operations.push(legacyOp(instance, part.id, "confirmat", index, { notes: "LEGACY_DEFAULT: structural legacy adapter." }));
    operations.push(legacyOp(instance, part.id, "dowel", index, { notes: "LEGACY_DEFAULT: structural legacy adapter." }));
  });
  fronts.forEach((part, index) => {
    if (part.role === "door") {
      operations.push(legacyOp(instance, part.id, "hinge-cup", index, { hardwareId: instance.hardwareOverrides.hinge, positionMm: { x: 21.5, y: Math.max(80, part.dimensionsMm.height - 100) }, notes: "LEGACY_DEFAULT: generic hinge geometry." }));
      operations.push(legacyOp(instance, part.id, "hinge-fixing", index, { hardwareId: instance.hardwareOverrides.hinge, positionMm: { x: 37, y: Math.max(80, part.dimensionsMm.height - 100) } }));
    }
    if (part.role === "drawer-front" && instance.hardwareOverrides.handle) {
      operations.push(legacyOp(instance, part.id, "handle-through", index, { hardwareId: instance.hardwareOverrides.handle, diameterMm: 5, depthMm: 18, tool: "broca-5", notes: "LEGACY_DEFAULT: generic handle drilling." }));
    }
  });
  drawerParts.forEach((part, index) => operations.push(legacyOp(instance, part.id, "slide-fixing", index, { hardwareId: part.hardwareId ?? instance.hardwareOverrides.slide, diameterMm: 5, depthMm: 12, tool: "broca-5", notes: "LEGACY_DEFAULT: generic slide fixing." })));
  return operations;
}

function professionalReadiness(instance: FurnitureInstance, application: StructuralJoineryApplication): JoineryCapabilityReadiness[] {
  const profile = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId);
  if (!profile) return [];
  const hasStructuralRule = Boolean(application.rule && application.resolution);
  const structuralJoints = application.resolution?.joints ?? [];
  const structuralAssemblyReady = hasStructuralRule && structuralJoints.length > 0 && structuralJoints.every((joint) => joint.assemblyStatus === "READY");
  const machiningMissing = [...new Set(structuralJoints.flatMap((joint) => joint.unknownParameters))];
  const readiness: JoineryCapabilityReadiness[] = [{
    scope: "carcass-structural",
    status: structuralAssemblyReady ? "READY" : "INCOMPLETE",
    missingParameters: structuralAssemblyReady ? [] : hasStructuralRule ? (application.diagnostics.length > 0 ? application.diagnostics : ["resolvedStructuralJoinery"]) : ["structuralJoineryRule"],
    source: "PROFILE_RULE",
    reason: structuralAssemblyReady ? "Relações estruturais resolvidas pelo profile; shelf, back e toe-kick permanecem boundaries separadas." : "Nenhuma cadeia estrutural profissional completa foi resolvida.",
  }];
  if (hasStructuralRule) {
    readiness.push({
      scope: "carcass-structural-machining",
      status: machiningMissing.length === 0 ? "READY" : "INCOMPLETE",
      missingParameters: machiningMissing,
      source: "MANUFACTURER_SPEC",
      reason: machiningMissing.length === 0 ? "Todos os parâmetros industriais necessários estão documentados." : "A relação de assembly está resolvida, mas a furação do bolt não é inferida a partir de dados ausentes.",
    });
  }
  if (!profile.hardwareApplicationRule && instance.parts.some((part) => part.role === "door")) {
    readiness.push({ scope: "hardware-application", status: "INCOMPLETE", missingParameters: ["hardwareApplicationRule"], source: "PROFILE_RULE", reason: "Profile profissional sem regra declarativa de hardware; não gerar dobradiça genérica." });
  }
  if (instance.parts.some((part) => part.role === "drawer-front") && instance.hardwareOverrides.handle) {
    readiness.push({ scope: "handle-application", status: "INCOMPLETE", missingParameters: ["handleApplicationRule", "manufacturerHandleDrillingTemplate"], source: "PROFILE_RULE", reason: "Hardware visual não implica furação sem regra de aplicação." });
  }
  if (instance.parts.some((part) => part.role === "drawer-side")) {
    readiness.push({ scope: "drawer-runner-application", status: profile.drawerIndustrialSlideRule ? "READY" : "INCOMPLETE", missingParameters: profile.drawerIndustrialSlideRule ? [] : ["drawerSlideApplicationRule"], source: profile.drawerIndustrialSlideRule ? "MANUFACTURER_SPEC" : "PROFILE_RULE", reason: profile.drawerIndustrialSlideRule ? "Runner industrial selecionado pelo profile." : "Nenhuma regra de corrediça declarada." });
  }
  return readiness;
}

function professionalBuildJoineryOperations(instance: FurnitureInstance): JoineryDefinition[] {
  const profile = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId);
  if (!profile) return [];
  const application = resolveStructuralJoineryForInstance(instance);
  const operations: JoineryDefinition[] = [];
  operations.push(...structuralJoineryOperations(instance, application));
  if (profile.hardwareApplicationRule) {
    operations.push(...goldenConstructionOperations(instance));
  }
  if (profile.drawerIndustrialSlideRule) {
    const sides = instance.parts.filter((part) => part.role === "drawer-side");
    sides.forEach((part, index) => operations.push(op(instance, part.id, "runner-installation", index, {
      id: `${instance.id}:${semanticPartKey(part.id)}:runner-installation-${index}`,
      source: "MANUFACTURER_SPEC",
      truthStatus: "READY",
      unknownParameters: [],
      ruleId: profile.drawerIndustrialSlideRule?.id,
      manufacturerSpecId: instance.hardwareVariantIds?.slide,
      hardwareId: part.hardwareId ?? instance.hardwareOverrides.slide,
      hardwareVariantId: instance.hardwareVariantIds?.slide,
      relatedPartIds: [part.id],
      notes: "Instalação semântica do runner MOVENTO; qualquer candidato CNC é downstream e separado.",
    })));
  }
  return operations;
}

export function buildJoineryReport(instances: FurnitureInstance[]): JoineryReport {
  const operations: JoineryDefinition[] = [];
  const readiness: JoineryCapabilityReadiness[] = [];
  const warnings: string[] = [];
  const structuralJoinery: StructuralJoineryResolution[] = [];
  for (const instance of instances) {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId);
    if (profile) {
      const application = resolveStructuralJoineryForInstance(instance);
      operations.push(...professionalBuildJoineryOperations(instance));
      readiness.push(...professionalReadiness(instance, application));
      if (application.resolution) structuralJoinery.push(application.resolution);
    } else {
      operations.push(...legacyBuildJoineryOperations(instance));
    }
    if (instance.moduleDefinitionId.includes("sink") && !instance.parts.some((part) => part.volumeType === "technical")) warnings.push(`${instance.name}: zona hidráulica sem volume técnico associado.`);
  }
  return { operations, readiness, warnings, structuralJoinery };
}
