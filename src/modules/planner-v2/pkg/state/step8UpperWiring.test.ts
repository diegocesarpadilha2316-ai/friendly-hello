import "../../library/index";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as carcassResolver from "../../library/services/carcassConstructionResolver";
import * as frontLayoutResolver from "../../library/services/frontLayoutResolver";
import * as hardwarePlacementResolver from "../../library/services/hardwarePlacementResolver";
import { usePlannerStore } from "./usePlannerStore";

const UPPER_ID = "kitchen-golden-upper-800";
const BASE_ID = "kitchen-base-2-doors";
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function setupStore() {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: localStorageMock,
      dispatchEvent: () => true,
      CustomEvent: class CustomEvent { constructor(public type: string) {} },
    },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

afterEach(() => vi.restoreAllMocks());

describe("Step 8.1 — Upper real wiring and identity acceptance lock", () => {
  it("prova Definition → factory upper → carcass/front/hardware resolvers pelo store real", () => {
    setupStore();
    const carcassSpy = vi.spyOn(carcassResolver, "resolveCarcassConstruction");
    const frontSpy = vi.spyOn(frontLayoutResolver, "resolveFrontLayout");
    const hardwareSpy = vi.spyOn(hardwarePlacementResolver, "resolveDoorHardwarePlacement");

    const instanceId = usePlannerStore.getState().addFurnitureInstance(
      UPPER_ID,
      { x: 0, y: 1500, z: 0 },
      { width: 800, height: 700, depth: 350 },
    );
    expect(instanceId).toBeTruthy();
    const instance = usePlannerStore.getState().instances.find((item) => item.id === instanceId)!;
    expect(instance.id).not.toBe(UPPER_ID);
    expect(instance.moduleDefinitionId).toBe(UPPER_ID);

    const carcassCallIndex = carcassSpy.mock.calls.findIndex(([input]) => input.rule.moduleDefinitionId === UPPER_ID);
    const carcassCall = carcassSpy.mock.calls[carcassCallIndex];
    expect(carcassCall).toBeDefined();
    expect(carcassCall?.[0].moduleDefinitionId).toBe(UPPER_ID);
    expect(carcassCall?.[0].rule.id).toBe("kitchen-golden-upper-800:carcass-v1");
    const upperResolved = carcassSpy.mock.results[carcassCallIndex]?.value as ReturnType<typeof carcassResolver.resolveCarcassConstruction>;
    expect(upperResolved.validationStatus).toBe("READY");
    expect(upperResolved.diagnostics).toEqual([]);
    expect(upperResolved.toeKickMm).toBe(0);
    expect(upperResolved.toeKick).toBeUndefined();
    expect(upperResolved.panels.filter((panel) => panel.role === "side-left" || panel.role === "side-right").every((panel) => panel.relation.relation === "full-height")).toBe(true);

    const upperFrontCalls = frontSpy.mock.calls.filter(([input, rule]) =>
      input.moduleDefinitionId === UPPER_ID && rule.moduleDefinitionId === UPPER_ID,
    );
    expect(upperFrontCalls).toHaveLength(1);
    expect(upperFrontCalls[0][0].moduleDefinitionId).toBe(UPPER_ID);
    expect(upperFrontCalls[0][1].id).toBe("kitchen-golden-upper-800:baseline-front-layout-v2");
    expect(upperFrontCalls[0][1].applicationType).toBe("paired-overlay");
    const resolvedUpperFront = frontLayoutResolver.resolveFrontLayout(upperFrontCalls[0][0], upperFrontCalls[0][1]);
    expect(resolvedUpperFront.moduleDefinitionId).toBe(UPPER_ID);
    expect(resolvedUpperFront.validationStatus).toBe("READY");
    expect(resolvedUpperFront.doorWidthsMm).toEqual([396, 396]);
    expect(resolvedUpperFront.doorCentersMm).toEqual([-200, 198]);
    expect(resolvedUpperFront.doorEdgesMm).toEqual([{ left: -398, right: -2 }, { left: 0, right: 396 }]);
    expect(resolvedUpperFront.pivotXByFrontMm).toEqual([-398, 396]);
    expect(resolvedUpperFront.doorHeightMm).toBe(696);
    expect(resolvedUpperFront.topRevealMm).toBe(2);
    expect(resolvedUpperFront.bottomRevealMm).toBe(2);

    const upperHardwareCalls = hardwareSpy.mock.calls.filter(([input]) =>
      input.frontLayout.moduleDefinitionId === UPPER_ID,
    );
    expect(upperHardwareCalls).toHaveLength(2);
    expect(upperHardwareCalls.every(([input]) => input.frontLayout.moduleDefinitionId === UPPER_ID)).toBe(true);

    expect(instance.parts).toHaveLength(32);
    expect(instance.parts.every((part) => part.moduleId === instance.id)).toBe(true);
    expect(instance.parts.every((part) => part.parentInstanceId === instance.id)).toBe(true);
    expect(instance.parts.some((part) => part.moduleId === UPPER_ID)).toBe(false);
    expect(instance.parts.some((part) => part.role === "toe-kick")).toBe(false);
  });

  it("mantém o Golden Base em regra própria e não vaza a regra Upper", () => {
    setupStore();
    const carcassSpy = vi.spyOn(carcassResolver, "resolveCarcassConstruction");
    const frontSpy = vi.spyOn(frontLayoutResolver, "resolveFrontLayout");

    const instanceId = usePlannerStore.getState().addFurnitureInstance(
      BASE_ID,
      { x: 0, y: 0, z: 0 },
      { width: 800, height: 870, depth: 580 },
    );
    expect(instanceId).toBeTruthy();
    const baseCarcass = carcassSpy.mock.calls.find(([input]) => input.rule.moduleDefinitionId === BASE_ID);
    const baseFront = frontSpy.mock.calls.find(([input, rule]) => input.moduleDefinitionId === BASE_ID && rule.moduleDefinitionId === BASE_ID);
    expect(baseCarcass?.[0].rule.id).toBe("kitchen-base-2-doors:golden-carcass-between-sides");
    expect(baseFront?.[1].id).toBe("kitchen-base-2-doors:symmetric-front-layout-v1");
    expect(baseFront?.[1].applicationType).toBe("symmetric-paired-overlay");
    expect(usePlannerStore.getState().instances.find((item) => item.id === instanceId)?.parts.some((part) => part.hardwareId === "toe-kick-profile")).toBe(true);
  });

  it("resolve Base e Upper como READY na mesma store, sem cruzar identidade ou toe-kick", () => {
    setupStore();
    const carcassSpy = vi.spyOn(carcassResolver, "resolveCarcassConstruction");
    const baseId = usePlannerStore.getState().addFurnitureInstance(BASE_ID, { x: -500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const upperId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 500, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(baseId).toBeTruthy();
    expect(upperId).toBeTruthy();
    expect(baseId).not.toBe(upperId);
    const baseInstance = usePlannerStore.getState().instances.find((item) => item.id === baseId)!;
    const upperInstance = usePlannerStore.getState().instances.find((item) => item.id === upperId)!;
    expect(baseInstance.moduleDefinitionId).toBe(BASE_ID);
    expect(upperInstance.moduleDefinitionId).toBe(UPPER_ID);
    const baseIndex = carcassSpy.mock.calls.findIndex(([input]) => input.moduleDefinitionId === BASE_ID);
    const upperIndex = carcassSpy.mock.calls.findIndex(([input]) => input.moduleDefinitionId === UPPER_ID);
    const baseResolved = carcassSpy.mock.results[baseIndex]?.value as ReturnType<typeof carcassResolver.resolveCarcassConstruction>;
    const upperResolved = carcassSpy.mock.results[upperIndex]?.value as ReturnType<typeof carcassResolver.resolveCarcassConstruction>;
    expect(baseResolved.validationStatus).toBe("READY");
    expect(baseResolved.toeKick).toBeDefined();
    expect(upperResolved.validationStatus).toBe("READY");
    expect(upperResolved.toeKick).toBeUndefined();
    const basePartIds = new Set(baseInstance.parts.map((part) => part.id));
    expect(upperInstance.parts.some((part) => basePartIds.has(part.id))).toBe(false);
    expect(baseInstance.parts.every((part) => part.moduleId === baseInstance.id && part.parentInstanceId === baseInstance.id)).toBe(true);
    expect(upperInstance.parts.every((part) => part.moduleId === upperInstance.id && part.parentInstanceId === upperInstance.id)).toBe(true);
  });
});
