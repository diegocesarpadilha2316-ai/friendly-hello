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
  return {
    instance,
    joinery,
    machining,
    fabrication,
    nesting,
    integrity,
    partIds: instance.parts.map((part) => part.id),
    operations: machining.operations.map((operation) => ({ id: operation.id, partId: operation.partId, readiness: operation.readiness, missingParameters: operation.missingParameters })),
    cutList: fabrication.cutItems.map((item) => ({ key: item.key, quantity: item.quantity, partIds: item.partIds, materialId: item.materialId, thicknessMm: item.thicknessMm, grainDirection: item.grainDirection })),
    nestingIds: [...nesting.boards.flatMap((board) => board.placements.map((placement) => placement.code)), ...nesting.unplaced.map((part) => part.id)],
  };
}

describe("Stage 10 — Golden Drawer downstream acceptance", () => {
  beforeEach(setupStore);

  it("preserves BOM, cut-list, joinery, machining readiness and nesting integrity", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const result = downstream(id!);
    expect(result.instance.moduleDefinitionId).toBe("kitchen-drawer-3");
    expect(result.instance.parts.filter((part) => part.role === "drawer-front")).toHaveLength(3);
    expect(result.instance.parts.filter((part) => part.role === "drawer-box-front")).toHaveLength(3);
    expect(result.instance.parts.filter((part) => part.role === "drawer-side")).toHaveLength(6);
    expect(result.instance.parts.filter((part) => part.role === "drawer-bottom")).toHaveLength(3);
    expect(result.fabrication.hardwareItems.find((item) => item.hardwareId === "slide-hidden-soft-close")?.quantity).toBe(6);
    expect(result.fabrication.hardwareItems.find((item) => item.hardwareId === "handle-bar")?.quantity).toBe(3);
    expect(result.cutList.some((item) => item.partIds.some((partId) => partId.includes(":box-front")))).toBe(true);
    expect(result.cutList.every((item) => item.partIds.length > 0 && item.materialId && item.thicknessMm && item.grainDirection)).toBe(true);
    expect(result.integrity).toMatchObject({ missingInNesting: [], duplicateInNesting: [], unknownInNesting: [] });
    expect(result.nestingIds.every((partId) => result.instance.parts.some((part) => part.id === partId && part.role !== "hardware"))).toBe(true);
    expect(result.joinery.operations.every((operation) => operation.moduleInstanceId === id && result.instance.parts.some((part) => part.id === operation.partId))).toBe(true);
    expect(result.machining.operations.every((operation) => operation.instanceId === id && result.instance.parts.some((part) => part.id === operation.partId))).toBe(true);
    expect(result.machining.operations.every((operation) => operation.readiness === "READY" || operation.missingParameters.length > 0)).toBe(true);
  });

  it("preserves deterministic A→B→A at 800→900→800", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const a = downstream(id!);
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const b = downstream(id!);
    expect(b.instance.dimensionsMm.width).toBe(900);
    expect(b.partIds).toEqual(a.partIds);
    expect(b.cutList).not.toEqual(a.cutList);
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 800, height: 870, depth: 580 } })).toBe(true);
    const a2 = downstream(id!);
    expect(a2.partIds).toEqual(a.partIds);
    expect(a2.cutList).toEqual(a.cutList);
    expect(a2.nestingIds).toEqual(a.nestingIds);
  });

  it("keeps two drawer instances isolated and manufacturing-local under move/rotation", () => {
    const store = usePlannerStore.getState();
    const drawerA = store.addFurnitureInstance("kitchen-drawer-3", { x: -900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const drawerB = store.addFurnitureInstance("kitchen-drawer-3", { x: 900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const a = downstream(drawerA!);
    const b = downstream(drawerB!);
    expect(a.partIds.filter((partId) => new Set(b.partIds).has(partId))).toHaveLength(0);
    expect(a.operations.map((operation) => operation.id).map((value) => value.replace(drawerA!, "INSTANCE")).sort()).toEqual(b.operations.map((operation) => operation.id).map((value) => value.replace(drawerB!, "INSTANCE")).sort());
    expect(store.updateFurnitureInstance(drawerA!, { positionMm: { x: -500, y: 120, z: 300 }, rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const moved = downstream(drawerA!);
    expect(moved.operations).toEqual(a.operations);
    expect(moved.instance.positionMm).toEqual({ x: -500, y: 120, z: 300 });
    expect(moved.instance.rotationDeg).toEqual({ x: 0, y: 90, z: 0 });
  });

  it("saves and reloads the drawer by moduleDefinitionId without persisting resolved profiles", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    expect(store.saveProject()).toBe(true);
    const saved = JSON.parse(storage.get(PROJECT_STORAGE_KEY) ?? "{}");
    const serialized = JSON.stringify(saved);
    expect(serialized).toContain("kitchen-drawer-3");
    expect(serialized).not.toContain("drawer-stack:equal-v1");
    expect(serialized).not.toContain("drawer-box:legacy-visual-v1");
    usePlannerStore.getState().newProject();
    storage.set(PROJECT_STORAGE_KEY, JSON.stringify(saved));
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    const reloaded = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    expect(reloaded.moduleDefinitionId).toBe("kitchen-drawer-3");
    expect(reloaded.parts.filter((part) => part.role === "drawer-front")).toHaveLength(3);
    expect(reloaded.parts.map((part) => part.id)).toEqual(downstream(id!).partIds);
  });
});
