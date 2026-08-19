import { afterEach, describe, expect, it, vi } from "vitest";
import * as carcassResolver from "../../library/services/carcassConstructionResolver";
import { usePlannerStore } from "./usePlannerStore";

const GOLDEN_DEFINITION_ID = "kitchen-base-2-doors";

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
    value: { localStorage: localStorageMock, dispatchEvent: () => true, CustomEvent: class CustomEvent { constructor(public type: string) {} } },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Step 7.2 — Golden carcass identity wiring regression lock", () => {
  it("captura diretamente o input do resolver chamado pelo builder real", () => {
    setupStore();
    const resolveSpy = vi.spyOn(carcassResolver, "resolveCarcassConstruction");
    const createdId = usePlannerStore.getState().addFurnitureInstance(
      GOLDEN_DEFINITION_ID,
      { x: 0, y: 0, z: 0 },
      { width: 900, height: 870, depth: 580 },
    );
    expect(createdId).toBeTruthy();
    const instance = usePlannerStore.getState().instances.find((item) => item.id === createdId)!;

    expect(instance.id).not.toBe(GOLDEN_DEFINITION_ID);
    expect(resolveSpy).toHaveBeenCalled();

    const goldenCall = resolveSpy.mock.calls.find(([input]) => input.moduleDefinitionId === GOLDEN_DEFINITION_ID);
    expect(goldenCall).toBeDefined();
    expect(goldenCall?.[0].moduleDefinitionId).toBe(GOLDEN_DEFINITION_ID);
    expect(goldenCall?.[0].moduleDefinitionId).not.toBe(instance.id);

    expect(instance.parts.every((part) => part.moduleId === instance.id)).toBe(true);
    expect(instance.parts.find((part) => part.id === `${instance.id}:side-left`)).toBeDefined();
    expect(instance.parts.find((part) => part.id === `${instance.id}:base`)?.dimensionsMm).toEqual({
      width: 864,
      height: 18,
      depth: 580,
    });
  });
});
