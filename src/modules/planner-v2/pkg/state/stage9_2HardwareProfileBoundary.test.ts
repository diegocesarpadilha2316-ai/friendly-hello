import "../../library/index";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ConstructionProfileRegistry, ConstructionProfileRegistryImpl } from "../../library/registry/ConstructionProfileRegistry";
import * as profileRegistryModule from "../../library/registry/ConstructionProfileRegistry";
import { GOLDEN_CONSTRUCTION_PROFILES } from "../../library/families/kitchen/constructionProfiles";
import { GOLDEN_71B3550_173H7100_RULE } from "../../library/families/kitchen/applicationRules";
import { getLegacyKitchenRules } from "../../library/families/kitchen/legacyKitchenDispatch";
import { usePlannerStore } from "./usePlannerStore";

const BASE_ID = "kitchen-base-2-doors";
const UPPER_ID = "kitchen-golden-upper-800";
const LEGACY_ID = "kitchen-base-1-door";

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

function hardwareSummary(instance: NonNullable<ReturnType<typeof usePlannerStore.getState>["instances"]>[number]) {
  return instance.parts
    .filter((part) => part.role === "hardware")
    .map((part) => part.hardwareId ?? part.id.split(":").at(-1) ?? "")
    .sort();
}

describe("Stage 9.2 — HardwareApplicationRule boundary", () => {
  beforeEach(setupStore);

  it("keeps professional lookup explicit and never falls back across definitions", () => {
    const baseRule = ConstructionProfileRegistry.getHardwareApplicationRule(BASE_ID);
    const upperRule = ConstructionProfileRegistry.getHardwareApplicationRule(UPPER_ID);
    const legacyRule = ConstructionProfileRegistry.getHardwareApplicationRule(LEGACY_ID);

    expect(baseRule?.id).toBe("kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100");
    expect(upperRule).toBeUndefined();
    expect(legacyRule).toBeUndefined();
  });

  it("keeps the Golden Base rule available only through the legacy adapter", () => {
    expect(getLegacyKitchenRules(BASE_ID, 2).hardwareApplicationRule?.moduleDefinitionId).toBe(BASE_ID);
    expect(getLegacyKitchenRules(LEGACY_ID, 1).hardwareApplicationRule).toBeUndefined();
  });

  it("locks the Registry against a global professional hardware default", () => {
    const source = readFileSync(new URL("../../library/registry/ConstructionProfileRegistry.ts", import.meta.url), "utf8");
    expect(source).not.toContain("defaultHardwareApplicationRule");
    expect(source).not.toContain("registerDefaultHardwareApplicationRule");
    expect(source).toContain("return this.profiles.get(moduleDefinitionId)?.hardwareApplicationRule");
  });

  it("rejects a Base HardwareApplicationRule attached to the Upper profile", () => {
    const upper = GOLDEN_CONSTRUCTION_PROFILES.find((profile) => profile.moduleDefinitionId === UPPER_ID)!;
    const registry = new ConstructionProfileRegistryImpl();
    expect(() => registry.register({ ...upper, hardwareApplicationRule: GOLDEN_71B3550_173H7100_RULE })).toThrow(/HardwareApplicationRule .* não pertence/);
  });

  it("isolates Base A, Upper A and Upper B by Definition ID rather than instanceId", () => {
    const baseA = usePlannerStore.getState().addFurnitureInstance(BASE_ID, { x: -900, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const upperA = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const upperB = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 900, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const instances = usePlannerStore.getState().instances;
    expect(new Set([baseA, upperA, upperB]).size).toBe(3);
    expect(instances.find((instance) => instance.id === baseA)?.moduleDefinitionId).toBe(BASE_ID);
    expect(instances.find((instance) => instance.id === upperA)?.moduleDefinitionId).toBe(UPPER_ID);
    expect(instances.find((instance) => instance.id === upperB)?.moduleDefinitionId).toBe(UPPER_ID);
    expect(ConstructionProfileRegistry.getHardwareApplicationRule(BASE_ID)?.moduleDefinitionId).toBe(BASE_ID);
    expect(ConstructionProfileRegistry.getHardwareApplicationRule(UPPER_ID)).toBeUndefined();
  });

  it("proves the professional builder queries by moduleDefinitionId, never instanceId", () => {
    const lookupSpy = vi.spyOn(profileRegistryModule.ConstructionProfileRegistry, "getHardwareApplicationRule");
    const baseId = usePlannerStore.getState().addFurnitureInstance(BASE_ID, { x: -500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const upperId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 500, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(baseId).toBeTruthy();
    expect(upperId).toBeTruthy();
    expect(lookupSpy).toHaveBeenCalledWith(BASE_ID);
    expect(lookupSpy).toHaveBeenCalledWith(UPPER_ID);
    expect(lookupSpy.mock.calls.some(([value]) => value === baseId || value === upperId)).toBe(false);
  });

  it("records the current physical Upper output and hardware roles", () => {
    const upperId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const upper = usePlannerStore.getState().instances.find((instance) => instance.id === upperId)!;
    const hardware = hardwareSummary(upper);

    expect(upper.parts).toHaveLength(32);
    expect(upper.parts.filter((part) => part.role === "hardware")).toHaveLength(22);
    expect(hardware.filter((id) => id === "hinge-soft-close")).toHaveLength(4);
    expect(hardware.filter((id) => id === "mounting-plate-37-32")).toHaveLength(4);
    expect(hardware.filter((id) => id === "handle-cava")).toHaveLength(2);
    expect(hardware.filter((id) => id === "shelf-support")).toHaveLength(12);
  });
});
