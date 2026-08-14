import { describe, expect, it } from "vitest";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { buildNestingPlanFromPartDefinitions } from "./nestingPlan";

describe("nesting plan — PartDefinition para chapas", () => {
  it("gera nesting MaxRects para a cozinha natural completa", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(
      "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.",
    );
    const instances = usePlannerStore.getState().instances;
    const parts = instances.flatMap((instance) => instance.parts);
    const plan = buildNestingPlanFromPartDefinitions(parts, {
      algorithm: "max-rects",
      kerfMm: 4,
      marginMm: 10,
      rotation: "auto",
      grainMode: "respect",
      minOffcutMm: 100,
    });

    expect(instances.length).toBe(5);
    expect(parts.length).toBeGreaterThan(0);
    expect(plan.algorithm).toBe("max-rects");
    expect(plan.boards.length).toBeGreaterThan(0);
    expect(plan.statistics.partsCount).toBeGreaterThan(0);
    expect(plan.unplaced).toEqual([]);
    for (const board of plan.boards) {
      for (const placement of board.placements) {
        expect(placement.x).toBeGreaterThanOrEqual(0);
        expect(placement.y).toBeGreaterThanOrEqual(0);
        expect(placement.x + placement.w).toBeLessThanOrEqual(board.spec.lengthMm);
        expect(placement.y + placement.h).toBeLessThanOrEqual(board.spec.widthMm);
      }
    }
  });
});
