import "../../library/index";
import { beforeEach, describe, expect, it } from "vitest";
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
  Object.defineProperty(globalThis, "window", { value: { localStorage: localStorageMock, dispatchEvent: () => true }, configurable: true });
  storage.clear();
  usePlannerStore.getState().newProject();
}

describe("Stage 12.1 — Professional Joinery / Machining Truth", () => {
  beforeEach(setup);

  it("requires every joinery source to declare role and truth status", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const report = buildJoineryReport([instance]);
    expect(report.operations.length).toBeGreaterThan(0);
    expect(report.operations.every((operation) => operation.manufacturingRole && operation.truthStatus)).toBe(true);
    expect(report.operations.some((operation) => operation.truthStatus === "INCOMPLETE")).toBe(true);
  });

  it("never represents unknown joinery dimensions with zero", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const report = buildJoineryReport([instance]);
    expect(report.operations.some((operation) => operation.diameterMm === 0 || operation.depthMm === 0)).toBe(false);
    expect(report.operations.filter((operation) => operation.truthStatus === "INCOMPLETE").every((operation) => (operation.unknownParameters?.length ?? 0) > 0)).toBe(true);
  });

  it("separates assembly, visual hardware and machining downstream", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const joinery = buildJoineryReport([instance]);
    const machining = buildMachiningReport([instance], joinery.operations);
    expect(machining.operations.filter((operation) => operation.sourceJoineryId && joinery.operations.find((source) => source.id === operation.sourceJoineryId)?.manufacturingRole === "ASSEMBLY").every((operation) => joinery.operations.find((source) => source.id === operation.sourceJoineryId)?.kind === "runner-installation")).toBe(true);
    expect(machining.classifications.some((record) => record.classification === "MACHINING")).toBe(true);
    expect(machining.assemblyReadiness.some((item) => item.status === "READY" || item.status === "INCOMPLETE")).toBe(true);
    expect(machining.classifications.some((record) => record.classification === "PURCHASED_HARDWARE" || record.classification === "PROFILE")).toBe(true);
  });

  it("keeps the legacy path isolated from professional truth operations", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-upper-2-doors", { x: 0, y: 900, z: 0 }, { width: 800, height: 720, depth: 350 });
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const joinery = buildJoineryReport([instance]);
    const machining = buildMachiningReport([instance], joinery.operations);
    expect(machining.operations).toEqual([]);
    expect(machining.warnings).toEqual([]);
    expect(joinery.operations.length).toBeGreaterThan(0);
  });
});
