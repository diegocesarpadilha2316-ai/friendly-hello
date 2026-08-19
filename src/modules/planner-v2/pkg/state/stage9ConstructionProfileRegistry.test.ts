import "../../library/index";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ConstructionProfileRegistry, ConstructionProfileRegistryImpl } from "../../library/registry/ConstructionProfileRegistry";
import { GOLDEN_CONSTRUCTION_PROFILES } from "../../library/families/kitchen/constructionProfiles";
import { GOLDEN_CARCASS_CONSTRUCTION_RULE } from "../../library/families/kitchen/carcassConstructionRules";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE } from "../../library/families/kitchen/frontLayoutRules";
import type { ConstructionProfile } from "../../library/contracts/ConstructionProfile";
import { usePlannerStore } from "./usePlannerStore";
import * as profileRegistryModule from "../../library/registry/ConstructionProfileRegistry";
import { PROJECT_STORAGE_KEY } from "../../library/services/projectPersistence";

const UPPER_ID = "kitchen-golden-upper-800";
const BASE_ID = "kitchen-base-2-doors";
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

function cloneProfile(profile: ConstructionProfile, overrides: Partial<ConstructionProfile> = {}): ConstructionProfile {
  return { ...profile, ...overrides };
}

describe("Stage 9 — ConstructionProfileRegistry", () => {
  beforeEach(setupStore);
  it("registra somente profiles declarativos Golden e não usa instanceId como chave", () => {
    expect(ConstructionProfileRegistry.getByModuleDefinitionId(BASE_ID)?.id).toBe("kitchen-base-2-doors:construction-profile-v1");
    expect(ConstructionProfileRegistry.getByModuleDefinitionId(UPPER_ID)?.id).toBe("kitchen-golden-upper-800:construction-profile-v1");
    expect(ConstructionProfileRegistry.getByModuleDefinitionId("furniture-123456")).toBeUndefined();
    expect(ConstructionProfileRegistry.list().map((profile) => profile.moduleDefinitionId)).toEqual([BASE_ID, UPPER_ID]);
  });

  it("rejeita profile vazio, duplicado e rules destinadas a outra definição", () => {
    const registry = new ConstructionProfileRegistryImpl();
    const upper = GOLDEN_CONSTRUCTION_PROFILES.find((profile) => profile.moduleDefinitionId === UPPER_ID)!;
    expect(() => registry.register(cloneProfile(upper, { id: "" }))).toThrow(/id é obrigatório/);
    registry.register(upper);
    expect(() => registry.register(upper)).toThrow(/duplicado/);
    const mismatchRegistry = new ConstructionProfileRegistryImpl();
    expect(() => mismatchRegistry.register(cloneProfile(upper, { moduleDefinitionId: BASE_ID }))).toThrow(/não pertence/);
    const wrongRuleRegistry = new ConstructionProfileRegistryImpl();
    expect(() => wrongRuleRegistry.register(cloneProfile(upper, { carcassRule: GOLDEN_CARCASS_CONSTRUCTION_RULE }))).toThrow(/não pertence/);
    const wrongFrontRegistry = new ConstructionProfileRegistryImpl();
    expect(() => wrongFrontRegistry.register(cloneProfile(upper, { frontLayoutRule: GOLDEN_2_DOOR_FRONT_LAYOUT_RULE }))).toThrow(/não pertence/);
  });

  it("mantém ordem e referências estáveis em chamadas repetidas", () => {
    const first = ConstructionProfileRegistry.list();
    const second = ConstructionProfileRegistry.list();
    expect(second.map((profile) => profile.id)).toEqual(first.map((profile) => profile.id));
    expect(second[0].carcassRule).toBe(first[0].carcassRule);
    expect(second[1].frontLayoutRule).toBe(first[1].frontLayoutRule);
  });

  it("mantém módulos Kitchen sem profile no caminho legado", () => {
    expect(ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-base-1-door")).toBeUndefined();
    expect(ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-tower-oven")).toBeUndefined();
  });

  it("resolve Base e Upper pelo registry no caminho real e mantém occurrences isoladas", () => {
    const lookupSpy = vi.spyOn(profileRegistryModule.ConstructionProfileRegistry, "getByModuleDefinitionId");
    const baseId = usePlannerStore.getState().addFurnitureInstance(BASE_ID, { x: -500, y: 0, z: 0 }, { width: 800, height: 870, depth: 580 });
    const upperId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 500, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(baseId).toBeTruthy();
    expect(upperId).toBeTruthy();
    expect(lookupSpy).toHaveBeenCalledWith(BASE_ID);
    expect(lookupSpy).toHaveBeenCalledWith(UPPER_ID);
    const base = usePlannerStore.getState().instances.find((instance) => instance.id === baseId)!;
    const upper = usePlannerStore.getState().instances.find((instance) => instance.id === upperId)!;
    expect(base.moduleDefinitionId).toBe(BASE_ID);
    expect(upper.moduleDefinitionId).toBe(UPPER_ID);
    expect(base.parts.map((part) => part.id).filter((id) => upper.parts.some((part) => part.id === id))).toHaveLength(0);
    expect(base.parts.every((part) => part.moduleId === base.id)).toBe(true);
    expect(upper.parts.every((part) => part.moduleId === upper.id)).toBe(true);
  });

  it("persiste apenas a definição e resolve novamente o profile no reload", () => {
    const instanceId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    expect(instanceId).toBeTruthy();
    expect(usePlannerStore.getState().saveProject()).toBe(true);
    const rawSnapshot = storage.get(PROJECT_STORAGE_KEY) ?? "{}";
    const saved = JSON.parse(rawSnapshot);
    const serialized = JSON.stringify(saved);
    expect(serialized).toContain(UPPER_ID);
    expect(serialized).not.toContain("construction-profile-v1");
    usePlannerStore.getState().newProject();
    storage.set(PROJECT_STORAGE_KEY, rawSnapshot);
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    const restored = usePlannerStore.getState().instances.find((instance) => instance.id === instanceId);
    expect(restored?.moduleDefinitionId).toBe(UPPER_ID);
    expect(ConstructionProfileRegistry.getByModuleDefinitionId(restored!.moduleDefinitionId)?.carcassRule.sideRelation).toBe("full-height");
  });

  it("mantém o profile no AI/update rebuild sem expor IDs de profile na instância", () => {
    const instanceId = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
    const lookupSpy = vi.spyOn(profileRegistryModule.ConstructionProfileRegistry, "getByModuleDefinitionId");
    expect(usePlannerStore.getState().updateFurnitureInstance(instanceId!, { positionMm: { x: 120, y: 1500, z: 40 }, dimensionsMm: { width: 850, height: 700, depth: 350 } })).toBe(true);
    const updated = usePlannerStore.getState().instances.find((instance) => instance.id === instanceId)!;
    expect(updated.moduleDefinitionId).toBe(UPPER_ID);
    expect(JSON.stringify(updated)).not.toContain("construction-profile-v1");
    expect(lookupSpy).toHaveBeenCalledWith(UPPER_ID);
  });

  it("não usa legacy quando o profile Upper é removido temporariamente", () => {
    const original = ConstructionProfileRegistry.getByModuleDefinitionId(UPPER_ID)!;
    ConstructionProfileRegistry.removeForTest(UPPER_ID);
    try {
      const result = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
      expect(result).toBeNull();
    } finally {
      ConstructionProfileRegistry.register(original);
    }
  });

  it("falha quando o profile Upper seleciona uma CarcassRule inválida", () => {
    const original = ConstructionProfileRegistry.getByModuleDefinitionId(UPPER_ID)!;
    const invalid = cloneProfile(original, {
      carcassRule: { ...original.carcassRule, toeKickRelation: "separate-profile-supported-by-feet", toeKickInsetMm: 20 },
    });
    ConstructionProfileRegistry.removeForTest(UPPER_ID);
    ConstructionProfileRegistry.register(invalid);
    try {
      const result = usePlannerStore.getState().addFurnitureInstance(UPPER_ID, { x: 0, y: 1500, z: 0 }, { width: 800, height: 700, depth: 350 });
      expect(result).toBeNull();
    } finally {
      ConstructionProfileRegistry.removeForTest(UPPER_ID);
      ConstructionProfileRegistry.register(original);
    }
  });

  it("bloqueia dispatch hardcoded de regra no builder profissional", () => {
    const source = readFileSync(new URL("../../library/families/kitchen/builders.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/moduleDefinitionId\s*===\s*["']kitchen-(base-2-doors|golden-upper-800)["']/);
    expect(source).not.toMatch(/moduleId\s*===\s*["']kitchen-(base-2-doors|golden-upper-800)["']/);
    expect(source).toContain("ConstructionProfileRegistry.getByModuleDefinitionId");
  });
});
