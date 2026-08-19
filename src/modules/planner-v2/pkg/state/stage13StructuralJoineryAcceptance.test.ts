import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildMachiningReport } from "../../library/services/machiningReport";
import { ConstructionProfileRegistry } from "../../library/registry/ConstructionProfileRegistry";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
import { buildNestingPlanFromPartDefinitions } from "../../library/services/nestingPlan";
import { resolveCarcassConstruction } from "../../library/services/carcassConstructionResolver";
import { resolveStructuralJoinery } from "../../library/services/structuralJoineryResolver";
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

function instance(id: string) {
  const value = usePlannerStore.getState().instances.find((item) => item.id === id);
  if (!value) throw new Error(`Instância ausente: ${id}`);
  return value;
}

function snapshot(id: string) {
  const current = instance(id);
  const joinery = buildJoineryReport([current]);
  const machining = buildMachiningReport([current], joinery.operations);
  const fabrication = buildFabricationReport([current], joinery.structuralJoinery);
  const nesting = buildNestingPlanFromPartDefinitions(current.parts);
  return { current, joinery, machining, fabrication, nesting };
}

function create(moduleDefinitionId: string, dimensions = { width: 800, height: 870, depth: 580 }, x = 0) {
  const id = usePlannerStore.getState().addFurnitureInstance(moduleDefinitionId, { x, y: 0, z: 0 }, dimensions);
  if (!id) throw new Error(`Não criou ${moduleDefinitionId} ${JSON.stringify(dimensions)}`);
  return id;
}

describe("Stage 13 — Verified Structural Carcass Joinery", () => {
  beforeEach(setup);

  it("rejects a ConstructionProfile whose structural rule belongs to another module", () => {
    const upper = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-golden-upper-800");
    const baseRule = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-base-2-doors")?.structuralJoineryRule;
    expect(baseRule).toBeDefined();
    expect(() => ConstructionProfileRegistry.register({
      id: "mutation-upper-with-base-rule",
      moduleDefinitionId: "mutation-upper-with-base-rule",
      carcassRule: upper!.carcassRule,
      structuralJoineryRule: baseRule,
    })).toThrow(/não pertence/);
  });

  it("registers one manufacturer variant and keeps ApplicationRule separate from ManufacturerSpec", () => {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-base-2-doors");
    const variant = HardwareRegistry.getManufacturingVariant("structural-minifix-15", "hafele-minifix15-p00861332");
    expect(profile?.structuralJoineryRule?.moduleDefinitionId).toBe("kitchen-base-2-doors");
    expect(profile?.structuralJoineryRule?.moduleDefinitionId).not.toBe("kitchen-drawer-3");
    expect(variant?.manufacturingSpec.kind).toBe("structural-connector");
    expect(variant?.manufacturingSpec.provenance.sourceType).toBe("manufacturer-documentation");
    expect(profile?.structuralJoineryRule).not.toBe(variant?.manufacturingSpec);
  });

  it("resolves Base structural relations with deterministic IDs, contact faces and separated statuses", () => {
    const id = create("kitchen-base-2-doors");
    const report = snapshot(id);
    expect(report.joinery.structuralJoinery).toHaveLength(1);
    const resolution = report.joinery.structuralJoinery[0];
    expect(resolution.joints).toHaveLength(8);
    expect(new Set(resolution.joints.map((joint) => joint.id)).size).toBe(8);
    expect(new Set(resolution.joints.map((joint) => joint.relationId))).toEqual(new Set([
      "side-left-to-base", "side-right-to-base", "side-left-to-top", "side-right-to-top",
    ]));
    expect(resolution.joints.every((joint) => joint.assemblyStatus === "READY")).toBe(true);
    expect(resolution.joints.every((joint) => joint.machiningStatus === "INCOMPLETE")).toBe(true);
    expect(resolution.joints.every((joint) => joint.hostPartId.startsWith(`${id}:`))).toBe(true);
    expect(resolution.joints.every((joint) => joint.targetPartId.startsWith(`${id}:`))).toBe(true);
    expect(resolution.joints.every((joint) => ["T", "B"].includes(joint.hostFace))).toBe(true);
    expect(resolution.joints.every((joint) => ["L", "R"].includes(joint.targetFace))).toBe(true);

    const housing = report.joinery.operations.filter((operation) => operation.kind === "minifix-head");
    const bolt = report.joinery.operations.filter((operation) => operation.kind === "minifix-body");
    expect(housing).toHaveLength(8);
    expect(bolt).toHaveLength(8);
    expect(housing.every((operation) => operation.truthStatus === "READY" && operation.source === "MANUFACTURER_SPEC" && operation.diameterMm === 15 && operation.depthMm === 12.5)).toBe(true);
    expect(bolt.every((operation) => operation.truthStatus === "INCOMPLETE" && operation.source === "MANUFACTURER_SPEC" && operation.provenance?.url?.includes("hafele.com") && operation.diameterMm === undefined && operation.depthMm === undefined && operation.parameters?.targetBoltHoleDiameterMm === null && (operation.unknownParameters?.length ?? 0) > 0)).toBe(true);
    expect(report.joinery.operations.some((operation) => operation.kind === "confirmat" || operation.kind === "dowel")).toBe(false);

    const structuralMachining = report.machining.operations.filter((operation) => operation.hardwareId === "structural-minifix-15");
    expect(structuralMachining).toHaveLength(16);
    expect(structuralMachining.filter((operation) => operation.readiness === "READY")).toHaveLength(8);
    expect(structuralMachining.filter((operation) => operation.readiness === "INCOMPLETE")).toHaveLength(8);
    expect(structuralMachining.every((operation) => operation.coordinates?.coordinateSpace === "part-local")).toBe(true);
    expect(structuralMachining.filter((operation) => operation.readiness === "INCOMPLETE").every((operation) => (operation.missingParameters.length > 0) && operation.diameterMm !== 0 && operation.depthMm !== 0)).toBe(true);
    expect(report.fabrication.cutItems.every((item) => item.role !== "hardware")).toBe(true);
    expect(report.fabrication.hardwareItems.find((item) => item.hardwareId === "structural-minifix-15")?.jointIds).toHaveLength(8);
  });

  it("keeps back, shelf and toe-kick outside the structural connector pilot", () => {
    const id = create("kitchen-base-2-doors");
    const report = snapshot(id);
    const relations = report.joinery.structuralJoinery[0].joints;
    expect(relations.some((joint) => joint.targetPartId.endsWith(":back") || joint.hostPartId.endsWith(":back"))).toBe(false);
    expect(relations.some((joint) => joint.targetPartId.includes(":shelf") || joint.hostPartId.includes(":shelf"))).toBe(false);
    expect(relations.some((joint) => joint.targetPartId.endsWith(":toe-kick") || joint.hostPartId.endsWith(":toe-kick"))).toBe(false);
    expect(report.joinery.readiness.find((item) => item.scope === "carcass-structural")?.status).toBe("READY");
    expect(report.joinery.readiness.find((item) => item.scope === "back-attachment")?.status).toBe("INCOMPLETE");
    expect(report.joinery.readiness.find((item) => item.scope === "back-attachment")?.missingParameters).toContain("backAttachmentRule");
    expect(report.joinery.readiness.find((item) => item.scope === "shelf-attachment")?.status).toBe("INCOMPLETE");
    expect(report.joinery.readiness.find((item) => item.scope === "toe-kick-structural-boundary")?.status).toBe("NOT_REQUIRED");
  });

  it("reuses the ManufacturerSpec but owns a distinct Drawer ApplicationRule and does not touch drawer internals", () => {
    const baseProfile = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-base-2-doors");
    const drawerProfile = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-drawer-3");
    const id = create("kitchen-drawer-3");
    const report = snapshot(id);
    expect(drawerProfile?.structuralJoineryRule?.moduleDefinitionId).toBe("kitchen-drawer-3");
    expect(drawerProfile?.structuralJoineryRule?.id).not.toBe(baseProfile?.structuralJoineryRule?.id);
    expect(drawerProfile?.structuralJoineryRule?.connectorHardwareId).toBe(baseProfile?.structuralJoineryRule?.connectorHardwareId);
    expect(report.joinery.structuralJoinery[0].joints).toHaveLength(8);
    expect(report.joinery.structuralJoinery[0].joints.every((joint) => !joint.hostPartId.includes("drawer-box") && !joint.targetPartId.includes("drawer-box"))).toBe(true);
    expect(report.joinery.operations.filter((operation) => operation.kind === "runner-installation").length).toBeGreaterThan(0);
    expect(report.joinery.operations.filter((operation) => operation.kind === "minifix-head" || operation.kind === "minifix-body").every((operation) => operation.relatedPartIds?.every((partId) => !partId.includes("drawer-box")))).toBe(true);
  });

  it("keeps Upper honest when no structural rule is approved", () => {
    const id = create("kitchen-golden-upper-800", { width: 800, height: 700, depth: 350 });
    const report = snapshot(id);
    expect(ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-golden-upper-800")?.structuralJoineryRule).toBeUndefined();
    expect(report.joinery.structuralJoinery).toHaveLength(0);
    expect(report.joinery.operations.filter((operation) => operation.kind === "minifix-head" || operation.kind === "minifix-body")).toHaveLength(0);
    expect(report.joinery.readiness.find((item) => item.scope === "carcass-structural")?.status).toBe("INCOMPLETE");
    expect(report.joinery.readiness.find((item) => item.scope === "carcass-structural")?.missingParameters).toContain("structuralJoineryRule");
  });

  it("passes the pure height matrix and rejects invalid thickness without changing panels", () => {
    const profile = ConstructionProfileRegistry.getByModuleDefinitionId("kitchen-base-2-doors")!;
    const variant = HardwareRegistry.getManufacturingVariant("structural-minifix-15", "hafele-minifix15-p00861332")!;
    if (variant.manufacturingSpec.kind !== "structural-connector") throw new Error("Structural connector ManufacturerSpec ausente");
    const heights = [700, 870, 1000];
    for (const height of heights) {
      const carcass = resolveCarcassConstruction({
        moduleDefinitionId: "kitchen-base-2-doors",
        dimensionsMm: { width: 800, height, depth: 580 },
        thicknessMm: { panelMm: 18, doorMm: 18, shelfMm: 18, backMm: 6 },
        toeKickMm: 150,
        shelves: 0,
        rule: profile.carcassRule,
      });
      const resolution = resolveStructuralJoinery({
        instanceId: `height-${height}`,
        moduleDefinitionId: "kitchen-base-2-doors",
        resolvedCarcass: carcass,
        rule: profile.structuralJoineryRule!,
        connectorSpec: variant.manufacturingSpec,
        parts: carcass.panels,
      });
      expect(resolution.joints).toHaveLength(8);
      expect(resolution.joints.map((joint) => joint.relationId)).toEqual(expect.arrayContaining(["side-left-to-base", "side-right-to-top"]));
    }
    const thinCarcass = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-base-2-doors",
      dimensionsMm: { width: 800, height: 870, depth: 580 },
      thicknessMm: { panelMm: 12, doorMm: 18, shelfMm: 12, backMm: 6 },
      toeKickMm: 150,
      shelves: 0,
      rule: profile.carcassRule,
    });
    const invalid = resolveStructuralJoinery({
      instanceId: "thin-base",
      moduleDefinitionId: "kitchen-base-2-doors",
      resolvedCarcass: thinCarcass,
      rule: profile.structuralJoineryRule!,
      connectorSpec: variant.manufacturingSpec,
      parts: thinCarcass.panels,
    });
    expect(invalid.status).toBe("INVALID");
    expect(invalid.joints).toHaveLength(0);
  });

  it("passes width/depth/height matrices and rejects a depth policy collision", () => {
    for (const width of [800, 900, 1000]) {
      setup();
      const report = snapshot(create("kitchen-base-2-doors", { width, height: 870, depth: 580 }));
      expect(report.joinery.structuralJoinery[0].joints).toHaveLength(8);
      expect(report.fabrication.hardwareItems.find((item) => item.hardwareId === "structural-minifix-15")?.quantity).toBe(8);
    }
    for (const depth of [450, 500, 550, 580, 600]) {
      setup();
      const report = snapshot(create("kitchen-base-2-doors", { width: 800, height: 870, depth }));
      const joints = report.joinery.structuralJoinery[0].joints;
      expect(joints).toHaveLength(8);
      expect(new Set(joints.map((joint) => joint.positionMm.z)).size).toBe(2);
    }
  });

  it("preserves A→B→A, depth cycle, move/rotation, BOM, cut-list and nesting", () => {
    const id = create("kitchen-base-2-doors", { width: 800, height: 870, depth: 580 });
    const before = snapshot(id);
    const beforeIds = before.joinery.structuralJoinery[0].joints.map((joint) => joint.id);
    expect(usePlannerStore.getState().updateFurnitureInstance(id, { dimensionsMm: { width: 900, height: 870, depth: 580 } })).toBe(true);
    expect(usePlannerStore.getState().updateFurnitureInstance(id, { dimensionsMm: { width: 900, height: 870, depth: 500 } })).toBe(true);
    expect(usePlannerStore.getState().updateFurnitureInstance(id, { dimensionsMm: { width: 800, height: 870, depth: 580 } })).toBe(true);
    const restored = snapshot(id);
    expect(restored.joinery.structuralJoinery[0].joints.map((joint) => joint.id)).toEqual(beforeIds);
    expect(restored.joinery.structuralJoinery[0].joints.map((joint) => joint.relationId)).toEqual(before.joinery.structuralJoinery[0].joints.map((joint) => joint.relationId));
    expect(restored.fabrication.hardwareItems).toEqual(before.fabrication.hardwareItems);
    expect(restored.fabrication.cutItems).toEqual(before.fabrication.cutItems);
    expect(restored.nesting.boards).toEqual(before.nesting.boards);
    expect(restored.nesting.unplaced).toEqual(before.nesting.unplaced);
    expect(usePlannerStore.getState().updateFurnitureInstance(id, { positionMm: { x: 800, y: 0, z: -600 } })).toBe(true);
    expect(usePlannerStore.getState().updateFurnitureInstance(id, { rotationDeg: { x: 0, y: 90, z: 0 } })).toBe(true);
    const transformed = snapshot(id);
    expect(transformed.joinery.structuralJoinery[0].joints.map((joint) => joint.id)).toEqual(beforeIds);
    expect(transformed.machining.operations.map((operation) => operation.coordinates)).toEqual(before.machining.operations.map((operation) => operation.coordinates));
    expect(transformed.fabrication.cutItems).toEqual(before.fabrication.cutItems);
  });

  it("isolates multiple instances, persists references and rejects generic resolver coupling", () => {
    const ids = [
      create("kitchen-base-2-doors", { width: 800, height: 870, depth: 580 }, -1350),
      create("kitchen-base-2-doors", { width: 800, height: 870, depth: 580 }, -450),
      create("kitchen-drawer-3", { width: 800, height: 870, depth: 580 }, 450),
      create("kitchen-golden-upper-800", { width: 800, height: 700, depth: 350 }, 1350),
    ];
    const all = usePlannerStore.getState().instances;
    const reports = all.map((item) => snapshot(item.id));
    const jointIds = reports.flatMap((report) => report.joinery.structuralJoinery.flatMap((resolution) => resolution.joints.map((joint) => joint.id)));
    expect(new Set(jointIds).size).toBe(jointIds.length);
    expect(ids.every((id) => reports.find((report) => report.current.id === id))).toBe(true);
    expect(reports.find((report) => report.current.moduleDefinitionId === "kitchen-golden-upper-800")?.joinery.structuralJoinery).toHaveLength(0);
    expect(usePlannerStore.getState().saveProject()).toBe(true);
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    const afterReload = usePlannerStore.getState().instances.map((item) => snapshot(item.id));
    expect(afterReload.map((report) => report.fabrication.hardwareItems)).toEqual(reports.map((report) => report.fabrication.hardwareItems));

    const resolverSource = readFileSync(new URL("../../library/services/structuralJoineryResolver.ts", import.meta.url), "utf8");
    expect(resolverSource).not.toContain("moduleDefinitionId === \"kitchen-base-2-doors\"");
    expect(resolverSource).not.toContain("legacyBuildJoineryOperations");
  });
});
