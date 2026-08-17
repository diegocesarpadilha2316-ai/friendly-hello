import "../src/modules/planner-v2/library/index";
import { buildModule } from "../src/modules/planner-v2/library/services/buildModule";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../src/modules/planner-v2/library/services/nestingPlan";
import { describe, it } from "vitest";

const room = { widthMm: 6000, depthMm: 5000, heightMm: 3000 };
const build = (width: number) => buildModule({
  moduleId: "kitchen-base-2-doors",
  instanceId: `balcao-${width}`,
  dimensionsMm: { width, height: 870, depth: 580 },
  materialOverrides: { body: "mdf-cinza-sagrado", front: "mdf-cinza-sagrado" },
  hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
  room,
});

describe("exportação técnica do balcão", () => {
  it("imprime a auditoria 800→900", () => {
    const rows = [800, 900].map((width) => {
      const outcome = build(width);
      if (!outcome.ok) throw new Error(outcome.error);
      const plan = buildNestingPlanFromPartDefinitions(outcome.parts, { algorithm: "max-rects", kerfMm: 4, marginMm: 10, rotation: "auto", grainMode: "respect" });
      const integrity = validateNestingIntegrity(outcome.parts, plan);
      return {
        width,
        partCount: outcome.parts.length,
        cuttableCount: integrity.cuttableIds.length,
        hardwareCount: outcome.parts.filter((part) => part.role === "hardware").length,
        doors: outcome.parts.filter((part) => part.role === "door").map((part) => ({ widthMm: part.dimensionsMm.width, heightMm: part.dimensionsMm.height })),
        shelf: outcome.parts.find((part) => part.role === "shelf")?.dimensionsMm,
        nesting: { boards: plan.boards.length, unplaced: plan.unplaced.length, missing: integrity.missingInNesting, duplicates: integrity.duplicateInNesting, unknown: integrity.unknownInNesting },
      };
    });
    console.log(JSON.stringify({ moduleId: "kitchen-base-2-doors", rows }, null, 2));
  });
});
