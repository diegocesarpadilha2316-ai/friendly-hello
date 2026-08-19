import { beforeEach, describe, expect, it } from "vitest";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE } from "../../library/families/kitchen/frontLayoutRules";
import { GOLDEN_71B3550_173H7100_RULE } from "../../library/families/kitchen/applicationRules";
import { resolveFrontLayout } from "../../library/services/frontLayoutResolver";
import {
  resolveDoorHardwarePlacement,
  validateDoorHardwarePlacementParts,
} from "../../library/services/hardwarePlacementResolver";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { resolveGoldenHardwareApplication } from "../../library/services/hardwareApplicationResolver";
import { usePlannerStore } from "./usePlannerStore";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function goldenLayout(width = 900, height = 870) {
  return resolveFrontLayout(
    {
      moduleDefinitionId: "kitchen-base-2-doors",
      cabinetWidthMm: width,
      cabinetHeightMm: height,
      cabinetDepthMm: 580,
      frontBottomMm: 150,
      frontTopMm: height,
      frontZMm: 299,
    },
    GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
  );
}

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

describe("Golden Hardware Placement — Etapa 6.1", () => {
  beforeEach(setup);

  it("resolve hinge e mounting plate pelo FrontLayout + ApplicationRule, sem hardcodear 263/757", () => {
    const layout = goldenLayout();
    const left = resolveDoorHardwarePlacement({
      frontLayout: layout,
      applicationRule: GOLDEN_71B3550_173H7100_RULE,
      doorIndex: 0,
      doorPartId: "golden:door-1",
      toeKickMm: 150,
      cabinetDepthMm: 580,
      doorThicknessMm: 18,
      targetSidePartId: "golden:side-left",
    });
    const right = resolveDoorHardwarePlacement({
      frontLayout: layout,
      applicationRule: GOLDEN_71B3550_173H7100_RULE,
      doorIndex: 1,
      doorPartId: "golden:door-2",
      toeKickMm: 150,
      cabinetDepthMm: 580,
      doorThicknessMm: 18,
      targetSidePartId: "golden:side-right",
    });

    expect(layout.validationStatus).toBe("READY");
    expect(left.hingeCount).toBe(2);
    expect(right.hingeCount).toBe(2);
    expect(left.hingePositionsMm).toEqual([{ x: -413, y: 263 }, { x: -413, y: 757 }]);
    expect(right.hingePositionsMm).toEqual([{ x: 413, y: 263 }, { x: 413, y: 757 }]);
    expect(left.mountingPlatePositionsMm).toEqual(left.hingePositionsMm);
    expect(right.mountingPlatePositionsMm).toEqual(right.hingePositionsMm);
    expect(left.verticalOffsetsMm).toEqual([110, 604]);
    expect(left.doorBottomMm).toBe(153);
  });

  it("separa DOOR-LOCAL, MODULE-LOCAL e PART-LOCAL sem ambiguidade", () => {
    const layout = goldenLayout();
    const placement = resolveDoorHardwarePlacement({
      frontLayout: layout,
      applicationRule: GOLDEN_71B3550_173H7100_RULE,
      doorIndex: 0,
      doorPartId: "golden:door-1",
      toeKickMm: 150,
      cabinetDepthMm: 580,
      doorThicknessMm: 18,
    });
    const targetPart = { x: 441, y: 510, z: 0 };
    const modulePoint = placement.hingePositionsMm[0];
    const partLocal = {
      x: modulePoint.x - targetPart.x,
      y: modulePoint.y - targetPart.y,
    };
    expect(placement.doorBottomMm).toBe(153);
    expect(placement.verticalOffsetsMm).toEqual([110, 604]);
    expect(modulePoint).toEqual({ x: -413, y: 263 });
    expect(partLocal).toEqual({ x: -854, y: -247 });
    expect(modulePoint.y).not.toBe(placement.verticalOffsetsMm[0]);
  });

  it("detecta divergência visual com tolerância explícita", () => {
    const layout = goldenLayout();
    const placement = resolveDoorHardwarePlacement({
      frontLayout: layout,
      applicationRule: GOLDEN_71B3550_173H7100_RULE,
      doorIndex: 0,
      doorPartId: "golden:door-1",
      toeKickMm: 150,
      cabinetDepthMm: 580,
      doorThicknessMm: 18,
    });
    const parts = [...placement.hingePartIds.map((id, index) => ({
      id,
      moduleId: "golden",
      role: "hardware" as const,
      name: "Dobradiça",
      dimensionsMm: { width: 35, height: 72, depth: 18 },
      positionMm: { ...placement.hingePositionsMm[index], z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId: "hardware-metal",
    })), ...placement.mountingPlatePartIds.map((id, index) => ({
      id,
      moduleId: "golden",
      role: "hardware" as const,
      name: "Placa",
      dimensionsMm: { width: 37, height: 8.5, depth: 32 },
      positionMm: { ...placement.mountingPlatePositionsMm[index], z: 0 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialId: "hardware-metal",
    }))];
    expect(validateDoorHardwarePlacementParts(placement, parts).valid).toBe(true);
    const shifted = parts.map((part, index) => index === 0
      ? { ...part, positionMm: { ...part.positionMm, y: part.positionMm.y + 0.01 } }
      : part);
    const consistency = validateDoorHardwarePlacementParts(placement, shifted);
    expect(consistency.valid).toBe(false);
    expect(consistency.issues).toEqual([expect.objectContaining({ axis: "y", expectedMm: 263, actualMm: 263.01 })]);
  });

  it("usa a mesma resolução no builder, PartDefinitions, Joinery e Machining", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    expect(store.updateFurnitureInstance(id!, {
      materialOverrides: { body: "mdf-white", front: "mdf-freijo", door: "mdf-freijo" },
      hardwareOverrides: { hinge: "hinge-soft-close", mountingPlate: "mounting-plate-37-32", handle: "handle-gola" },
      hardwareVariantIds: { hinge: "blum-71b3550-standard-110", mountingPlate: "blum-173h7100-37-32" },
    })).toBe(true);
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const resolved = resolveGoldenHardwareApplication(instance)!;
    const joinery = buildJoineryReport([instance]);
    const machining = buildMachiningReport([instance], joinery.operations);
    expect(resolved.assemblyStatus).toBe("READY");
    expect(resolved.derivedValues.verticalHingeOffsetsMm).toEqual([[110, 604], [110, 604]]);
    expect(resolved.derivedValues.verticalHingePositionsMm).toEqual([[263, 757], [263, 757]]);
    expect(resolved.doorInstallations.map((installation) => installation.verticalOffsetsMm)).toEqual([[110, 604], [110, 604]]);
    expect(resolved.doorInstallations.map((installation) => installation.hingePositionsMm)).toEqual([[263, 757], [263, 757]]);
    for (const installation of resolved.doorInstallations) {
      for (const partId of [...installation.hingePartIds, ...installation.mountingPlatePartIds]) {
        const part = instance.parts.find((candidate) => candidate.id === partId);
        expect(part).toBeDefined();
        expect([263, 757]).toContain(part!.positionMm.y);
      }
    }
    const hingeJoinery = joinery.operations.filter((operation) => operation.kind === "hinge-cup" || operation.kind === "mounting-plate-placement");
    expect(hingeJoinery.length).toBe(8);
    expect(hingeJoinery.every((operation) => [263, 757].includes(operation.positionMm!.y))).toBe(true);
    const hingeMachining = machining.operations.filter((operation) => operation.hardwareId === "hinge-soft-close" || operation.hardwareId === "mounting-plate-37-32");
    expect(hingeMachining.length).toBe(4);
    const localMismatches = hingeMachining.filter((operation) => {
      const source = joinery.operations.find((candidate) => candidate.id === operation.sourceJoineryId);
      const target = instance.parts.find((part) => part.id === operation.partId);
      return source === undefined || target === undefined
        || operation.coordinates!.positionMm.x !== source.positionMm!.x - target.positionMm!.x
        || operation.coordinates!.positionMm.y !== source.positionMm!.y - target.positionMm!.y;
    }).map((operation) => ({
      id: operation.id,
      sourceJoineryId: operation.sourceJoineryId,
      partId: operation.partId,
      operation: operation.coordinates!.positionMm,
      source: joinery.operations.find((candidate) => candidate.id === operation.sourceJoineryId)?.positionMm,
      target: instance.parts.find((part) => part.id === operation.partId)?.positionMm,
    }));
    expect(localMismatches).toEqual([]);
  });

  it("usa o threshold central para promover 2 para 3 dobradiças", () => {
    const layout = goldenLayout(900, 1056);
    expect(layout.doorHeightMm).toBe(900);
    const placement = resolveDoorHardwarePlacement({
      frontLayout: layout,
      applicationRule: GOLDEN_71B3550_173H7100_RULE,
      doorIndex: 0,
      doorPartId: "golden:door-1",
      toeKickMm: 150,
      cabinetDepthMm: 580,
      doorThicknessMm: 18,
    });
    expect(placement.hingeCount).toBe(3);
    expect(placement.verticalOffsetsMm).toEqual([110, 450, 790]);
    expect(placement.hingePositionsMm.map((point) => point.y)).toEqual([263, 603, 943]);
    expect(placement.doorBottomMm).toBe(153);
  });

  it("preserva hardware PartDefinitions no ciclo 900→1000→900", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    const before = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const beforeHardware = before.parts
      .filter((part) => part.role === "hardware" && (part.hardwareId === "hinge-soft-close" || part.hardwareId === "mounting-plate-37-32"))
      .map((part) => ({ id: part.id, x: part.positionMm.x, y: part.positionMm.y }));
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 1000, height: 870, depth: 580 } })).toBe(true);
    expect(store.updateFurnitureInstance(id!, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    const restored = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const restoredHardware = restored.parts
      .filter((part) => part.role === "hardware" && (part.hardwareId === "hinge-soft-close" || part.hardwareId === "mounting-plate-37-32"))
      .map((part) => ({ id: part.id, x: part.positionMm.x, y: part.positionMm.y }));
    expect(restoredHardware).toEqual(beforeHardware);
  });

  it("mantém placement coerente nas larguras 600/800/900/1000/1200", () => {
    for (const width of [600, 800, 900, 1000, 1200]) {
      const layout = goldenLayout(width);
      const placement = resolveDoorHardwarePlacement({
        frontLayout: layout,
        applicationRule: GOLDEN_71B3550_173H7100_RULE,
        doorIndex: 0,
        doorPartId: `golden-${width}:door-1`,
        toeKickMm: 150,
        cabinetDepthMm: 580,
        doorThicknessMm: 18,
      });
      expect(placement.status).toBe("READY");
      expect(placement.hingePositionsMm[0].x).toBe(layout.doorEdgesMm[0].left + 35);
      expect(placement.hingePositionsMm.map((point) => point.y)).toEqual([263, 757]);
      expect(placement.mountingPlatePositionsMm).toEqual(placement.hingePositionsMm);
    }
  });
});
