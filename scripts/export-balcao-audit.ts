import { buildModule } from "../src/modules/planner-v2/library/services/buildModule";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../src/modules/planner-v2/library/services/nestingPlan";

const room = { widthMm: 6000, depthMm: 5000, heightMm: 3000 };
const build = (width: number) => buildModule({
  moduleId: "kitchen-base-2-doors",
  instanceId: `balcao-${width}`,
  dimensionsMm: { width, height: 870, depth: 580 },
  materialOverrides: { body: "mdf-cinza-sagrado", front: "mdf-cinza-sagrado" },
  hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
  room,
});

const rows = [800, 900].map((width) => {
  const outcome = build(width);
  if (!outcome.ok) throw new Error(outcome.error);
  const plan = buildNestingPlanFromPartDefinitions(outcome.parts, { algorithm: "max-rects", kerfMm: 4, marginMm: 10, rotation: "auto", grainMode: "respect" });
  const integrity = validateNestingIntegrity(outcome.parts, plan);
  return {
    width,
    ok: outcome.ok,
    partCount: outcome.parts.length,
    cuttableCount: integrity.cuttableIds.length,
    hardwareCount: outcome.parts.filter((part) => part.role === "hardware").length,
    doors: outcome.parts.filter((part) => part.role === "door").map((part) => ({ id: part.id, widthMm: part.dimensionsMm.width, heightMm: part.dimensionsMm.height })),
    shelf: outcome.parts.find((part) => part.role === "shelf")?.dimensionsMm,
    nesting: { boards: plan.boards.length, unplaced: plan.unplaced.length, missing: integrity.missingInNesting, duplicates: integrity.duplicateInNesting, unknown: integrity.unknownInNesting },
  };
});

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), moduleId: "kitchen-base-2-doors", rows }, null, 2));
