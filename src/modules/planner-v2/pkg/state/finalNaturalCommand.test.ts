import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { usePlannerStore } from "./usePlannerStore";
import { buildFabricationReport, fabricationReportToCsv } from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildNestingPlanFromPartDefinitions } from "../../library/services/nestingPlan";

const FINAL_REQUEST = "Crie uma cozinha linear com torre de forno, balcão de duas portas, gaveteiro de quatro gavetas, balcão de pia, módulos aéreos e bancada. Use MDF 18mm.";

describe("final natural command execution", () => {
  it("gera o projeto completo e exporta todos os dados de fabricação", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(FINAL_REQUEST);
    
    const state = usePlannerStore.getState();
    const instances = state.instances;
    const parts = instances.flatMap((i) => i.parts);
    
    const fabrication = buildFabricationReport(instances);
    const joinery = buildJoineryReport(instances);
    const nesting = buildNestingPlanFromPartDefinitions(parts);

    const evidenceDir = resolve(process.cwd(), "evidence/final_project");
    mkdirSync(evidenceDir, { recursive: true });

    // 1. BOM & Cutlist
    writeFileSync(resolve(evidenceDir, "cozinha-lista-corte.csv"), fabricationReportToCsv(fabrication));
    
    // 2. Nesting SVG
    const boardSvg = nesting.boards.map((board) => {
      const scale = 0.18;
      const rects = board.placements.map((p) => 
        `<rect x="${p.x * scale}" y="${p.y * scale}" width="${p.w * scale}" height="${p.h * scale}" fill="#d4c5b9" stroke="#5d4037" stroke-width="0.5"/>` +
        `<text x="${p.x * scale + 2}" y="${p.y * scale + 8}" font-size="6" fill="#3e2723">${p.code.split(':').pop()}</text>`
      ).join("");
      return `<g transform="translate(0, ${board.index * 380})">` +
             `<rect width="${board.spec.lengthMm * scale}" height="${board.spec.widthMm * scale}" fill="#fafafa" stroke="#333"/>` +
             `<text x="5" y="-10" font-size="12" font-weight="bold">Chapa ${board.index + 1}</text>${rects}</g>`;
    }).join("");
    
    writeFileSync(resolve(evidenceDir, "cozinha-nesting.svg"), 
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${nesting.boards.length * 400 + 50}">${boardSvg}</svg>`);

    // 3. Joinery & Hardware Summary
    const summary = {
      request: FINAL_REQUEST,
      modules: instances.map(i => ({ type: i.moduleDefinitionId, pos: i.positionMm })),
      stats: {
        parts: parts.length,
        hardware: fabrication.hardwareItems.reduce((acc, h) => acc + h.quantity, 0),
        machining_ops: joinery.operations.length,
        boards: nesting.boards.length
      },
      hardware: fabrication.hardwareItems
    };
    writeFileSync(resolve(evidenceDir, "cozinha-resumo-tecnico.json"), JSON.stringify(summary, null, 2));

    expect(instances.length).toBeGreaterThan(0);
    expect(nesting.unplaced.length).toBe(0);
  });
});
