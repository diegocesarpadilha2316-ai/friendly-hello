import "../../library/index";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PartDefinition } from "../../library/contracts/PartDefinition";
import { buildModule } from "../../library/services/buildModule";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity, isNestingPart } from "../../library/services/nestingPlan";

const request = {
  moduleId: "kitchen-golden-upper-800",
  instanceId: "step8-upper-baseline-instance-001",
  dimensionsMm: { width: 800, height: 700, depth: 350 },
  materialId: "mdf-freijo",
  hardwareOverrides: { handle: "handle-cava", hinge: "hinge-soft-close" },
  positionMm: { x: 120, y: 1500, z: -1600 },
  room: { widthMm: 6000, depthMm: 5000, heightMm: 3000 },
};

const serializePart = (part: any) => ({
  id: part.id,
  moduleId: part.moduleId,
  parentInstanceId: part.parentInstanceId,
  role: part.role,
  dimensionsMm: part.dimensionsMm,
  positionMm: part.positionMm,
  rotationDeg: part.rotationDeg,
  pivotMm: part.pivotMm,
  materialId: part.materialId,
  thicknessMm: part.thicknessMm,
  grainDirection: part.grainDirection,
  edgeBanding: part.edgeBanding,
  volumeType: part.volumeType,
  groupId: part.groupId,
  hardwareId: part.hardwareId,
  hardwareGeometry: part.hardwareGeometry,
  interactive: part.interactive,
});

describe("Step 8 — canonical upper baseline", () => {
  it("captures the real build output before controlled expansion", () => {
    const outcome = buildModule(request);
    expect(outcome.ok, outcome.error).toBe(true);
    expect(outcome.dimensionsMm).toEqual(request.dimensionsMm);
    expect(outcome.parts.length).toBeGreaterThan(0);
    expect(outcome.parts.filter((part) => part.role !== "hardware").length).toBeGreaterThan(0);
    expect(outcome.parts.filter((part) => part.role === "hardware").length).toBeGreaterThan(0);
    expect(outcome.validation?.valid).toBe(true);

    const hardwareParts = outcome.parts.filter((part) => part.role === "hardware");
    expect(hardwareParts).toHaveLength(22);
    const hardwareCounts = hardwareParts.reduce<Record<string, PartDefinition[]>>((groups, part) => {
      const key = part.hardwareId ?? "missing";
      (groups[key] ??= []).push(part);
      return groups;
    }, {});
    expect(hardwareCounts["shelf-support"]).toHaveLength(12);
    expect(hardwareCounts["hinge-soft-close"]).toHaveLength(4);
    expect(hardwareCounts["mounting-plate-37-32"]).toHaveLength(4);
    expect(hardwareCounts["handle-cava"]).toHaveLength(2);
    expect(Object.values(hardwareCounts).reduce((sum, parts) => sum + parts.length, 0)).toBe(22);

    for (const shelfId of ["shelf-1", "shelf-2", "shelf-3"]) {
      const supports = hardwareParts.filter((part) => part.groupId === shelfId && part.hardwareId === "shelf-support");
      expect(supports).toHaveLength(4);
      expect(new Set(supports.map((part) => part.id)).size).toBe(4);
      expect(supports.every((part) => part.moduleId === request.instanceId && part.parentInstanceId === request.instanceId)).toBe(true);
    }

    expect(outcome.parts.every((part) => part.moduleId === request.instanceId && part.parentInstanceId === request.instanceId)).toBe(true);

    const nestingPlan = buildNestingPlanFromPartDefinitions(outcome.parts);
    const nestingIntegrity = validateNestingIntegrity(outcome.parts, nestingPlan);
    expect(nestingIntegrity.missingInNesting).toEqual([]);
    expect(nestingIntegrity.duplicateInNesting).toEqual([]);
    expect(nestingIntegrity.unknownInNesting).toEqual([]);
    expect(nestingIntegrity.nestingPartIds.some((id) => outcome.parts.find((part) => part.id === id)?.role === "hardware")).toBe(false);
    expect(outcome.parts.filter(isNestingPart).every((part) => part.role !== "hardware")).toBe(true);

    const baseline = {
      request,
      ok: outcome.ok,
      dimensionsMm: outcome.dimensionsMm,
      hardwareIds: outcome.hardwareIds,
      warningCount: outcome.result?.warnings.length ?? 0,
      partCount: outcome.parts.length,
      physicalPartCount: outcome.parts.filter((part) => part.role !== "hardware").length,
      hardwarePartCount: outcome.parts.filter((part) => part.role === "hardware").length,
      parts: outcome.parts.map(serializePart),
    };
    mkdirSync("evidence/step8-validation", { recursive: true });
    writeFileSync("evidence/step8-validation/01-baseline.json", JSON.stringify(baseline, null, 2));

    expect(outcome.parts.map((part) => part.id)).toEqual(expect.arrayContaining([
      `${request.instanceId}:side-left`,
      `${request.instanceId}:side-right`,
      `${request.instanceId}:base`,
      `${request.instanceId}:top`,
      `${request.instanceId}:back`,
      `${request.instanceId}:shelf-1`,
      `${request.instanceId}:shelf-2`,
      `${request.instanceId}:shelf-3`,
      `${request.instanceId}:door-1`,
      `${request.instanceId}:door-2`,
    ]));
  });

  it("protege a semântica de contagem contra uma projeção parcial de hardware", () => {
    const outcome = buildModule(request);
    const hardwareParts = outcome.parts.filter((part) => part.role === "hardware");
    const partialProjection = hardwareParts.filter((part) => part.hardwareId === "hinge-soft-close" || part.hardwareId?.startsWith("handle-"));
    expect(partialProjection).toHaveLength(6);
    expect(partialProjection).not.toHaveLength(22);
  });
});
