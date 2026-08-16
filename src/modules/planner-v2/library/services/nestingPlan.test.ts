import { describe, expect, it } from "vitest";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { buildFabricationReport } from "./fabricationReport";
import {
  buildNestingPlanFromPartDefinitions,
  validateNestingIntegrity,
} from "./nestingPlan";

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
    store.newProject();
    const standaloneId = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 });
    expect(standaloneId).toBeTruthy();
    const before = usePlannerStore.getState().instances.find((instance) => instance.id === standaloneId)!;
    const beforeBase = before.parts.find((part) => part.role === "base");
    const beforeDoor = before.parts.find((part) => part.role === "door");
    expect(beforeBase?.dimensionsMm.width).toBe(764);
    expect(beforeDoor?.dimensionsMm.width).toBe(396);
    const updatedOk = usePlannerStore.getState().updateFurnitureInstance(before.id, {
      dimensionsMm: { ...before.dimensionsMm, width: 900 },
    });
    expect(updatedOk).toBe(true);
    const after = usePlannerStore.getState().instances.find((instance) => instance.id === before.id)!;
    const afterBase = after.parts.find((part) => part.role === "base");
    const afterTop = after.parts.find((part) => part.role === "top");
    const afterDoor = after.parts.find((part) => part.role === "door");
    expect(after.dimensionsMm.width).toBe(900);
    expect(afterBase?.dimensionsMm.width).toBe(864);
    expect(afterTop?.dimensionsMm.width).toBe(864);
    expect(afterDoor?.dimensionsMm.width).toBe(446);
    expect(buildFabricationReport([after]).warnings).toEqual([]);
    const afterPlan = buildNestingPlanFromPartDefinitions(after.parts);
    const integrity = validateNestingIntegrity(after.parts, afterPlan);
    expect(integrity.missingInNesting).toEqual([]);
    expect(integrity.duplicateInNesting).toEqual([]);
    expect(integrity.unknownInNesting).toEqual([]);
    expect(afterPlan.unplaced).toEqual([]);
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
