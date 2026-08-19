import { describe, expect, it, beforeEach } from "vitest";
import "../../library";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import {
  buildJoineryReport,
} from "../../library/services/joineryReport";
import {
  buildNestingPlanFromPartDefinitions,
  validateNestingIntegrity,
} from "../../library/services/nestingPlan";
import { parseProject, serializeProject } from "../../library/services/projectPersistence";
import {
  FURNITURE_SLOTS,
  isFurnitureSlot,
  validateFurnitureSlotMap,
} from "../../library/contracts/FurnitureSlot";
import { usePlannerStore } from "./usePlannerStore";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function setupStorage() {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock, dispatchEvent: () => true },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

function projectSnapshot() {
  const state = usePlannerStore.getState();
  const instance = state.instances[0];
  if (!instance) throw new Error("Golden instance ausente");
  const joinery = buildJoineryReport([instance]);
  const fabrication = buildFabricationReport([instance]);
  const nesting = buildNestingPlanFromPartDefinitions(instance.parts);
  const integrity = validateNestingIntegrity(instance.parts, nesting);
  return {
    instanceId: instance.id,
    moduleId: instance.moduleDefinitionId,
    dimensions: instance.dimensionsMm,
    materials: instance.parts.map((part) => ({
      id: part.id,
      role: part.role,
      materialId: part.materialId,
      thicknessMm: part.thicknessMm,
      grainDirection: part.grainDirection,
      edgeBanding: part.edgeBanding,
    })),
    partIds: instance.parts.map((part) => part.id),
    hardwareIds: instance.parts.map((part) => part.hardwareId).filter(Boolean),
    operations: joinery.operations.map((operation) => ({
      id: operation.id,
      kind: operation.kind,
      moduleInstanceId: operation.moduleInstanceId,
      partId: operation.partId,
      hardwareId: operation.hardwareId ?? null,
      relatedPartIds: operation.relatedPartIds ?? [],
      parameters: operation.parameters ?? {},
    })),
    bom: fabrication.hardwareItems.map((item) => ({
      hardwareId: item.hardwareId,
      quantity: item.quantity,
      partIds: item.partIds,
    })),
    cutList: fabrication.cutItems.map((item) => ({
      key: item.key,
      partIds: item.partIds,
      materialId: item.materialId,
      thicknessMm: item.thicknessMm,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      depthMm: item.depthMm,
      grainDirection: item.grainDirection,
      edgeBanding: item.edgeBanding,
      quantity: item.quantity,
    })),
    nesting: {
      placements: nesting.boards.flatMap((board) =>
        board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h]),
      ),
      unplaced: nesting.unplaced.map((part) => part.id),
    },
    integrity,
  };
}

describe("Golden manufacturing contract — kitchen-base-2-doors", () => {
  beforeEach(setupStorage);

  it("registra o vocabulário semântico sem quebrar slots legados", () => {
    expect(FURNITURE_SLOTS).toEqual(expect.arrayContaining([
      "body", "front", "door", "back", "shelf", "edge", "handle", "hinge", "toe-kick", "countertop",
    ]));
    expect(isFurnitureSlot("body")).toBe(true);
    expect(isFurnitureSlot("legacy-zone")).toBe(false);
    const diagnostics = validateFurnitureSlotMap({
      body: "mdf-white",
      front: "mdf-freijo",
      handle: "handle-gola",
      "legacy-zone": "custom-material",
      invalid: "",
    });
    expect(diagnostics.known).toEqual(expect.arrayContaining(["body", "front", "handle"]));
    expect(diagnostics.legacy).toEqual(["legacy-zone"]);
    expect(diagnostics.invalid).toEqual(["invalid"]);
  });

  it("mantém slots, operações e fabricação em 900 → 1000 → 900 na mesma instância", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance(
      "kitchen-base-2-doors",
      undefined,
      { width: 900, height: 870, depth: 580 },
    );
    expect(id).toBeTruthy();
    expect(store.updateFurnitureInstance(id!, {
      materialOverrides: {
        body: "mdf-white",
        front: "mdf-freijo",
        door: "mdf-freijo",
        back: "mdf-white",
        shelf: "mdf-white",
        edge: "mdf-freijo",
      },
      hardwareOverrides: {
        handle: "handle-gola",
        hinge: "hinge-soft-close",
      },
    })).toBe(true);

    const checkpointA = projectSnapshot();
    const instanceA = usePlannerStore.getState().instances[0];
    expect(checkpointA.moduleId).toBe("kitchen-base-2-doors");
    expect(checkpointA.dimensions).toEqual({ width: 900, height: 870, depth: 580 });
    expect(instanceA.materialOverrides.body).toBe("mdf-white");
    expect(instanceA.materialOverrides.front).toBe("mdf-freijo");
    expect(instanceA.parts.filter((part) => part.role === "door").every((part) => part.materialId === "mdf-freijo")).toBe(true);
    expect(instanceA.parts.filter((part) => ["side-left", "side-right", "base", "top", "back", "shelf"].includes(part.role)).every((part) => part.materialId === "mdf-white")).toBe(true);

    const goldenKinds = new Set(checkpointA.operations.map((operation) => operation.kind));
    expect([...goldenKinds]).toEqual(expect.arrayContaining([
      "hinge-cup",
      "hinge-fixing",
      "gola-profile",
      "adjustable-foot",
      "toe-kick-profile",
      "toe-kick-clip",
      "shelf-support",
    ]));
    expect(checkpointA.operations.every((operation) => operation.moduleInstanceId === checkpointA.instanceId && operation.partId)).toBe(true);
    expect(checkpointA.operations.filter((operation) => operation.hardwareId).every((operation) => operation.relatedPartIds.length > 0)).toBe(true);
    expect(checkpointA.bom.map((item) => item.hardwareId)).toEqual(expect.arrayContaining([
      "hinge-soft-close", "handle-gola", "leg-adjustable", "toe-kick-profile", "toe-kick-clip", "shelf-support",
    ]));
    expect(checkpointA.cutList.every((item) => item.partIds.length > 0 && item.materialId && item.thicknessMm && item.grainDirection)).toBe(true);
    expect(checkpointA.integrity.missingInNesting).toEqual([]);
    expect(checkpointA.integrity.duplicateInNesting).toEqual([]);
    expect(checkpointA.integrity.unknownInNesting).toEqual([]);

    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 1000, height: 870, depth: 580 } })).toBe(true);
    const checkpointB = projectSnapshot();
    expect(checkpointB.instanceId).toBe(checkpointA.instanceId);
    expect(checkpointB.moduleId).toBe(checkpointA.moduleId);
    expect(checkpointB.dimensions.width).toBe(1000);
    expect(checkpointB.materials.filter((part) => part.role === "door").every((part) => part.materialId === "mdf-freijo")).toBe(true);
    expect(checkpointB.partIds).toEqual(checkpointA.partIds);
    expect(checkpointB.operations.map((operation) => operation.id)).toEqual(checkpointA.operations.map((operation) => operation.id));
    expect(checkpointB.bom).toEqual(checkpointA.bom);
    expect(checkpointB.integrity.missingInNesting).toEqual([]);
    expect(checkpointB.integrity.duplicateInNesting).toEqual([]);
    expect(checkpointB.integrity.unknownInNesting).toEqual([]);
    expect(checkpointB.cutList).not.toEqual(checkpointA.cutList);
    expect(checkpointB.nesting).not.toEqual(checkpointA.nesting);

    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const checkpointC = projectSnapshot();
    expect(checkpointC).toEqual(checkpointA);

    const persisted = serializeProject({
      planner: {
        furniture: usePlannerStore.getState().furniture,
        instances: usePlannerStore.getState().instances,
        selectedId: usePlannerStore.getState().selectedId,
        gridVisible: usePlannerStore.getState().gridVisible,
        lightsEnabled: usePlannerStore.getState().lightsEnabled,
        snapEnabled: usePlannerStore.getState().snapEnabled,
      },
      room: {
        width: 5000,
        depth: 4000,
        height: 2800,
        wallThickness: 120,
        openings: [],
        referenceImage: null,
        referenceName: null,
        referenceStyle: "natural",
      },
      immersive: { qualityMode: "realistic", autoOcclusion: true },
    });
    const parsed = parseProject(JSON.stringify(persisted));
    expect(parsed?.version).toBe(4);
    expect(parsed?.planner.instances[0].id).toBe(checkpointA.instanceId);
    expect(parsed?.planner.instances[0].parts.map((part) => part.id)).toEqual(checkpointA.partIds);
  });

  it("mantém o renderer como projeção da mesma instância de fabricação", async () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", undefined, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
    expect(instance).toBeTruthy();
    expect(instance?.parts).toBe(usePlannerStore.getState().instances.find((item) => item.id === id)?.parts);
  });
});
