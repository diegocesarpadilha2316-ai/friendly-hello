import "../../library/index";
import { describe, expect, it, beforeEach } from "vitest";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../../library/services/nestingPlan";
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

function currentInstance(id: string) {
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  if (!instance) throw new Error(`Instância ausente: ${id}`);
  return instance;
}

function downstream(id: string) {
  const instance = currentInstance(id);
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
    localOperations: machining.operations.map((operation) => ({
      id: operation.id,
      partId: operation.partId,
      instanceId: operation.instanceId,
      coordinates: operation.coordinates,
      relatedPartIds: operation.relatedPartIds,
      readiness: operation.readiness,
    })),
    bom: fabrication.hardwareItems.map((item) => ({ hardwareId: item.hardwareId, quantity: item.quantity, partIds: item.partIds })),
    cutList: fabrication.cutItems.map((item) => ({ key: item.key, quantity: item.quantity, partIds: item.partIds, materialId: item.materialId, thicknessMm: item.thicknessMm, grainDirection: item.grainDirection })),
    nestingIds: [...nesting.boards.flatMap((board) => board.placements.map((placement) => placement.code)), ...nesting.unplaced.map((part) => part.id)],
  };
}

describe("Step 8.1 — Upper downstream acceptance", () => {
  beforeEach(setupStore);

  it("preserva A→B→A, BOM, cut-list, nesting e operações locais", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-golden-upper-800", { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(id).toBeTruthy();
    const a = downstream(id!);
    expect(a.instance.parts).toHaveLength(32);
    expect(a.bom.find((item) => item.hardwareId === "shelf-support")?.quantity).toBe(12);
    expect(a.bom.find((item) => item.hardwareId === "hinge-soft-close")?.quantity).toBe(4);
    expect(a.bom.find((item) => item.hardwareId === "mounting-plate-37-32")?.quantity).toBe(4);
    expect(a.bom.find((item) => item.hardwareId === "handle-cava")?.quantity).toBe(2);
    expect(a.cutList.every((item) => item.partIds.length > 0 && item.materialId && item.thicknessMm && item.grainDirection)).toBe(true);
    expect(a.integrity).toMatchObject({ missingInNesting: [], duplicateInNesting: [], unknownInNesting: [] });
    expect(a.nestingIds.every((partId) => a.instance.parts.some((part) => part.id === partId && part.role !== "hardware"))).toBe(true);
    expect(a.joinery.operations.every((operation) => operation.moduleInstanceId === id && operation.partId && a.instance.parts.some((part) => part.id === operation.partId))).toBe(true);
    expect(a.machining.operations.every((operation) => operation.instanceId === id && a.instance.parts.some((part) => part.id === operation.partId))).toBe(true);
    expect(a.machining.operations.every((operation) => operation.readiness === "READY" || operation.missingParameters.length > 0)).toBe(true);
    expect(a.machining.operations.filter((operation) => operation.readiness === "INCOMPLETE").every((operation) => operation.missingParameters.length > 0)).toBe(true);

    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 850, height: 700, depth: 350 } })).toBe(true);
    const b = downstream(id!);
    expect(b.instance.id).toBe(a.instance.id);
    expect(b.instance.dimensionsMm.width).toBe(850);
    expect(b.partIds).toEqual(a.partIds);
    expect(b.cutList).not.toEqual(a.cutList);
    expect(b.nestingIds.every((partId) => b.instance.parts.some((part) => part.id === partId))).toBe(true);

    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 800, height: 700, depth: 350 } })).toBe(true);
    const a2 = downstream(id!);
    expect(a2.cutList).toEqual(a.cutList);
    expect(a2.nestingIds).toEqual(a.nestingIds);
    expect(a2.localOperations).toEqual(a.localOperations);
  });

  it("mantém duas instâncias Upper isoladas e fabricação local invariável a move/rotation", () => {
    const store = usePlannerStore.getState();
    const upperA = store.addFurnitureInstance("kitchen-golden-upper-800", { x: -900, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const upperB = store.addFurnitureInstance("kitchen-golden-upper-800", { x: 900, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(upperA).toBeTruthy();
    expect(upperB).toBeTruthy();
    expect(upperA).not.toBe(upperB);
    const a = downstream(upperA!);
    const b = downstream(upperB!);
    expect(a.instance.moduleDefinitionId).toBe(b.instance.moduleDefinitionId);
    const bPartIds = new Set(b.partIds);
    expect(a.partIds.filter((partId) => bPartIds.has(partId))).toHaveLength(0);
    expect(a.machining.operations.map((operation) => operation.id).map((id) => id.replace(upperA!, "INSTANCE")).sort()).toEqual(
      b.machining.operations.map((operation) => operation.id).map((id) => id.replace(upperB!, "INSTANCE")).sort(),
    );
    const before = a.localOperations;
    expect(store.updateFurnitureInstance(upperA!, { positionMm: { x: -500, y: 1650, z: 300 }, rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const after = downstream(upperA!);
    expect(after.localOperations).toEqual(before);
    expect(after.instance.positionMm).toEqual({ x: -500, y: 1650, z: 300 });
    expect(after.instance.rotationDeg).toEqual({ x: 0, y: 90, z: 0 });
  });
});
