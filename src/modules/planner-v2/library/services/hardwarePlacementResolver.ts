import type { PartDefinition } from "../contracts/PartDefinition";
import type {
  HardwarePlacementConsistency,
  HardwarePlacementConsistencyIssue,
  ResolvedDoorHardwarePlacement,
} from "../contracts/HardwarePlacement";
import type { DoorHardwarePlacementInput } from "../contracts/HardwarePlacement";

const DEFAULT_TOLERANCE_MM = 0.001;

export function resolveDoorHardwarePlacement(
  input: DoorHardwarePlacementInput,
): ResolvedDoorHardwarePlacement {
  const { frontLayout, applicationRule } = input;
  const diagnostics: string[] = [];
  const edge = frontLayout.doorEdgesMm[input.doorIndex];
  const hingeSide = frontLayout.hingeSides[input.doorIndex];
  const doorWidthMm = frontLayout.doorWidthsMm[input.doorIndex];
  const doorBottomMm = input.toeKickMm + frontLayout.bottomRevealMm;
  const doorHeightMm = frontLayout.doorHeightMm;
  const validDoor = Boolean(edge && hingeSide && doorWidthMm && doorWidthMm > 0 && doorHeightMm > 0);

  if (!validDoor) diagnostics.push(`Porta ${input.doorIndex + 1} não possui geometria frontal resolvida.`);
  if (frontLayout.validationStatus !== "READY") {
    diagnostics.push(`Front Layout ${frontLayout.id} não está READY: ${frontLayout.validationStatus}.`);
  }
  if (input.applicationRule.hingeEdgeOffsetMm < 0 || input.applicationRule.verticalEdgeOffsetMm < 0) {
    diagnostics.push("Offsets de aplicação não podem ser negativos.");
  }

  const hingeCount = validDoor && doorHeightMm >= applicationRule.threeHingeThresholdDoorHeightMm ? 3 : 2;
  const verticalOffsetsMm = hingeCount === 3
    ? [applicationRule.verticalEdgeOffsetMm, doorHeightMm / 2, doorHeightMm - applicationRule.verticalEdgeOffsetMm]
    : [applicationRule.verticalEdgeOffsetMm, doorHeightMm - applicationRule.verticalEdgeOffsetMm];
  const hingeX = edge && hingeSide === "left"
    ? edge.left + applicationRule.hingeEdgeOffsetMm
    : edge
      ? edge.right - applicationRule.hingeEdgeOffsetMm
      : 0;
  const hingePositionsMm = validDoor
    ? verticalOffsetsMm.map((offsetMm) => ({ x: hingeX, y: doorBottomMm + offsetMm }))
    : [];
  const mountingPlatePositionsMm = hingePositionsMm.map((point) => ({ ...point }));

  return {
    id: `${frontLayout.id}:${input.doorPartId}:hardware-placement`,
    doorPartId: input.doorPartId,
    hingeSide: hingeSide ?? "left",
    targetSidePartId: input.targetSidePartId,
    hingeCount,
    verticalOffsetsMm,
    hingeEdgeOffsetMm: applicationRule.hingeEdgeOffsetMm,
    hingePositionsMm,
    mountingPlatePositionsMm,
    hingePartIds: verticalOffsetsMm.map((_, index) => `${input.doorPartId}:hinge-${index + 1}`),
    mountingPlatePartIds: verticalOffsetsMm.map((_, index) => `${input.doorPartId}:mounting-plate-${index + 1}`),
    doorBottomMm,
    doorHeightMm,
    status: diagnostics.length > 0 ? "INVALID" : "READY",
    diagnostics,
  };
}

function addAxisIssue(
  issues: HardwarePlacementConsistencyIssue[],
  part: PartDefinition | undefined,
  expected: { x: number; y: number },
  toleranceMm: number,
) {
  if (!part) {
    issues.push({
      partId: "missing",
      axis: "x",
      expectedMm: expected.x,
      actualMm: Number.NaN,
      deltaMm: Number.POSITIVE_INFINITY,
    });
    return;
  }
  for (const axis of ["x", "y"] as const) {
    const actualMm = part.positionMm[axis];
    const expectedMm = expected[axis];
    const deltaMm = actualMm - expectedMm;
    if (Math.abs(deltaMm) > toleranceMm) {
      issues.push({ partId: part.id, axis, expectedMm, actualMm, deltaMm });
    }
  }
}

export function validateDoorHardwarePlacementParts(
  placement: ResolvedDoorHardwarePlacement,
  parts: PartDefinition[],
  toleranceMm = DEFAULT_TOLERANCE_MM,
): HardwarePlacementConsistency {
  const byId = new Map(parts.map((part) => [part.id, part]));
  const issues: HardwarePlacementConsistencyIssue[] = [];
  placement.hingePartIds.forEach((partId, index) => {
    addAxisIssue(issues, byId.get(partId), placement.hingePositionsMm[index], toleranceMm);
  });
  placement.mountingPlatePartIds.forEach((partId, index) => {
    addAxisIssue(issues, byId.get(partId), placement.mountingPlatePositionsMm[index], toleranceMm);
  });
  return { valid: issues.length === 0, toleranceMm, issues };
}

export { DEFAULT_TOLERANCE_MM };
