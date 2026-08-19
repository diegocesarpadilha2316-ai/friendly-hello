import "../../library/index";
import { beforeEach, describe, expect, it } from "vitest";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
import { ConstructionProfileRegistry } from "../../library/registry/ConstructionProfileRegistry";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
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

function createPilot(depth = 580) {
  const id = usePlannerStore.getState().addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth });
  expect(id).toBeTruthy();
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  expect(instance).toBeTruthy();
  return { id: id!, instance: instance! };
}

describe("Stage 11 — Blum MOVENTO 760H industrial pilot", () => {
  beforeEach(setupStore);

  it("registers one official MOVENTO 760H NL 500 variant and keeps it separate from the generic slide", () => {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-drawer-3");
    const rule = profile?.drawerIndustrialSlideRule;
    const variant = HardwareRegistry.getManufacturingVariant("slide-hidden-soft-close", "blum-movento-760h-nl500");
    const runnerSpec = variant?.manufacturingSpec.kind === "runner" ? variant.manufacturingSpec : undefined;
    expect(rule).toMatchObject({ manufacturer: "Blum", family: "MOVENTO", variant: "760H", nominalLengthMm: 500 });
    expect(runnerSpec?.kind).toBe("runner");
    expect(runnerSpec?.dynamicCarryingCapacityKg).toBe(40);
    expect(runnerSpec?.supportedNominalLengthsMm).toContain(500);
    expect(runnerSpec?.drawerDimensionRules).toMatchObject({
      internalDrawerWidthFormula: "LW - 42 mm",
      drawerLengthFormula: "NL - 10 mm",
      sidePanelMaximumThicknessMm: 16,
      recessHeightMm: { min: 12, max: 15 },
      recessDepthMaximumMm: 15,
    });
  });

  it("derives the actual box from the carcass opening using Blum SKW/SKL", () => {
    const { instance } = createPilot();
    const sides = instance.parts.filter((part) => part.role === "drawer-side");
    const boxFronts = instance.parts.filter((part) => part.role === "drawer-box-front");
    expect(instance.hardwareVariantIds?.slide).toBe("blum-movento-760h-nl500");
    expect(sides).toHaveLength(6);
    expect(boxFronts).toHaveLength(3);
    expect(new Set(sides.map((part) => part.dimensionsMm.depth))).toEqual(new Set([490]));
    expect(new Set(boxFronts.map((part) => part.dimensionsMm.width))).toEqual(new Set([722]));
    expect(new Set(boxFronts.map((part) => part.dimensionsMm.depth))).toEqual(new Set([15]));
  });

  it("propagates Blum family/NL into BOM while preserving cut-list and nesting identity", () => {
    const { instance } = createPilot();
    const fabrication = buildFabricationReport([instance]);
    const slide = fabrication.hardwareItems.find((item) => item.hardwareId === "slide-hidden-soft-close");
    expect(slide).toMatchObject({
      quantity: 6,
      hardwareVariantId: "blum-movento-760h-nl500",
      manufacturer: "Blum",
      model: "MOVENTO 760H",
    });
    expect(fabrication.cutItems.some((item) => item.partIds.some((id) => id.includes(":box-front")))).toBe(true);
  });

  it("marks documented runner assembly READY and CNC coordinates INCOMPLETE", () => {
    const { id, instance } = createPilot();
    const joinery = buildJoineryReport([instance]);
    const machining = buildMachiningReport([instance], joinery.operations);
    const slideAssembly = machining.assemblyReadiness.filter((item) => item.hardwareVariantId === "blum-movento-760h-nl500");
    const slideOperations = machining.operations.filter((item) => item.hardwareVariantId === "blum-movento-760h-nl500");
    expect(slideAssembly).toHaveLength(6);
    expect(slideAssembly.every((item) => item.status === "READY")).toBe(true);
    expect(slideOperations).toHaveLength(6);
    expect(slideOperations.every((item) => item.readiness === "INCOMPLETE")).toBe(true);
    expect(slideOperations.every((item) => item.missingParameters.includes("runnerMountingCoordinates"))).toBe(true);
    expect(slideOperations.every((item) => item.instanceId === id && instance.parts.some((part) => part.id === item.partId))).toBe(true);
  });

  it("rejects an opening whose internal depth cannot contain the documented SKL", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 480 });
    expect(id).toBeNull();
    expect(usePlannerStore.getState().lastLibraryError).toContain("não comporta SKL 490 mm");
  });

  it("persists only the selected variant reference, not the resolved industrial object", () => {
    const { id } = createPilot();
    expect(usePlannerStore.getState().saveProject()).toBe(true);
    const saved = JSON.parse(storage.get(PROJECT_STORAGE_KEY) ?? "{}");
    const serialized = JSON.stringify(saved);
    expect(serialized).toContain("blum-movento-760h-nl500");
    expect(serialized).not.toContain("supportedNominalLengthsMm");
    usePlannerStore.getState().newProject();
    storage.set(PROJECT_STORAGE_KEY, JSON.stringify(saved));
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    const reloaded = usePlannerStore.getState().instances.find((item) => item.id === id);
    expect(reloaded?.hardwareVariantIds?.slide).toBe("blum-movento-760h-nl500");
    expect(reloaded?.parts.filter((part) => part.role === "drawer-side")).toHaveLength(6);
  });
});
