import { beforeEach, describe, expect, it } from "vitest";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../../library/services/nestingPlan";
import { serializeModule } from "../../library/services/serializeModule";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
import { resolveGoldenHardwareApplication } from "../../library/services/hardwareApplicationResolver";
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

function createGolden(variants: "verified" | "generic" | "invalid" = "verified") {
  const store = usePlannerStore.getState();
  const id = store.addFurnitureInstance(
    "kitchen-base-2-doors",
    { x: 0, y: 0, z: 0 },
    { width: 900, height: 870, depth: 580 },
  );
  expect(id).toBeTruthy();
  const hardwareVariantIds = variants === "verified"
    ? { hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" }
    : variants === "invalid"
      ? { hinge: "blum-71b3550-standard-110", mountingPlate: "missing-plate-variant" }
      : undefined;
  expect(store.updateFurnitureInstance(id!, {
    materialOverrides: { body: "mdf-white", front: "mdf-freijo", door: "mdf-freijo" },
    hardwareOverrides: { hinge: "hinge-soft-close", mountingPlate: "mounting-plate-37-32", handle: "handle-gola" },
    hardwareVariantIds,
  })).toBe(true);
  const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
  if (!instance) throw new Error("Golden ausente");
  return { id: id!, instance };
}

describe("Golden Assembly/Application Rule — Etapa 5", () => {
  beforeEach(setup);

  it("isola ManufacturerSpec, ApplicationRule e Derived Installation", () => {
    const { instance } = createGolden("verified");
    const hinge = HardwareRegistry.getManufacturingVariant("hinge-soft-close", "blum-71b3550-standard-110");
    const plate = HardwareRegistry.getManufacturingVariant("mounting-plate-37-32", "blum-173h7100-37-32");
    expect(hinge).toBeDefined();
    expect(plate).toBeDefined();
    expect("applicationRule" in (hinge?.manufacturingSpec ?? {})).toBe(false);
    expect(hinge?.manufacturingSpec.kind).toBe("hinge");
    if (!plate || plate.manufacturingSpec.kind !== "mounting-plate") throw new Error("Placa Blum ausente");
    expect(plate.manufacturingSpec.holeSpacingMm).toBe(32);
    expect(plate.manufacturingSpec.plateSystemDistanceMm).toBe(0);
    expect("mountingPlateSpacingMm" in plate.manufacturingSpec).toBe(false);

    const resolved = resolveGoldenHardwareApplication(instance);
    expect(resolved?.ruleId).toBe("kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100");
    expect(resolved?.compatibilityStatus).toBe("READY");
    expect(resolved?.assemblyStatus).toBe("READY");
    expect(resolved?.applicationStatus).toBe("INCOMPLETE");
    expect(resolved?.machiningStatus).toBe("INCOMPLETE");
    expect(resolved?.applicationRuleProvenance.sourceType).toBe("family-rule");
    expect(resolved?.manufacturerProvenance?.manufacturer).toBe("Blum");
  });

  it("resolve a matemática atual do balcão 900×870×580 sem alterar o builder", () => {
    const { instance } = createGolden("verified");
    const resolved = resolveGoldenHardwareApplication(instance);
    expect(resolved?.parameters.cabinetWidthMm).toBe(900);
    expect(resolved?.parameters.cabinetSideThicknessMm).toBe(18);
    expect(resolved?.parameters.doorThicknessMm).toBe(18);
    expect(resolved?.parameters.doorGapMm).toBe(2);
    expect(resolved?.parameters.centralGapMm).toBe(2);
    expect(resolved?.parameters.outerGapsMm).toEqual({ left: 2, right: 2 });
    expect(resolved?.parameters.revealMm).toBe(2);
    expect(resolved?.parameters.overlayMm).toBe(16);
    expect(resolved?.derivedValues.doorWidthMm).toEqual([447, 447]);
    expect(resolved?.derivedValues.hingeCountByDoor).toEqual([2, 2]);
    expect(resolved?.derivedValues.verticalHingeOffsetsMm).toEqual([[110, 604], [110, 604]]);
    expect(resolved?.derivedValues.verticalHingePositionsMm).toEqual([[263, 757], [263, 757]]);
    expect(resolved?.doorInstallations.map((item) => item.hingeSide)).toEqual(["left", "right"]);
    expect(resolved?.doorInstallations[0].targetSidePartId).toContain("side-left");
    expect(resolved?.doorInstallations[1].targetSidePartId).toContain("side-right");
  });

  it("preserva IDs e mostra exatamente o que muda em 900→1000→900", () => {
    const store = usePlannerStore.getState();
    const { id, instance } = createGolden("verified");
    const first = resolveGoldenHardwareApplication(instance);
    const ruleId = first?.ruleId;
    const doorIds = first?.doorInstallations.map((item) => item.doorPartId);
    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 1000, height: 870, depth: 580 } })).toBe(true);
    const at1000 = usePlannerStore.getState().instances.find((item) => item.id === id);
    if (!at1000) throw new Error("Golden 1000 ausente");
    const second = resolveGoldenHardwareApplication(at1000);
    expect(second?.ruleId).toBe(ruleId);
    expect(second?.doorInstallations.map((item) => item.doorPartId)).toEqual(doorIds);
    expect(second?.parameters.cabinetWidthMm).toBe(1000);
    expect(second?.derivedValues.doorWidthMm).toEqual([497, 497]);
    expect(second?.parameters.doorGapMm).toBe(2);
    expect(second?.parameters.outerGapsMm).toEqual({ left: 2, right: 2 });
    expect(second?.derivedValues.hingeCountByDoor).toEqual([2, 2]);

    expect(store.updateFurnitureInstance(id, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const restored = usePlannerStore.getState().instances.find((item) => item.id === id);
    if (!restored) throw new Error("Golden restaurado ausente");
    const third = resolveGoldenHardwareApplication(restored);
    expect(third?.parameters).toEqual(first?.parameters);
    expect(third?.derivedValues).toEqual(first?.derivedValues);
    expect(third?.doorInstallations).toEqual(first?.doorInstallations);
  });

  it("espelha hinge side, mantém IDs locais ao mover/rotacionar e persiste só seleções", () => {
    const store = usePlannerStore.getState();
    const { id, instance } = createGolden("verified");
    const before = resolveGoldenHardwareApplication(instance);
    const beforeJoinery = buildJoineryReport([instance]);
    const beforeMachining = buildMachiningReport([instance], beforeJoinery.operations);
    expect(beforeJoinery.operations.filter((operation) => operation.parameters?.applicationRuleId).length).toBeGreaterThan(0);
    expect(beforeMachining.operations.filter((operation) => operation.parameters?.applicationRuleId).length).toBeGreaterThan(0);
    expect(store.updateFurnitureInstance(id, { positionMm: { x: 700, y: 0, z: -500 }, rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const moved = usePlannerStore.getState().instances.find((item) => item.id === id);
    if (!moved) throw new Error("Golden movido ausente");
    const after = resolveGoldenHardwareApplication(moved);
    expect(after?.id).toBe(before?.id);
    expect(after?.doorInstallations.map((item) => item.doorPartId)).toEqual(before?.doorInstallations.map((item) => item.doorPartId));
    expect(after?.doorInstallations.map((item) => item.targetSidePartId?.split(":").at(-1))).toEqual(["side-left", "side-right"]);

    const serialized = serializeModule(moved);
    expect(serialized.hardwareVariantIds).toEqual({ hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" });
    expect(JSON.stringify(serialized)).not.toContain("ResolvedHardwareApplication");
    expect(JSON.stringify(serialized)).not.toContain("applicationRuleProvenance");
  });

  it("rejeita combinação incompatível, mantém genérico incompleto e preserva BOM/cut-list/nesting", () => {
    const invalid = createGolden("invalid");
    const invalidResolved = resolveGoldenHardwareApplication(invalid.instance);
    expect(invalidResolved?.compatibilityStatus).toBe("INVALID");
    expect(invalidResolved?.assemblyStatus).toBe("INVALID");

    usePlannerStore.getState().removeFurnitureInstance(invalid.id);
    const generic = createGolden("generic");
    const genericResolved = resolveGoldenHardwareApplication(generic.instance);
    expect(genericResolved?.compatibilityStatus).toBe("INCOMPLETE");
    expect(genericResolved?.assemblyStatus).toBe("INCOMPLETE");

    usePlannerStore.getState().removeFurnitureInstance(generic.id);
    const verified = createGolden("verified");
    const joinery = buildJoineryReport([verified.instance]);
    const machining = buildMachiningReport([verified.instance], joinery.operations);
    const fabrication = buildFabricationReport([verified.instance]);
    const nesting = buildNestingPlanFromPartDefinitions(verified.instance.parts);
    const nestingIntegrity = validateNestingIntegrity(verified.instance.parts, nesting);
    expect(machining.system32).toBe("NOT_REQUIRED");
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "hinge-soft-close")?.quantity).toBe(4);
    expect(fabrication.hardwareItems.find((item) => item.hardwareId === "mounting-plate-37-32")?.quantity).toBe(4);
    expect(fabrication.cutItems.every((item) => item.role !== "hardware")).toBe(true);
    expect(fabrication.cutItems.filter((item) => item.role === "door").some((item) => item.widthMm === 447 && item.quantity === 2)).toBe(true);
    expect(nestingIntegrity.missingInNesting).toEqual([]);
    expect(nestingIntegrity.duplicateInNesting).toEqual([]);
    expect(nestingIntegrity.unknownInNesting).toEqual([]);
    expect(nesting.boards.length + nesting.unplaced.length).toBeGreaterThan(0);
  });
});
