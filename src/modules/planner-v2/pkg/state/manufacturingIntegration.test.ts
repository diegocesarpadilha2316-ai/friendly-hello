import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { usePlannerStore } from "./usePlannerStore";
import {
  buildFabricationReport,
  fabricationReportToCsv,
} from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildNestingPlanFromPartDefinitions } from "../../library/services/nestingPlan";

const NATURAL_KITCHEN_REQUEST =
  "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.";

describe("manufacturing integration — natural request to fabrication", () => {
  it("materializa, abre e documenta a cozinha sem posicionamento manual", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(NATURAL_KITCHEN_REQUEST);
    const state = usePlannerStore.getState();
    const instances = state.instances;
    const parts = instances.flatMap((instance) => instance.parts);
    const fabrication = buildFabricationReport(instances);
    const joinery = buildJoineryReport(instances);
    const nesting = buildNestingPlanFromPartDefinitions(parts);

    expect(instances).toHaveLength(5);
    expect(instances.every((instance) => instance.layout?.supported !== false)).toBe(true);
    expect(instances.every((instance) => instance.parts.length > 0)).toBe(true);
    expect(new Set(parts.map((part) => part.id)).size).toBe(parts.length);
    expect(fabrication.warnings).toEqual([]);
    expect(fabrication.cutItems.length).toBeGreaterThan(0);
    expect(fabrication.hardwareItems.length).toBeGreaterThan(0);
    expect(joinery.warnings).toEqual([]);
    expect(joinery.operations.length).toBeGreaterThan(0);
    expect(nesting.boards.length).toBeGreaterThan(0);
    expect(nesting.unplaced).toEqual([]);

    const drawer = instances.find((instance) => instance.moduleDefinitionId === "kitchen-drawer-4");
    const sink = instances.find(
      (instance) => instance.moduleDefinitionId === "kitchen-sink-cabinet",
    );
    expect(drawer).toBeDefined();
    expect(sink).toBeDefined();
    store.toggleInstanceAnimation(drawer!.id);
    store.toggleInstanceAnimation(sink!.id);
    const opened = usePlannerStore.getState().instances;
    expect(opened.find((instance) => instance.id === drawer!.id)?.isOpen).toBe(true);
    expect(opened.find((instance) => instance.id === sink!.id)?.isOpen).toBe(true);

    const evidenceDir = resolve(process.cwd(), "evidence/manufacturing");
    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(
      resolve(evidenceDir, "natural-kitchen-manufacturing.json"),
      JSON.stringify(
        {
          request: NATURAL_KITCHEN_REQUEST,
          modules: instances.map((instance) => ({
            id: instance.id,
            moduleDefinitionId: instance.moduleDefinitionId,
            dimensionsMm: instance.dimensionsMm,
            positionMm: instance.positionMm,
            supported: instance.layout?.supported !== false,
            partCount: instance.parts.length,
          })),
          fabrication,
          joinery,
          nesting,
        },
        null,
        2,
      ),
    );
    writeFileSync(
      resolve(evidenceDir, "natural-kitchen-cut-list.csv"),
      fabricationReportToCsv(fabrication),
    );
    const boardSvg = nesting.boards
      .map((board) => {
        const scale = 0.18;
        const rects = board.placements
          .map(
            (placement) =>
              `<rect x="${placement.x * scale}" y="${placement.y * scale}" width="${placement.w * scale}" height="${placement.h * scale}" fill="#b7c9a8" stroke="#203225"/><text x="${placement.x * scale + 3}" y="${placement.y * scale + 12}" font-size="10">${placement.code.slice(-12)}</text>`,
          )
          .join("");
        return `<g><rect width="${board.spec.lengthMm * scale}" height="${board.spec.widthMm * scale}" fill="#f5f1e8" stroke="#141414"/><text x="8" y="16" font-size="14">Chapa ${board.index}</text>${rects}</g>`;
      })
      .join('<g transform="translate(0,350)">');
    writeFileSync(
      resolve(evidenceDir, "natural-kitchen-nesting.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="${Math.max(380, nesting.boards.length * 360)}">${boardSvg}</svg>`,
    );
  });
});
