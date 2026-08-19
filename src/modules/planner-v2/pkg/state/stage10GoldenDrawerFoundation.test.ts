import "../../library/index";
import { beforeEach, describe, expect, it } from "vitest";
import { GOLDEN_DRAWER_CARCASS_CONSTRUCTION_RULE } from "../../library/families/kitchen/carcassConstructionRules";
import {
  GOLDEN_DRAWER_3_BOX_RULE,
  GOLDEN_DRAWER_3_ID,
  GOLDEN_DRAWER_3_SLIDE_RULE,
  GOLDEN_DRAWER_3_STACK_RULE,
} from "../../library/families/kitchen/drawerRules";
import { resolveCarcassConstruction } from "../../library/services/carcassConstructionResolver";
import { resolveDrawerStack } from "../../library/services/drawerStackResolver";
import { ConstructionProfileRegistry } from "../../library/registry/ConstructionProfileRegistry";
import { usePlannerStore } from "./usePlannerStore";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function setupStore() {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, "window", { value: { localStorage: localStorageMock, dispatchEvent: () => true }, configurable: true });
  storage.clear();
  usePlannerStore.getState().newProject();
}

function resolveFor(width: number, height: number, depth = 580, stackRule = GOLDEN_DRAWER_3_STACK_RULE) {
  const carcass = resolveCarcassConstruction({
    moduleDefinitionId: GOLDEN_DRAWER_3_ID,
    dimensionsMm: { width, height, depth },
    thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
    toeKickMm: 150,
    shelves: 0,
    rule: GOLDEN_DRAWER_CARCASS_CONSTRUCTION_RULE,
  });
  return resolveDrawerStack({
    moduleDefinitionId: GOLDEN_DRAWER_3_ID,
    carcass,
    stackRule,
    boxRule: GOLDEN_DRAWER_3_BOX_RULE,
    slideRule: GOLDEN_DRAWER_3_SLIDE_RULE,
  });
}

describe("Stage 10 — Golden Drawer foundation", () => {
  beforeEach(setupStore);

  it("resolves the opening and closes the 3-drawer front equation", () => {
    const stack = resolveFor(600, 870);
    expect(stack.status).toBe("READY");
    expect(stack.opening.status).toBe("READY");
    expect(stack.opening.internalWidthMm).toBe(564);
    expect(stack.opening.internalHeightMm).toBe(684);
    expect(stack.opening.internalDepthMm).toBe(574);
    expect(stack.drawerCount).toBe(3);
    expect(stack.items.map((item) => item.drawerId)).toEqual(["drawer-1", "drawer-2", "drawer-3"]);
    expect(stack.items.map((item) => item.frontId)).toEqual(["drawer-front-1", "drawer-front-2", "drawer-front-3"]);
    expect(new Set(stack.items.map((item) => item.frontHeightMm)).size).toBe(1);
    const frontHeight = stack.items[0].frontHeightMm;
    const equation = stack.items.reduce((sum, item) => sum + item.frontHeightMm, 0) + 4 + 2 * 2;
    expect(equation).toBeCloseTo(stack.opening.internalHeightMm, 6);
    expect(stack.items[0].gapAboveMm).toBe(2);
    expect(stack.items[2].gapBelowMm).toBe(2);
    expect(frontHeight).toBeCloseTo((684 - 4 - 4) / 3, 6);
    expect(stack.diagnostics).toContain("Corrediça genérica sem dados industriais: manufacturing INCOMPLETE.");
  });

  it("derives drawer box width from opening minus explicit slide clearances", () => {
    for (const width of [600, 800, 900, 1000]) {
      const stack = resolveFor(width, 870);
      expect(stack.status).toBe("READY");
      expect(stack.items.every((item) => item.boxWidthMm === width - 36 - 26)).toBe(true);
      expect(stack.items.every((item) => item.frontWidthMm === width - 36)).toBe(true);
      expect(stack.items.every((item) => item.slideClearanceLeftMm === 13 && item.slideClearanceRightMm === 13)).toBe(true);
    }
  });

  it("derives equal fronts for approved height variations", () => {
    for (const height of [720, 870, 900]) {
      const stack = resolveFor(800, height);
      expect(stack.status).toBe("READY");
      expect(stack.items).toHaveLength(3);
      expect(stack.items.every((item) => item.frontHeightMm > 0)).toBe(true);
      expect(stack.items[0].frontHeightMm).toBeCloseTo(stack.items[1].frontHeightMm, 6);
      expect(stack.items[1].frontHeightMm).toBeCloseTo(stack.items[2].frontHeightMm, 6);
    }
  });

  it("supports an isolated 4-drawer resolver without adding a second ModuleDefinition", () => {
    const fourRule = { ...GOLDEN_DRAWER_3_STACK_RULE, id: "test:4-drawers", drawerCount: 4 };
    const stack = resolveFor(800, 870, 580, fourRule);
    expect(stack.status).toBe("READY");
    expect(stack.items).toHaveLength(4);
    expect(stack.items.map((item) => item.drawerId)).toEqual(["drawer-1", "drawer-2", "drawer-3", "drawer-4"]);
  });

  it("rejects invalid drawer count, negative gap, box width and depth", () => {
    expect(resolveFor(800, 870, 580, { ...GOLDEN_DRAWER_3_STACK_RULE, drawerCount: 0 }).status).toBe("INVALID");
    expect(resolveFor(800, 870, 580, { ...GOLDEN_DRAWER_3_STACK_RULE, interDrawerGapMm: -1 }).status).toBe("INVALID");
    expect(resolveFor(40, 870).status).toBe("INVALID");
    expect(resolveFor(800, 870, 60).status).toBe("INVALID");
  });

  it("builds one Golden Drawer instance with separate fronts, boxes, slides and stable IDs", () => {
    const instanceId = usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === instanceId)!;
    expect(instance.moduleDefinitionId).toBe(GOLDEN_DRAWER_3_ID);
    expect(instance.parts.filter((part) => part.role === "drawer-front")).toHaveLength(3);
    expect(instance.parts.filter((part) => part.role === "drawer-box-front")).toHaveLength(3);
    expect(instance.parts.filter((part) => part.role === "drawer-side")).toHaveLength(6);
    expect(instance.parts.filter((part) => part.role === "drawer-bottom")).toHaveLength(3);
    expect(instance.parts.filter((part) => part.role === "hardware" && part.hardwareId === "slide-hidden-soft-close")).toHaveLength(6);
    expect(instance.parts.filter((part) => part.hardwareId === "handle-bar")).toHaveLength(3);
    expect(instance.parts.every((part) => part.parentInstanceId === instance.id)).toBe(true);
    expect(instance.parts.map((part) => part.id)).toContain(`${instance.id}:drawer-1:front`);
    expect(instance.parts.map((part) => part.id)).toContain(`${instance.id}:drawer-1:box-front`);
  });

  it("keeps motion and interlock metadata on every drawer group", () => {
    const instanceId = usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === instanceId)!;
    const drawerParts = instance.parts.filter((part) => part.interactive?.type === "drawer");
    expect(drawerParts).toHaveLength(18);
    expect(new Set(drawerParts.map((part) => part.groupId)).size).toBe(3);
    expect(drawerParts.every((part) => (part.interactive?.maxTravelMm ?? 0) > 0)).toBe(true);
    usePlannerStore.getState().toggleInstanceAnimation(instance.id, drawerParts[0].groupId!);
    const updated = usePlannerStore.getState().instances.find((item) => item.id === instance.id)!;
    expect(updated.openStates?.[drawerParts[0].groupId!]).toBe(1);
  });

  it("hard-stops when the professional Drawer profile is incomplete or absent", () => {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId(GOLDEN_DRAWER_3_ID)!;
    const originalStack = profile.drawerStackRule;
    delete profile.drawerStackRule;
    expect(usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 })).toBeFalsy();
    profile.drawerStackRule = originalStack;
    const removed = ConstructionProfileRegistry.removeForTest(GOLDEN_DRAWER_3_ID);
    expect(usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 })).toBeFalsy();
    expect(removed).toBeTruthy();
    ConstructionProfileRegistry.register(removed!);
  });

  it("keeps drawer profile and instances isolated across Base, Upper and Drawer A/B", () => {
    const baseId = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: -1500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const upperId = usePlannerStore.getState().addFurnitureInstance("kitchen-golden-upper-800", { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const drawerA = usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const drawerB = usePlannerStore.getState().addFurnitureInstance(GOLDEN_DRAWER_3_ID, { x: 1800, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instances = usePlannerStore.getState().instances;
    expect(new Set([baseId, upperId, drawerA, drawerB]).size).toBe(4);
    expect(instances.filter((item) => item.moduleDefinitionId === GOLDEN_DRAWER_3_ID)).toHaveLength(2);
    expect(instances.find((item) => item.id === drawerA)?.parts.every((part) => part.moduleId === drawerA)).toBe(true);
    expect(instances.find((item) => item.id === drawerB)?.parts.every((part) => part.moduleId === drawerB)).toBe(true);
    expect(ConstructionProfileRegistry.getByModuleDefinitionId(GOLDEN_DRAWER_3_ID)?.drawerStackRule?.id).toBe("kitchen-drawer-3:drawer-stack:equal-v1");
  });
});
