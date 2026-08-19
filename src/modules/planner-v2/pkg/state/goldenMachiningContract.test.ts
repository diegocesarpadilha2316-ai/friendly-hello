import { beforeEach, describe, expect, it } from "vitest";
import "../../library";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { usePlannerStore } from "./usePlannerStore";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function setup() {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock, dispatchEvent: () => true },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

function createGolden() {
  const store = usePlannerStore.getState();
  const id = store.addFurnitureInstance(
    "kitchen-base-2-doors",
    { x: 0, y: 0, z: 0 },
    { width: 900, height: 870, depth: 580 },
  );
  expect(id).toBeTruthy();
  expect(store.updateFurnitureInstance(id!, {
    materialOverrides: { body: "mdf-white", front: "mdf-freijo", door: "mdf-freijo" },
    hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
  })).toBe(true);
  return id!;
}

function machiningSnapshot(id: string) {
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  if (!instance) throw new Error("Golden instance ausente");
  const joinery = buildJoineryReport([instance]);
  const machining = buildMachiningReport([instance], joinery.operations);
  return {
    instance,
    joinery,
    machining,
    operationIds: machining.operations.map((operation) => operation.id),
    localCoordinates: machining.operations.map((operation) => ({
      id: operation.id,
      partId: operation.partId,
      coordinates: operation.coordinates,
      relatedPartIds: operation.relatedPartIds,
    })),
  };
}

describe("Golden machining contract — Etapa 3", () => {
  beforeEach(setup);

  it("audita operações legadas e não promove defaults genéricos a usinagem industrial", () => {
    const id = createGolden();
    const { joinery, machining } = machiningSnapshot(id);
    expect(joinery.operations.some((operation) => operation.kind === "confirmat")).toBe(false);
    expect(joinery.operations.some((operation) => operation.kind === "dowel")).toBe(false);
    expect(joinery.readiness.find((item) => item.scope === "carcass-structural")?.status).toBe("INCOMPLETE");
    expect(machining.classifications.filter((item) => item.hardwareId === undefined).every((item) => item.classification === "ASSEMBLY")).toBe(true);
    expect(machining.system32).toBe("NOT_REQUIRED");
  });

  it("liga hinge-cup e hinge-fixing à porta, dobradiça e lateral correta", () => {
    const id = createGolden();
    const { instance, machining } = machiningSnapshot(id);
    const cup = machining.operations.filter((operation) => operation.type === "boring");
    const fixing = machining.assemblyReadiness.filter((item) => item.hardwareId === "hinge-soft-close");
    expect(cup.length).toBe(4);
    expect(fixing.length).toBe(4);
    expect(cup.every((operation) => operation.readiness === "INCOMPLETE")).toBe(true);
    expect(cup.every((operation) => operation.missingParameters.includes("cupDiameterMm"))).toBe(true);
    expect(fixing.every((item) => item.status === "INCOMPLETE")).toBe(true);
    expect(fixing.every((item) => item.missingParameters.includes("manufacturerVariantId"))).toBe(true);
  });

  it("gera shelf-support local quando há relação lateral-prateleira, mas não inventa Sistema 32", () => {
    const id = createGolden();
    const { instance, machining } = machiningSnapshot(id);
    const shelfOps = machining.operations.filter((operation) => operation.hardwareId === "shelf-support");
    expect(shelfOps.length).toBe(0);
    const shelfAssembly = machining.assemblyReadiness.filter((item) => item.hardwareId === "shelf-support");
    expect(shelfAssembly).toHaveLength(4);
    expect(shelfAssembly.every((item) => item.status === "INCOMPLETE" && item.missingParameters.includes("patternPitchMm"))).toBe(true);
  });

  it("classifica Gola, pés, clips e rodapé como montagem/hardware/perfil", () => {
    const id = createGolden();
    const { machining } = machiningSnapshot(id);
    expect(machining.classifications.find((item) => item.hardwareId === "handle-gola")?.classification).toBe("PURCHASED_HARDWARE");
    expect(machining.classifications.filter((item) => item.hardwareId === "leg-adjustable")).toHaveLength(4);
    expect(machining.classifications.filter((item) => item.hardwareId === "leg-adjustable").every((item) => item.classification === "PURCHASED_HARDWARE")).toBe(true);
    expect(machining.classifications.filter((item) => item.hardwareId === "toe-kick-clip")).toHaveLength(2);
    expect(machining.classifications.find((item) => item.hardwareId === "toe-kick-profile")?.classification).toBe("PROFILE");
  });

  it("mantém IDs de usinagem e coordenadas locais ao mover, rotacionar e alterar material", () => {
    const store = usePlannerStore.getState();
    const id = createGolden();
    const before = machiningSnapshot(id);
    expect(store.updateFurnitureInstance(id, { positionMm: { x: 800, y: 0, z: -600 } })).toBe(true);
    expect(store.updateFurnitureInstance(id, { rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const afterSceneTransform = machiningSnapshot(id);
    expect(afterSceneTransform.operationIds).toEqual(before.operationIds);
    expect(afterSceneTransform.localCoordinates).toEqual(before.localCoordinates);

    expect(store.updateFurnitureInstance(id, {
      materialOverrides: { body: "mdf-white", front: "mdf-freijo", door: "mdf-freijo" },
    })).toBe(true);
    const afterMaterial = machiningSnapshot(id);
    expect(afterMaterial.operationIds).toEqual(before.operationIds);
    expect(afterMaterial.localCoordinates).toEqual(before.localCoordinates);

    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 1000, height: 870, depth: 580 } })).toBe(true);
    const at1000 = machiningSnapshot(id);
    expect(at1000.operationIds).toEqual(before.operationIds);

    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const restored = machiningSnapshot(id);
    expect(restored.operationIds).toEqual(before.operationIds);
    expect(restored.machining.readiness).toEqual(before.machining.readiness);
  });
});
