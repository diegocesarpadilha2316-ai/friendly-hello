import "../../library/index";
import { beforeEach, describe, expect, it } from "vitest";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../../library/services/nestingPlan";
import { PROJECT_STORAGE_KEY } from "../../library/services/projectPersistence";
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

function downstream(id: string) {
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
  const joinery = buildJoineryReport([instance]);
  const machining = buildMachiningReport([instance], joinery.operations);
  const fabrication = buildFabricationReport([instance]);
  const nesting = buildNestingPlanFromPartDefinitions(instance.parts);
  const integrity = validateNestingIntegrity(instance.parts, nesting);
  return { instance, joinery, machining, fabrication, nesting, integrity };
}

function manufacturingDigest(result: ReturnType<typeof downstream>) {
  return {
    hardwareItems: result.fabrication.hardwareItems,
    cutItems: result.fabrication.cutItems,
    nestingBoards: result.nesting.boards,
    nestingUnplaced: result.nesting.unplaced,
    nestingIntegrity: result.integrity,
    joinery: result.joinery.operations.map(({ id, moduleInstanceId, partId, kind, hardwareId }) => ({ id, moduleInstanceId, partId, kind, hardwareId })),
    machining: result.machining.operations.map(({ id, instanceId, partId, hardwareId, hardwareVariantId, readiness, missingParameters }) => ({ id, instanceId, partId, hardwareId, hardwareVariantId, readiness, missingParameters })),
  };
}

describe("Stage 12 — Dioris Planner V2 closure locks", () => {
  beforeEach(setupStore);

  it.each([
    ["kitchen-base-2-doors", { width: 800, height: 870, depth: 580 }],
    ["kitchen-drawer-3", { width: 800, height: 870, depth: 580 }],
  ] as const)("does not encode unknown values as zero for %s", (moduleId, dimensions) => {
    const id = usePlannerStore.getState().addFurnitureInstance(moduleId, { x: 0, y: 0, z: 0 }, dimensions);
    expect(id).toBeTruthy();
    const result = downstream(id!);
    expect(result.integrity).toMatchObject({ missingInNesting: [], duplicateInNesting: [], unknownInNesting: [] });
    expect(result.instance.parts.every((part) => Object.values(part.dimensionsMm).every((value) => Number.isFinite(value) && value > 0))).toBe(true);
    expect(Object.values(result.instance.materialOverrides).every((value) => typeof value === "string" && value.length > 0)).toBe(true);
    expect(result.fabrication.cutItems.every((item) => item.quantity > 0 && item.thicknessMm !== undefined && item.thicknessMm > 0 && item.partIds.length > 0)).toBe(true);
    expect(result.machining.readiness.every((item) => item.status !== "INCOMPLETE" || item.missingParameters.length > 0)).toBe(true);
    expect(JSON.stringify(result.machining)).not.toContain('"unknown":0');
    expect(JSON.stringify(result.fabrication)).not.toContain('"unknown":0');
  });

  it.each([
    ["kitchen-base-2-doors", { width: 800, height: 870, depth: 580 }],
    ["kitchen-drawer-3", { width: 800, height: 870, depth: 580 }],
  ] as const)("preserves BOM, cut-list and nesting on A→B→A for %s", (moduleId, dimensions) => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance(moduleId, { x: 0, y: 0, z: 0 }, dimensions);
    const a = downstream(id!);
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const b = downstream(id!);
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: dimensions })).toBe(true);
    const a2 = downstream(id!);
    expect(manufacturingDigest(a2)).toEqual(manufacturingDigest(a));
    expect(manufacturingDigest(b)).not.toEqual(manufacturingDigest(a));
    expect(a2.instance.parts.map((part) => part.id)).toEqual(a.instance.parts.map((part) => part.id));
  });

  it("keeps Base and Drawer instances isolated under move and rotation", () => {
    const store = usePlannerStore.getState();
    const baseId = store.addFurnitureInstance("kitchen-base-2-doors", { x: -900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const drawerId = store.addFurnitureInstance("kitchen-drawer-3", { x: 900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const base = downstream(baseId!);
    const drawer = downstream(drawerId!);
    expect(base.instance.parts.map((part) => part.id).filter((id) => drawer.instance.parts.some((part) => part.id === id))).toEqual([]);
    expect(store.updateFurnitureInstance(baseId!, { positionMm: { x: -500, y: 120, z: 300 }, rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    expect(store.updateFurnitureInstance(drawerId!, { positionMm: { x: 500, y: 120, z: 300 }, rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    expect(manufacturingDigest(downstream(baseId!))).toEqual(manufacturingDigest(base));
    expect(manufacturingDigest(downstream(drawerId!))).toEqual(manufacturingDigest(drawer));
    expect(usePlannerStore.getState().instances.find((item) => item.id === baseId)?.rotationDeg).toEqual({ x: 0, y: 90, z: 0 });
    expect(usePlannerStore.getState().instances.find((item) => item.id === drawerId)?.rotationDeg).toEqual({ x: 0, y: 90, z: 0 });
  });

  it("persists and reloads Base and Drawer references without serializing resolved profiles", () => {
    const store = usePlannerStore.getState();
    const baseId = store.addFurnitureInstance("kitchen-base-2-doors", { x: -500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const drawerId = store.addFurnitureInstance("kitchen-drawer-3", { x: 500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const before = { base: downstream(baseId!), drawer: downstream(drawerId!) };
    expect(store.saveProject()).toBe(true);
    const saved = JSON.parse(storage.get(PROJECT_STORAGE_KEY) ?? "{}");
    const serialized = JSON.stringify(saved);
    expect(serialized).toContain("kitchen-base-2-doors");
    expect(serialized).toContain("kitchen-drawer-3");
    expect(serialized).not.toContain("drawer-stack:equal-v1");
    expect(serialized).not.toContain("drawer-box:legacy-visual-v1");
    usePlannerStore.getState().newProject();
    storage.set(PROJECT_STORAGE_KEY, JSON.stringify(saved));
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    expect(manufacturingDigest(downstream(baseId!))).toEqual(manufacturingDigest(before.base));
    expect(manufacturingDigest(downstream(drawerId!))).toEqual(manufacturingDigest(before.drawer));
  });
});
