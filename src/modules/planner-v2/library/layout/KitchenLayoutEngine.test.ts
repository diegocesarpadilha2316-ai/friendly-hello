import { describe, expect, it } from "vitest";
import { createTestWall, layoutKitchenModules } from "./KitchenLayoutEngine";
import type { LayoutModuleSpec } from "./LayoutTypes";

const relation = (anchor: "floor" | "wall" | "appliance-zone", sequenceIndex: number, anchorModuleId?: string) => ({
  wallId: "wall-test-linear",
  anchor,
  sequenceIndex,
  anchorModuleId,
  alignment: "front" as const,
  clearanceMm: 0,
});

describe("Kitchen Layout Engine", () => {
  it("posiciona uma cozinha linear sequencialmente e deriva bancada contínua", () => {
    const specs: LayoutModuleSpec[] = [
      { id: "tower", moduleId: "kitchen-tower-oven-microwave", kind: "tower", dimensionsMm: { width: 700, height: 2200, depth: 620 }, relation: relation("appliance-zone", 0) },
      { id: "base", moduleId: "kitchen-base-2-doors", kind: "base", dimensionsMm: { width: 800, height: 870, depth: 580 }, relation: relation("floor", 1) },
      { id: "drawer", moduleId: "kitchen-drawer-4", kind: "drawer", dimensionsMm: { width: 600, height: 870, depth: 580 }, relation: relation("floor", 2) },
      { id: "sink", moduleId: "kitchen-sink-cabinet", kind: "sink", dimensionsMm: { width: 1200, height: 870, depth: 580 }, relation: relation("floor", 3) },
      { id: "upper", moduleId: "kitchen-golden-upper-800", kind: "upper", dimensionsMm: { width: 800, height: 700, depth: 350 }, relation: relation("wall", 4, "base") },
    ];
    const result = layoutKitchenModules(specs, createTestWall());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.placements.map((placement) => placement.moduleId)).toEqual(["tower", "base", "drawer", "sink", "upper"]);
    expect(result.placements[1].startX).toBe(result.placements[0].endX);
    expect(result.placements[2].startX).toBe(result.placements[1].endX);
    expect(result.placements[3].startX).toBe(result.placements[2].endX);
    expect(result.placements[4].startX).toBe(result.placements[1].startX);
    expect(result.placements.every((placement) => placement.supported && !placement.collision)).toBe(true);
    expect(result.countertops[0].supportModuleIds).toEqual(["base", "drawer", "sink"]);
    expect(result.countertops[0].supported).toBe(true);
    expect(result.applianceZones).toHaveLength(1);
  });

  it("bloqueia módulo que atravessa uma janela", () => {
    const wall = createTestWall();
    wall.openings = [{ id: "window-1", wallId: wall.id, type: "window", startX: 0, endX: 800, bottomY: 950, topY: 2400 }];
    const result = layoutKitchenModules([
      { id: "upper", moduleId: "kitchen-upper-2-doors", kind: "upper", dimensionsMm: { width: 800, height: 700, depth: 350 }, relation: relation("wall", 0) },
    ], wall);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "module-wall-opening")).toBe(true);
  });
});

it("deriva relações de cooktop, coifa e geladeira sem componentes soltos", () => {
  const specs: LayoutModuleSpec[] = [
    { id: "base", moduleId: "kitchen-base-2-doors", kind: "base", dimensionsMm: { width: 800, height: 870, depth: 580 }, relation: relation("floor", 0) },
    { id: "cooktop", moduleId: "kitchen-cooktop-cabinet", kind: "cooktop", dimensionsMm: { width: 800, height: 870, depth: 580 }, relation: relation("floor", 1) },
    { id: "hood", moduleId: "kitchen-upper-hood", kind: "hood", dimensionsMm: { width: 800, height: 450, depth: 350 }, relation: relation("wall", 2, "cooktop") },
    { id: "fridge", moduleId: "kitchen-tower-fridge", kind: "tower", dimensionsMm: { width: 900, height: 2200, depth: 700 }, relation: relation("appliance-zone", 3) },
  ];
  const result = layoutKitchenModules(specs, createTestWall());
  expect(result.valid).toBe(true);
  expect(result.technicalRelationships).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: "cooktop", parentModuleId: "cooktop", valid: true }),
    expect.objectContaining({ type: "hood", targetCooktopId: "cooktop", valid: true }),
  ]));
  expect(result.applianceZones.some((zone) => zone.moduleId === "fridge")).toBe(true);
});
