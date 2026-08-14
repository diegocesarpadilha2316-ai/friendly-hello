import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { PartDefinition } from "../contracts/PartDefinition";

export interface OpeningCollisionWarning {
  partId: string;
  partName: string;
  otherInstanceId: string;
  message: string;
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };

function boundsForPart(instance: FurnitureInstance, part: PartDefinition, opening = false): Bounds {
  const x = instance.positionMm.x + part.positionMm.x;
  const y = instance.positionMm.y + part.positionMm.y;
  let z = instance.positionMm.z + part.positionMm.z;
  let width = part.dimensionsMm.width;
  let height = part.dimensionsMm.height;
  let depth = part.dimensionsMm.depth;

  if (opening && part.interactive) {
    if (part.interactive.type === "drawer") {
      const travel = part.interactive.maxTravelMm ?? 0;
      depth += travel;
      z += travel / 2;
    } else if (part.interactive.type === "door") {
      const sweep = depth * 0.72;
      depth += sweep;
      z += sweep / 2;
    } else if (part.interactive.type === "flap") {
      height += depth;
    }
  }

  const clearance = 0;
  return {
    minX: x - width / 2 - clearance,
    maxX: x + width / 2 + clearance,
    minY: y - height / 2 - clearance,
    maxY: y + height / 2 + clearance,
    minZ: z - depth / 2 - clearance,
    maxZ: z + depth / 2 + clearance,
  };
}

function intersects(a: Bounds, b: Bounds) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function validateOpeningClearance(instance: FurnitureInstance, others: FurnitureInstance[], partId?: string): OpeningCollisionWarning[] {
  const requestedGroupId = partId ? instance.parts.find((part) => part.id === partId)?.groupId ?? partId : undefined;
  const openingParts = instance.parts.filter((part) => part.interactive && part.interactive.type !== "none" && (!requestedGroupId || part.id === partId || part.groupId === requestedGroupId));
  const warnings: OpeningCollisionWarning[] = [];
  const checkedGroups = new Set<string>();

  for (const part of openingParts) {
    const groupKey = part.groupId ?? part.id;
    if (checkedGroups.has(groupKey)) continue;
    checkedGroups.add(groupKey);
    const openingBounds = boundsForPart(instance, part, true);
    for (const other of others) {
      for (const otherPart of other.parts.filter((candidate) => candidate.volumeType !== "opening")) {
        if (!intersects(openingBounds, boundsForPart(other, otherPart))) continue;
        warnings.push({
          partId: part.id,
          partName: part.name,
          otherInstanceId: other.id,
          message: `Porta/gaveta de ${part.name} colide com ${other.name} durante abertura.`,
        });
        break;
      }
      if (warnings.some((warning) => warning.partId === part.id)) break;
    }
  }

  return warnings;
}
