import { beforeEach, describe, expect, it } from "vitest";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { serializeModule } from "../../library/services/serializeModule";
import { PROJECT_STORAGE_KEY } from "../../library/services/projectPersistence";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
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
    value: {
      localStorage: localStorageMock,
      dispatchEvent: () => true,
      CustomEvent: class CustomEvent {
        constructor(public type: string) {}
      },
    },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

function createGolden(verified = false) {
  const store = usePlannerStore.getState();
  const id = store.addFurnitureInstance(
    "kitchen-base-2-doors",
    { x: 0, y: 0, z: 0 },
    { width: 900, height: 870, depth: 580 },
  );
  expect(id).toBeTruthy();
  expect(store.updateFurnitureInstance(id!, {
    materialOverrides: { body: "mdf-white", front: "mdf-freijo", door: "mdf-freijo" },
    hardwareOverrides: {
      handle: "handle-gola",
      hinge: "hinge-soft-close",
      mountingPlate: "mounting-plate-37-32",
    },
    hardwareVariantIds: verified
      ? { hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" }
      : undefined,
  })).toBe(true);
  return id!;
}

function reports(id: string) {
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  if (!instance) throw new Error("Golden ausente");
  const joinery = buildJoineryReport([instance]);
  const machining = buildMachiningReport([instance], joinery.operations);
  const fabrication = buildFabricationReport([instance]);
  return { instance, joinery, machining, fabrication };
}

describe("Golden hardware manufacturing specification — Etapa 4.1", () => {
  beforeEach(setup);

  it("mantém hardware genérico e variante desconhecida INCOMPLETE", () => {
    const generic = reports(createGolden());
    expect(generic.machining.operations.filter((operation) => operation.hardwareId === "hinge-soft-close").every((operation) => operation.readiness === "INCOMPLETE")).toBe(true);
    expect(generic.machining.operations.filter((operation) => operation.hardwareId === "mounting-plate-37-32").every((operation) => operation.readiness === "INCOMPLETE")).toBe(true);

    setup();
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    expect(store.updateFurnitureInstance(id!, {
      hardwareOverrides: { hinge: "hinge-soft-close", mountingPlate: "mounting-plate-37-32" },
      hardwareVariantIds: { hinge: "does-not-exist", mountingPlate: "does-not-exist" },
    })).toBe(true);
    const invalid = reports(id!);
    expect(invalid.machining.warnings.some((warning) => warning.includes("does-not-exist"))).toBe(true);
    expect(invalid.machining.operations.every((operation) => operation.readiness !== "READY")).toBe(true);
  });

  it("mantém 71B3550 verificada, 173H7100 separada e a relação é compatível", () => {
    const hinge = HardwareRegistry.getManufacturingVariant("hinge-soft-close", "blum-71b3550-standard-110");
    const plate = HardwareRegistry.getManufacturingVariant("mounting-plate-37-32", "blum-173h7100-37-32");
    expect(hinge?.manufacturerCode).toBe("71B3550");
    expect(plate?.manufacturerCode).toBe("173H7100");
    if (!hinge || !("compatibleMountingPlateVariantIds" in hinge)) throw new Error("Variante de dobradiça sem compatibilidade de placa");
    if (!plate || !("compatibleHardwareVariantIds" in plate)) throw new Error("Variante de placa sem compatibilidade de dobradiça");
    expect(hinge.compatibleMountingPlateVariantIds).toContain("blum-173h7100-37-32");
    expect(plate.compatibleHardwareVariantIds).toContain("blum-71b3550-standard-110");
    expect(hinge?.id).not.toBe(plate?.id);
  });

  it("não confunde parafuso com pré-furo e mantém assembly READY separado de machining", () => {
    const { instance, machining, fabrication } = reports(createGolden(true));
    const hingeCup = machining.operations.filter((operation) => operation.type === "boring");
    const hingeFixing = machining.operations.filter((operation) => operation.hardwareId === "hinge-soft-close" && operation.parameters.hingePartId && operation.type === "drilling");
    const platePilot = machining.operations.filter((operation) => operation.hardwareId === "mounting-plate-37-32");
    expect(hingeCup).toHaveLength(4);
    expect(hingeCup.every((operation) => operation.diameterMm === 35 && operation.depthMm === 13)).toBe(true);
    expect(hingeCup.every((operation) => operation.parameters.boringDistanceMinMm === 3 && operation.parameters.boringDistanceMaxMm === 7)).toBe(true);
    expect(hingeCup.every((operation) => operation.parameters.selectedBoringDistanceMm === null)).toBe(true);
    expect(hingeCup.every((operation) => operation.readiness === "INCOMPLETE")).toBe(true);
    expect(hingeFixing).toHaveLength(0);
    const hingeAssembly = machining.assemblyReadiness.filter((item) => item.hardwareId === "hinge-soft-close");
    expect(hingeAssembly).toHaveLength(4);
    expect(hingeAssembly.every((item) => item.status === "READY")).toBe(true);
    expect(platePilot).toHaveLength(0);
    const plateAssembly = machining.assemblyReadiness.filter((item) => item.hardwareId === "mounting-plate-37-32");
    expect(plateAssembly).toHaveLength(8);
    expect(plateAssembly.filter((item) => item.status === "READY")).toHaveLength(4);
    expect(plateAssembly.filter((item) => item.status === "INCOMPLETE")).toHaveLength(4);
    expect(plateAssembly.filter((item) => item.status === "INCOMPLETE").every((item) => item.missingParameters.includes("pilotHoleDiameterMm"))).toBe(true);
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "hinge-soft-close")?.quantity).toBe(4);
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "hinge-soft-close")?.manufacturerCode).toBe("71B3550");
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "mounting-plate-37-32")?.quantity).toBe(4);
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "mounting-plate-37-32")?.manufacturerCode).toBe("173H7100");
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "hinge-soft-close")?.partIds.every((partId) => instance.parts.find((part) => part.id === partId)?.name === "Dobradiça")).toBe(true);
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "mounting-plate-37-32")?.partIds.every((partId) => instance.parts.find((part) => part.id === partId)?.name === "Placa de montagem")).toBe(true);
  });

  it("preserva IDs, relações, persistência e determinismo em movimento, rotação e 900→1000→900", () => {
    const store = usePlannerStore.getState();
    const id = createGolden(true);
    const before = reports(id);
    const beforeIds = before.machining.operations.map((operation) => operation.id);
    const beforeCoordinates = before.machining.operations.map((operation) => operation.coordinates);
    expect(before.machining.operations.filter((operation) => operation.hardwareId === "hinge-soft-close" || operation.hardwareId === "mounting-plate-37-32").every((operation) => Boolean(operation.sourceJoineryId) && operation.relatedPartIds.some((partId) => before.instance.parts.find((part) => part.id === partId)?.role === "door"))).toBe(true);
    const serialized = serializeModule(before.instance);
    expect(serialized.hardwareVariantIds).toEqual({ hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" });
    expect(JSON.stringify(serialized)).not.toContain("pilotHoleDiameterMm");
    expect(JSON.stringify(serialized)).not.toContain("boringDistanceRangeMm");

    expect(store.updateFurnitureInstance(id, { positionMm: { x: 700, y: 0, z: -500 } })).toBe(true);
    expect(store.updateFurnitureInstance(id, { rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const moved = reports(id);
    expect(moved.machining.operations.map((operation) => operation.id)).toEqual(beforeIds);
    expect(moved.machining.operations.map((operation) => operation.coordinates)).toEqual(beforeCoordinates);

    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 1000, height: 870, depth: 580 } })).toBe(true);
    const at1000 = reports(id);
    expect(at1000.instance.hardwareVariantIds).toEqual({ hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" });
    expect(at1000.machining.operations.map((operation) => operation.id)).toEqual(beforeIds);

    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const restored = reports(id);
    expect(restored.machining.operations.map((operation) => operation.id)).toEqual(beforeIds);
    expect(restored.machining.assemblyReadiness.filter((item) => item.hardwareId === "hinge-soft-close").every((item) => item.status === "READY")).toBe(true);
    expect(restored.machining.assemblyReadiness.filter((item) => item.hardwareId === "mounting-plate-37-32" && item.status === "INCOMPLETE").length).toBe(4);
    expect(store.saveProject()).toBe(true);
    expect(storage.get(PROJECT_STORAGE_KEY)).toContain("blum-173h7100-37-32");
    expect(store.loadProject()).toBe(true);
    expect(usePlannerStore.getState().instances.find((item) => item.id === id)?.hardwareVariantIds).toEqual({
      hinge: "blum-71b3550-standard-110",
      mountingPlate: "blum-173h7100-37-32",
    });
  });
});
