import type {
  CountertopSpan,
  KitchenLayoutResult,
  KitchenWall,
  LayoutAuditIssue,
  LayoutModuleSpec,
  LayoutPlacement,
} from "./LayoutTypes";

const EPSILON_MM = 2;
const BASE_HEIGHT_MM = 870;
const BASE_DEPTH_MM = 580;
const COUNTERTOP_THICKNESS_MM = 20;
const UPPER_CLEARANCE_MM = 600;

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number, tolerance = EPSILON_MM) {
  return aStart < bEnd - tolerance && aEnd > bStart + tolerance;
}

function isBase(kind?: string, anchor?: string) {
  return anchor === "floor" && ["base", "drawer", "sink", "cooktop", "corner", "countertop", "peninsula"].includes(kind ?? "");
}

function isUpper(kind?: string, anchor?: string) {
  return anchor === "wall" && (kind === "upper" || kind === "complement" || kind === "hood");
}

export function createTestWall(widthMm = 6200, heightMm = 3000, roomDepthMm = 5000): KitchenWall {
  return {
    id: "wall-test-linear",
    widthMm,
    heightMm,
    depthMm: 100,
    originMm: { x: -widthMm / 2, y: 0, z: -roomDepthMm / 2 + 50 },
    openings: [],
  };
}

export function layoutKitchenModules(specs: LayoutModuleSpec[], wall: KitchenWall): KitchenLayoutResult {
  const issues: LayoutAuditIssue[] = [];
  const placements: LayoutPlacement[] = [];
  const countertops: CountertopSpan[] = [];
  const applianceZones = [] as KitchenLayoutResult["applianceZones"];
  const technicalRelationships: KitchenLayoutResult["technicalRelationships"] = [];
  const ordered = [...specs].sort((a, b) => a.relation.sequenceIndex - b.relation.sequenceIndex);
  const byId = new Map<string, LayoutPlacement>();
  let cursorX = wall.originMm.x;

  for (const spec of ordered) {
    const { width, height, depth } = spec.dimensionsMm;
    const relation = spec.relation;
    const isFloorModule = isBase(spec.kind, relation.anchor) || relation.anchor === "appliance-zone" || spec.kind === "cooktop";
    const isWallModule = isUpper(spec.kind, relation.anchor);
    const clearance = relation.clearanceMm ?? 0;
    const anchorPlacement = relation.anchorModuleId ? byId.get(relation.anchorModuleId) : undefined;
    const startX = isWallModule && anchorPlacement
      ? anchorPlacement.startX + Math.max(0, (anchorPlacement.endX - anchorPlacement.startX - width) / 2)
      : cursorX + clearance;
    const endX = startX + width;
    const bottomY = isWallModule ? BASE_HEIGHT_MM + UPPER_CLEARANCE_MM : 0;
    const topY = bottomY + height;
    const depthMm = depth || (isWallModule ? 350 : BASE_DEPTH_MM);
    const positionMm = {
      x: (startX + endX) / 2,
      y: bottomY,
      z: wall.originMm.z + depthMm / 2,
    };
    const supported = isFloorModule ? bottomY === 0 : isWallModule ? Boolean(relation.anchorModuleId || relation.wallId === wall.id) : false;
    let collision = false;

    if (relation.wallId !== wall.id) {
      issues.push({ code: "unknown-wall", message: `Módulo ${spec.id} aponta para uma parede inexistente.`, moduleId: spec.id });
    }
    if (endX > wall.originMm.x + wall.widthMm + EPSILON_MM || startX < wall.originMm.x - EPSILON_MM) {
      issues.push({ code: "module-outside-wall", message: `Módulo ${spec.id} ultrapassa os limites da parede.`, moduleId: spec.id });
      collision = true;
    }
    for (const opening of wall.openings) {
      const openingStart = wall.originMm.x + opening.startX;
      const openingEnd = wall.originMm.x + opening.endX;
      if (overlaps(startX, endX, openingStart, openingEnd) && bottomY < opening.topY && topY > opening.bottomY) {
        issues.push({ code: "module-wall-opening", message: `Módulo ${spec.id} atravessa a abertura ${opening.id}.`, moduleId: spec.id });
        collision = true;
      }
    }
    for (const previous of placements) {
      if (previous.wallId !== relation.wallId) continue;
      const verticalOverlap = bottomY < previous.topY - EPSILON_MM && topY > previous.bottomY + EPSILON_MM;
      const depthOverlap = Math.abs(positionMm.z - previous.positionMm.z) < (depthMm + previous.depthMm) / 2 - EPSILON_MM;
      if (verticalOverlap && depthOverlap && overlaps(startX, endX, previous.startX, previous.endX)) {
        issues.push({ code: "module-collision", message: `Módulo ${spec.id} colide com ${previous.moduleId}.`, moduleId: spec.id });
        collision = true;
      }
    }
    if (!supported) {
      issues.push({ code: "unsupported-module", message: `Módulo ${spec.id} não está apoiado ou ancorado.`, moduleId: spec.id });
    }

    const placement: LayoutPlacement = {
      moduleId: spec.id,
      moduleDefinitionId: spec.moduleId,
      wallId: relation.wallId,
      anchor: relation.anchor,
      sequenceIndex: placements.length,
      startX,
      endX,
      bottomY,
      topY,
      depthMm,
      positionMm,
      previousModuleId: placements.at(-1)?.moduleId,
      nextModuleId: undefined,
      supported,
      collision,
      clearanceMm: clearance,
    };
    if (placements.length > 0) placements[placements.length - 1].nextModuleId = spec.id;
    placements.push(placement);
    byId.set(spec.id, placement);
    if (isFloorModule || relation.anchor === "appliance-zone") {
      cursorX = endX;
    } else if (isWallModule) {
      const anchor = relation.anchorModuleId ? byId.get(relation.anchorModuleId) : undefined;
      if (!anchor) issues.push({ code: "upper-without-anchor", message: `Aéreo ${spec.id} não possui módulo inferior de referência.`, moduleId: spec.id });
    }

    if (spec.kind === "tower" || spec.moduleId.includes("fridge")) {
      applianceZones.push({ id: `appliance-zone-${spec.id}`, wallId: relation.wallId, moduleId: spec.id, startX, endX, bottomY, topY, depthMm, clearanceMm: 20 });
      placement.applianceZoneId = `appliance-zone-${spec.id}`;
    }
  }

  const floorPlacements = placements.filter((placement) => placement.anchor === "floor" && !["tower", "fridge", "appliance"].includes(specs.find((spec) => spec.id === placement.moduleId)?.kind ?? ""));
  if (floorPlacements.length > 0) {
    const startX = Math.min(...floorPlacements.map((placement) => placement.startX));
    const endX = Math.max(...floorPlacements.map((placement) => placement.endX));
    const supportModuleIds = floorPlacements.map((placement) => placement.moduleId);
    const supported = floorPlacements.every((placement) => placement.supported && !placement.collision);
    countertops.push({ id: "countertop-wall-test", wallId: wall.id, supportModuleIds, startX, endX, topY: BASE_HEIGHT_MM, depthMm: BASE_DEPTH_MM, thicknessMm: COUNTERTOP_THICKNESS_MM, supported });
    if (!supported) issues.push({ code: "countertop-unsupported", message: "A bancada contínua não possui suporte integral dos módulos inferiores." });

    const countertop = countertops[0];
    for (const spec of specs) {
      const placement = placements.find((item) => item.moduleId === spec.id);
      if (!placement) continue;
      if (spec.kind === "sink" || spec.kind === "cooktop") {
        const parentSupported = countertop.supportModuleIds.includes(spec.id);
        technicalRelationships.push({ id: `${spec.kind}-${spec.id}`, type: spec.kind, parentModuleId: spec.id, countertopId: countertop.id, centerX: (placement.startX + placement.endX) / 2, topY: countertop.topY, clearanceMm: 40, valid: parentSupported && countertop.supported });
        if (!parentSupported) issues.push({ code: `${spec.kind}-without-countertop`, message: `${spec.kind} ${spec.id} não está apoiado em um balcão compatível.`, moduleId: spec.id });
      }
      if (spec.kind === "hood") {
        const target = spec.relation.anchorModuleId ? placements.find((item) => item.moduleId === spec.relation.anchorModuleId) : placements.find((item) => specs.find((candidate) => candidate.id === item.moduleId)?.kind === "cooktop");
        const validHood = Boolean(target);
        technicalRelationships.push({ id: `hood-${spec.id}`, type: "hood", parentModuleId: spec.id, targetCooktopId: target?.moduleId, centerX: target ? (target.startX + target.endX) / 2 : (placement.startX + placement.endX) / 2, topY: placement.bottomY, clearanceMm: 650, valid: validHood });
        if (!validHood) issues.push({ code: "hood-without-cooktop", message: `Coifa ${spec.id} não possui cooktop-alvo.`, moduleId: spec.id });
      }
    }
  }

  return { placements, countertops, applianceZones, technicalRelationships, issues, valid: issues.length === 0 };
}

/**
 * Runs the same deterministic sequential engine independently on each architectural wall.
 * Module specs still carry their wallId, so the caller never supplies arbitrary coordinates.
 */
export function layoutKitchenAcrossWalls(specs: LayoutModuleSpec[], walls: KitchenWall[]): KitchenLayoutResult {
  const wallById = new Map(walls.map((wall) => [wall.id, wall]));
  const grouped = new Map<string, LayoutModuleSpec[]>();
  for (const spec of specs) {
    const group = grouped.get(spec.relation.wallId) ?? [];
    group.push(spec);
    grouped.set(spec.relation.wallId, group);
  }

  const results: KitchenLayoutResult[] = [];
  for (const [wallId, wallSpecs] of grouped) {
    const wall = wallById.get(wallId);
    if (!wall) {
      results.push({ placements: [], countertops: [], applianceZones: [], technicalRelationships: [], issues: [{ code: "unknown-wall", message: `Parede ${wallId} não existe.` }], valid: false });
      continue;
    }
    results.push(layoutKitchenModules(wallSpecs, wall));
  }

  return {
    placements: results.flatMap((result) => result.placements),
    countertops: results.flatMap((result) => result.countertops),
    applianceZones: results.flatMap((result) => result.applianceZones),
    technicalRelationships: results.flatMap((result) => result.technicalRelationships),
    issues: results.flatMap((result) => result.issues),
    valid: results.every((result) => result.valid),
  };
}
