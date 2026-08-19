import type {
  ResolvedDoorInstallation,
  ResolvedHardwareApplication,
} from "../contracts/HardwareApplicationRule";
import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import { HardwareRegistry } from "../registry/HardwareRegistry";
import { GOLDEN_71B3550_173H7100_RULE } from "../families/kitchen/applicationRules";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE } from "../families/kitchen/frontLayoutRules";
import { resolveFrontLayout } from "./frontLayoutResolver";
import {
  resolveDoorHardwarePlacement,
  validateDoorHardwarePlacementParts,
} from "./hardwarePlacementResolver";

const GOLDEN_MODULE_ID = "kitchen-base-2-doors";

function stableDoorNumber(partId: string) {
  const match = partId.match(/door-(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function resolveGoldenHardwareApplication(
  instance: FurnitureInstance,
): ResolvedHardwareApplication | undefined {
  if (instance.moduleDefinitionId !== GOLDEN_MODULE_ID) return undefined;

  const rule = GOLDEN_71B3550_173H7100_RULE;
  const hingeVariantId = instance.hardwareVariantIds?.hinge;
  const plateVariantId = instance.hardwareVariantIds?.mountingPlate;
  const hingeVariant = HardwareRegistry.getManufacturingVariant(instance.hardwareOverrides.hinge, hingeVariantId);
  const plateVariant = HardwareRegistry.getManufacturingVariant(instance.hardwareOverrides.mountingPlate ?? "mounting-plate-37-32", plateVariantId);
  const hingeSpec = hingeVariant?.manufacturingSpec.kind === "hinge" ? hingeVariant.manufacturingSpec : undefined;
  const plateSpec = plateVariant?.manufacturingSpec.kind === "mounting-plate" ? plateVariant.manufacturingSpec : undefined;
  const hingeCompatible = hingeVariant && "compatibleMountingPlateVariantIds" in hingeVariant
    ? hingeVariant.compatibleMountingPlateVariantIds.includes(plateVariantId ?? "")
    : false;
  const plateCompatible = plateVariant && "compatibleHardwareVariantIds" in plateVariant
    ? plateVariant.compatibleHardwareVariantIds.includes(hingeVariantId ?? "")
    : false;
  const compatibilityStatus =
    hingeVariantId === undefined || plateVariantId === undefined
      ? "INCOMPLETE"
      : hingeCompatible && plateCompatible
        ? "READY"
        : "INVALID";

  const doors = instance.parts
    .filter((part) => part.role === "door")
    .sort((a, b) => stableDoorNumber(a.id) - stableDoorNumber(b.id));
  const sideLeft = instance.parts.find((part) => part.role === "side-left");
  const sideRight = instance.parts.find((part) => part.role === "side-right");
  const sideThicknessMm = sideLeft?.thicknessMm ?? sideRight?.thicknessMm;
  const doorThicknessMm = doors[0]?.thicknessMm;
  const doorGapMm = doors.length > 1
    ? Math.max(0, doors[1].positionMm.x - doors[0].positionMm.x - (doors[0].dimensionsMm.width + doors[1].dimensionsMm.width) / 2)
    : undefined;
  const outerGapsMm = doors.length > 0
    ? {
        left: doors[0].positionMm.x - doors[0].dimensionsMm.width / 2 + instance.dimensionsMm.width / 2,
        right: instance.dimensionsMm.width / 2 - (doors[doors.length - 1].positionMm.x + doors[doors.length - 1].dimensionsMm.width / 2),
      }
    : undefined;
  const centralGapMm = doorGapMm;
  const revealMm = outerGapsMm && Math.abs(outerGapsMm.left - outerGapsMm.right) < 0.001
    ? outerGapsMm.left
    : undefined;
  const overlayMm = sideThicknessMm !== undefined && revealMm !== undefined
    ? sideThicknessMm - revealMm
    : undefined;
  const doorHeights = doors.map((door) => door.dimensionsMm.height);
  const firstDoorBottomMm = doors[0]
    ? doors[0].positionMm.y - doors[0].dimensionsMm.height / 2
    : undefined;
  const derivedToeKickMm = firstDoorBottomMm === undefined
    ? 0
    : firstDoorBottomMm - GOLDEN_2_DOOR_FRONT_LAYOUT_RULE.bottomRevealMm;
  const frontLayout = doors.length > 0
    ? resolveFrontLayout(
        {
          moduleDefinitionId: instance.moduleDefinitionId,
          cabinetWidthMm: instance.dimensionsMm.width,
          cabinetHeightMm: instance.dimensionsMm.height,
          cabinetDepthMm: instance.dimensionsMm.depth,
          frontBottomMm: derivedToeKickMm,
          frontTopMm: instance.dimensionsMm.height,
          frontZMm: doors[0].positionMm.z,
        },
        GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
      )
    : undefined;
  const placements = frontLayout
    ? doors.map((door, index) => resolveDoorHardwarePlacement({
        frontLayout,
        applicationRule: rule,
        doorIndex: index,
        doorPartId: door.id,
        toeKickMm: derivedToeKickMm,
        cabinetDepthMm: instance.dimensionsMm.depth,
        doorThicknessMm: door.thicknessMm ?? 0,
        targetSidePartId: door.interactive?.hingeSide === "left" ? sideLeft?.id : sideRight?.id,
      }))
    : [];
  const hingeCountByDoor = placements.map((placement) => placement.hingeCount);
  const verticalHingeOffsetsMm = placements.map((placement) => placement.verticalOffsetsMm);
  const verticalHingePositionsMm = placements.map((placement) => placement.hingePositionsMm.map((point) => point.y));

  const placementConsistency = placements.flatMap((placement) =>
    validateDoorHardwarePlacementParts(placement, instance.parts).issues,
  );
  const doorInstallations: ResolvedDoorInstallation[] = doors.map((door, index) => {
    const placement = placements[index];
    return {
      doorPartId: door.id,
      hingeSide: placement?.hingeSide ?? door.interactive?.hingeSide ?? (index === 0 ? "left" : "right"),
      targetSidePartId: placement?.targetSidePartId,
      hingeCount: placement?.hingeCount ?? 0,
      verticalOffsetsMm: placement?.verticalOffsetsMm ?? [],
      hingePositionsMm: placement?.hingePositionsMm.map((point) => point.y) ?? [],
      hingePartIds: placement?.hingePartIds ?? [],
      mountingPlatePartIds: placement?.mountingPlatePartIds ?? [],
    };
  });

  const diagnostics: string[] = [];
  if (compatibilityStatus === "INCOMPLETE") diagnostics.push("Variante de dobradiça e/ou placa não selecionada.");
  if (compatibilityStatus === "INVALID") diagnostics.push("Combinação de variante de dobradiça e placa incompatível.");
  if (!doorThicknessMm) diagnostics.push("Espessura da porta não derivada.");
  if (revealMm === undefined) diagnostics.push("Reveal externo não pôde ser derivado simetricamente.");
  if (frontLayout?.validationStatus !== "READY") diagnostics.push(...(frontLayout?.diagnostics ?? []));
  if (placementConsistency.length > 0) {
    diagnostics.push(`Hardware visual diverge do placement resolvido em ${placementConsistency.length} eixo(s).`);
  }
  const selectedBoringDistanceMm = undefined;
  diagnostics.push("Boring distance não selecionado pela regra de aplicação.");

  const applicationStatus = compatibilityStatus === "INVALID" ? "INVALID" : selectedBoringDistanceMm === undefined ? "INCOMPLETE" : "READY";
  const assemblyStatus = compatibilityStatus === "READY" && placementConsistency.length === 0 && doorInstallations.every((installation) => installation.targetSidePartId !== undefined) ? "READY" : placementConsistency.length > 0 ? "INVALID" : compatibilityStatus;
  const machiningStatus = applicationStatus === "READY" ? "READY" : "INCOMPLETE";

  return {
    id: `${instance.id}:${rule.id}`,
    ruleId: rule.id,
    instanceId: instance.id,
    moduleDefinitionId: instance.moduleDefinitionId,
    hardwareSlot: rule.hardwareSlot,
    hardwareVariantId: hingeVariantId,
    mountingPlateVariantId: plateVariantId,
    applicationType: compatibilityStatus === "READY" ? rule.applicationType : undefined,
    applicationStatus,
    compatibilityStatus,
    assemblyStatus,
    machiningStatus,
    missingParameters: unique([
      ...(compatibilityStatus === "INCOMPLETE" ? ["hardwareVariantId", "mountingPlateVariantId"] : []),
      ...(compatibilityStatus === "INVALID" ? ["compatibleMountingPlateVariantId"] : []),
      ...(doorThicknessMm === undefined ? ["doorThicknessMm"] : []),
      ...(revealMm === undefined ? ["revealMm"] : []),
      ...(overlayMm === undefined ? ["overlayMm"] : []),
      ...(selectedBoringDistanceMm === undefined ? ["selectedBoringDistanceMm"] : []),
    ]),
    diagnostics,
    parameters: {
      cabinetWidthMm: instance.dimensionsMm.width,
      cabinetSideThicknessMm: sideThicknessMm,
      doorThicknessMm,
      doorGapMm,
      centralGapMm,
      outerGapsMm,
      overlayMm,
      revealMm,
      selectedBoringDistanceMm,
      boringDistanceRangeMm: hingeSpec?.cup.boringDistanceRangeMm,
    },
    derivedValues: {
      doorWidthMm: doors.map((door) => door.dimensionsMm.width),
      doorHeightMm: doorHeights,
      hingeCountByDoor,
      verticalHingeOffsetsMm,
      verticalHingePositionsMm,
      hingeEdgeOffsetMm: hingeSpec ? rule.hingeEdgeOffsetMm : undefined,
    },
    doorInstallations,
    applicationRuleProvenance: rule.provenance,
    manufacturerProvenance: hingeSpec?.provenance ?? plateSpec?.provenance,
  };
}
