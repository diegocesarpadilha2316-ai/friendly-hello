import { describe, expect, it } from "vitest";
import {
  createTestWall,
  layoutKitchenAcrossWalls,
  layoutKitchenModules,
} from "./KitchenLayoutEngine";
import type { KitchenWall, LayoutModuleSpec } from "./LayoutTypes";

const relation = (
  wallId: string,
  anchor: "floor" | "wall" | "appliance-zone",
  sequenceIndex: number,
  anchorModuleId?: string,
) => ({
  wallId,
  anchor,
  sequenceIndex,
  anchorModuleId,
  alignment: "front" as const,
  clearanceMm: 0,
});

const moduleSpec = (
  id: string,
  moduleId: string,
  kind: string,
  width: number,
  height: number,
  depth: number,
  rel: ReturnType<typeof relation>,
): LayoutModuleSpec => ({
  id,
  moduleId,
  kind,
  dimensionsMm: { width, height, depth },
  relation: rel,
});

describe("Kitchen V10 — suíte mandatória de integração A–E", () => {
  it("A — cozinha linear: mantém sequência e bancada contínua derivada", () => {
    const wall = createTestWall();
    const result = layoutKitchenModules(
      [
        moduleSpec(
          "base-a",
          "kitchen-base-2-doors",
          "base",
          800,
          870,
          580,
          relation(wall.id, "floor", 0),
        ),
        moduleSpec(
          "drawer-a",
          "kitchen-drawer-4",
          "drawer",
          600,
          870,
          580,
          relation(wall.id, "floor", 1),
        ),
        moduleSpec(
          "sink-a",
          "kitchen-sink-cabinet",
          "sink",
          1200,
          870,
          580,
          relation(wall.id, "floor", 2),
        ),
      ],
      wall,
    );
    expect(result.valid).toBe(true);
    expect(result.placements.map((item) => item.sequenceIndex)).toEqual([0, 1, 2]);
    expect(result.placements[1].startX).toBe(result.placements[0].endX);
    expect(result.placements[2].startX).toBe(result.placements[1].endX);
    expect(result.countertops[0]).toMatchObject({
      startX: result.placements[0].startX,
      endX: result.placements[2].endX,
      supported: true,
    });
  });

  it("B — cozinha em L: executa sequência independente em cada parede arquitetônica", () => {
    const wallA = createTestWall(3200, 3000, 5000);
    const wallB: KitchenWall = {
      ...createTestWall(2800, 3000, 5000),
      id: "wall-l-b",
      originMm: { x: 1600, y: 0, z: -2500 },
    };
    const result = layoutKitchenAcrossWalls(
      [
        moduleSpec(
          "a-base",
          "kitchen-base-2-doors",
          "base",
          800,
          870,
          580,
          relation(wallA.id, "floor", 0),
        ),
        moduleSpec(
          "a-sink",
          "kitchen-sink-cabinet",
          "sink",
          800,
          870,
          580,
          relation(wallA.id, "floor", 1),
        ),
        moduleSpec(
          "b-base",
          "kitchen-base-2-doors",
          "base",
          800,
          870,
          580,
          relation(wallB.id, "floor", 0),
        ),
        moduleSpec(
          "b-drawer",
          "kitchen-drawer-4",
          "drawer",
          600,
          870,
          580,
          relation(wallB.id, "floor", 1),
        ),
      ],
      [wallA, wallB],
    );
    expect(result.valid).toBe(true);
    expect(
      result.placements
        .filter((item) => item.wallId === wallA.id)
        .map((item) => item.sequenceIndex),
    ).toEqual([0, 1]);
    expect(
      result.placements
        .filter((item) => item.wallId === wallB.id)
        .map((item) => item.sequenceIndex),
    ).toEqual([0, 1]);
    expect(result.countertops).toHaveLength(2);
  });

  it("C — janela sobre a pia: abertura acima do tampo não gera colisão", () => {
    const wall = createTestWall();
    wall.openings = [
      {
        id: "window-over-sink",
        wallId: wall.id,
        type: "window",
        startX: 2500,
        endX: 3700,
        bottomY: 950,
        topY: 2400,
      },
    ];
    const result = layoutKitchenModules(
      [
        moduleSpec(
          "sink-c",
          "kitchen-sink-cabinet",
          "sink",
          1200,
          870,
          580,
          relation(wall.id, "floor", 0),
        ),
      ],
      wall,
    );
    const sink = result.placements[0];
    expect(result.valid).toBe(true);
    expect(sink.collision).toBe(false);
    expect(result.technicalRelationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "sink",
          valid: true,
          centerX: (sink.startX + sink.endX) / 2,
        }),
      ]),
    );
  });

  it("D — cooktop e coifa: relação técnica centralizada e com alvo explícito", () => {
    const wall = createTestWall();
    const result = layoutKitchenModules(
      [
        moduleSpec(
          "cooktop-d",
          "kitchen-cooktop-cabinet",
          "cooktop",
          800,
          870,
          580,
          relation(wall.id, "floor", 0),
        ),
        moduleSpec(
          "hood-d",
          "kitchen-upper-hood",
          "hood",
          800,
          450,
          350,
          relation(wall.id, "wall", 1, "cooktop-d"),
        ),
      ],
      wall,
    );
    const cooktop = result.placements.find((item) => item.moduleId === "cooktop-d")!;
    const hoodRelation = result.technicalRelationships.find((item) => item.type === "hood")!;
    expect(result.valid).toBe(true);
    expect(hoodRelation).toMatchObject({
      targetCooktopId: "cooktop-d",
      valid: true,
      centerX: (cooktop.startX + cooktop.endX) / 2,
    });
  });

  it("E — torre com geladeira: cria zona de appliance e mantém suporte", () => {
    const wall = createTestWall();
    const result = layoutKitchenModules(
      [
        moduleSpec(
          "tower-e",
          "kitchen-tower-fridge",
          "tower",
          900,
          2200,
          700,
          relation(wall.id, "appliance-zone", 0),
        ),
        moduleSpec(
          "base-e",
          "kitchen-base-2-doors",
          "base",
          800,
          870,
          580,
          relation(wall.id, "floor", 1),
        ),
      ],
      wall,
    );
    expect(result.valid).toBe(true);
    expect(result.placements.every((item) => item.supported && !item.collision)).toBe(true);
    expect(result.applianceZones).toEqual(
      expect.arrayContaining([expect.objectContaining({ moduleId: "tower-e" })]),
    );
  });
});
