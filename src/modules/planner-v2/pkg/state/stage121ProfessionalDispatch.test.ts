import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { ConstructionProfileRegistry } from "../../library/registry/ConstructionProfileRegistry";
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

function instanceOf(id: string) {
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  expect(instance).toBeDefined();
  return instance!;
}

describe("Stage 12.1 — professional dispatch boundary", () => {
  beforeEach(setup);

  it("does not select confirmat+dowel and uses only the declared professional structural rule", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const report = buildJoineryReport([instanceOf(id!)]);
    expect(report.operations.filter((operation) => ["confirmat", "dowel"].includes(operation.kind))).toEqual([]);
    expect(report.operations.filter((operation) => ["minifix-head", "minifix-body"].includes(operation.kind))).toHaveLength(16);
    expect(report.structuralJoinery).toHaveLength(1);
    expect(report.readiness).toEqual(expect.arrayContaining([expect.objectContaining({ scope: "carcass-structural", status: "READY", missingParameters: [] })]));
  });

  it("keeps Upper professional with NO_PROFILE_HARDWARE_RULE and no generic hinge", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-golden-upper-800", { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const instance = instanceOf(id!);
    expect(ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId)?.hardwareApplicationRule).toBeUndefined();
    const joinery = buildJoineryReport([instance]);
    const machining = buildMachiningReport([instance], joinery.operations);
    expect(joinery.operations.filter((operation) => ["hinge-cup", "hinge-fixing", "mounting-plate-placement", "mounting-plate-fixing"].includes(operation.kind))).toEqual([]);
    expect(machining.operations).toEqual([]);
    expect(joinery.readiness).toEqual(expect.arrayContaining([expect.objectContaining({ scope: "hardware-application", status: "INCOMPLETE", missingParameters: ["hardwareApplicationRule"] })]));
  });

  it("creates exactly six runner relations for MOVENTO and never targets drawer-bottom", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = instanceOf(id!);
    const joinery = buildJoineryReport([instance]);
    const runner = joinery.operations.filter((operation) => operation.kind === "runner-installation");
    expect(runner).toHaveLength(6);
    expect(runner.every((operation) => instance.parts.find((part) => part.id === operation.partId)?.role === "drawer-side")).toBe(true);
    expect(runner.some((operation) => instance.parts.find((part) => part.id === operation.partId)?.role === "drawer-bottom")).toBe(false);
  });

  it("does not convert a visual handle into through-hole machining", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-drawer-3", { x: 0, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const instance = instanceOf(id!);
    expect(usePlannerStore.getState().updateFurnitureInstance(id!, { hardwareOverrides: { handle: "handle-gola" } })).toBe(true);
    const rebuilt = instanceOf(id!);
    const joinery = buildJoineryReport([rebuilt]);
    expect(joinery.operations.filter((operation) => operation.kind === "handle-through")).toEqual([]);
    expect(joinery.readiness).toEqual(expect.arrayContaining([expect.objectContaining({ scope: "handle-application", status: "INCOMPLETE" })]));
  });

  it("does not gate professional machining by a hardcoded family ID", () => {
    const source = readFileSync(new URL("../../library/services/machiningReport.ts", import.meta.url), "utf8");
    expect(source).not.toContain("GOLDEN_MODULE_ID");
    expect(source).not.toContain("GOLDEN_DRAWER_MODULE_ID");
    expect(source).toContain("ConstructionProfileRegistry.getByModuleDefinitionId");
    const joinerySource = readFileSync(new URL("../../library/services/joineryReport.ts", import.meta.url), "utf8");
    const professionalStart = joinerySource.indexOf("function professionalBuildJoineryOperations");
    const professionalEnd = joinerySource.indexOf("export function buildJoineryReport");
    const professionalSection = joinerySource.slice(professionalStart, professionalEnd);
    expect(professionalSection).not.toContain("legacyBuildJoineryOperations");
    expect(professionalSection).not.toContain("kitchen-golden-upper-800");
    expect(joinerySource).toContain("unknownParameters: truth.unknownParameters");
  });
});
