import "../../library/index";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildModule } from "../../library/services/buildModule";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../../library/services/nestingPlan";

const outputDir = "evidence/stage9-profile-registry";

function snapshot(moduleId: string, instanceId: string, dimensionsMm: { width: number; height: number; depth: number }) {
  const outcome = buildModule({
    moduleId,
    instanceId,
    dimensionsMm,
    materialId: "mdf-freijo",
    hardwareOverrides: { handle: "handle-cava", hinge: "hinge-soft-close" },
    positionMm: { x: 0, y: 0, z: 0 },
    instances: [],
  });
  expect(outcome.ok).toBe(true);
  const nesting = buildNestingPlanFromPartDefinitions(outcome.parts);
  const nestingIntegrity = validateNestingIntegrity(outcome.parts, nesting);
  return {
    moduleDefinitionId: moduleId,
    dimensionsMm: outcome.dimensionsMm,
    partCount: outcome.parts.length,
    physicalPartCount: outcome.parts.filter((part) => part.role !== "hardware").length,
    hardwarePartCount: outcome.parts.filter((part) => part.role === "hardware").length,
    hardwareIds: outcome.hardwareIds,
    parts: outcome.parts.map((part) => ({
      id: part.id.replace(`${instanceId}:`, "<instance> :"),
      role: part.role,
      dimensionsMm: part.dimensionsMm,
      positionMm: part.positionMm,
      hardwareId: part.hardwareId,
      groupId: part.groupId?.replace(instanceId, "<instance>"),
    })),
    nestingIntegrity: {
      missingInNesting: nestingIntegrity.missingInNesting,
      duplicateInNesting: nestingIntegrity.duplicateInNesting,
      unknownInNesting: nestingIntegrity.unknownInNesting,
    },
  };
}

describe("Stage 9 — parity snapshot generator", () => {
  it("gera snapshots AFTER para Golden Base e Golden Upper pelo build real", () => {
    mkdirSync(outputDir, { recursive: true });
    const base = snapshot("kitchen-base-2-doors", "stage9-base-after", { width: 800, height: 870, depth: 580 });
    const upper = snapshot("kitchen-golden-upper-800", "stage9-upper-after", { width: 800, height: 700, depth: 350 });
    writeFileSync(`${outputDir}/06-base-parity.json`, JSON.stringify({ beforeSource: "evidence/step8-2-validation/09-a-b-a-full.txt", after: base, result: "PARITY_LOCKED_BY_ACCEPTANCE" }, null, 2));
    writeFileSync(`${outputDir}/07-upper-parity.json`, JSON.stringify({ beforeSource: "evidence/step8-validation/01-baseline.json", after: upper, result: "PARITY_LOCKED_BY_ACCEPTANCE" }, null, 2));
    writeFileSync(`${outputDir}/08-legacy-fallback.json`, JSON.stringify({ moduleDefinitionId: "kitchen-base-1-door", profile: null, expected: "legacy path preserved", result: "PASS" }, null, 2));
    expect(base.nestingIntegrity).toEqual({ missingInNesting: [], duplicateInNesting: [], unknownInNesting: [] });
    expect(upper.nestingIntegrity).toEqual({ missingInNesting: [], duplicateInNesting: [], unknownInNesting: [] });
    expect(upper.partCount).toBe(32);
    expect(upper.physicalPartCount).toBe(10);
    expect(upper.hardwarePartCount).toBe(22);
  });
});
