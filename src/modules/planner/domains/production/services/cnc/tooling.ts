/**
 * Biblioteca de ferramentas — brocas, fresas, serras e especiais.
 */
import type { CncTool, CncToolKind } from "./types";

export const CNC_TOOLS: readonly CncTool[] = [
  { id: "drill-5",  kind: "drill", label: "Broca 5mm",  diameterMm: 5,  lengthMm: 70, rpm: 6000,  feedMmMin: 2000, maxDepthMm: 40, material: "mdf",     lifetimeMin: 900 },
  { id: "drill-8",  kind: "drill", label: "Broca 8mm",  diameterMm: 8,  lengthMm: 70, rpm: 6000,  feedMmMin: 2500, maxDepthMm: 40, material: "mdf",     lifetimeMin: 900 },
  { id: "drill-10", kind: "drill", label: "Broca 10mm", diameterMm: 10, lengthMm: 70, rpm: 6000,  feedMmMin: 2500, maxDepthMm: 40, material: "mdf",     lifetimeMin: 900 },
  { id: "drill-15", kind: "drill", label: "Broca 15mm — minifix", diameterMm: 15, lengthMm: 70, rpm: 5000, feedMmMin: 2000, maxDepthMm: 25, material: "mdf", lifetimeMin: 900 },
  { id: "drill-35", kind: "drill", label: "Broca 35mm — dobradiça", diameterMm: 35, lengthMm: 60, rpm: 4000, feedMmMin: 1500, maxDepthMm: 15, material: "mdf", lifetimeMin: 900 },
  { id: "csnk-90",  kind: "countersink-tool", label: "Escareador 90°", diameterMm: 12, lengthMm: 40, rpm: 6000, feedMmMin: 1500, maxDepthMm: 6, material: "universal", lifetimeMin: 600 },
  { id: "endmill-3",  kind: "end-mill", label: "Fresa topo 3mm",  diameterMm: 3,  lengthMm: 40, rpm: 18000, feedMmMin: 3500, maxDepthMm: 12, material: "universal", lifetimeMin: 500 },
  { id: "endmill-6",  kind: "end-mill", label: "Fresa topo 6mm",  diameterMm: 6,  lengthMm: 50, rpm: 18000, feedMmMin: 4500, maxDepthMm: 20, material: "universal", lifetimeMin: 600 },
  { id: "endmill-8",  kind: "end-mill", label: "Fresa topo 8mm",  diameterMm: 8,  lengthMm: 55, rpm: 18000, feedMmMin: 5000, maxDepthMm: 22, material: "universal", lifetimeMin: 600 },
  { id: "endmill-12", kind: "end-mill", label: "Fresa topo 12mm", diameterMm: 12, lengthMm: 60, rpm: 18000, feedMmMin: 6000, maxDepthMm: 30, material: "universal", lifetimeMin: 800 },
  { id: "ball-6",   kind: "ball-mill", label: "Fresa esférica 6mm", diameterMm: 6, lengthMm: 50, rpm: 20000, feedMmMin: 4000, maxDepthMm: 20, material: "universal", lifetimeMin: 500 },
  { id: "vee-90",   kind: "vee-mill",  label: "Fresa V 90°", diameterMm: 12, lengthMm: 40, rpm: 18000, feedMmMin: 3000, maxDepthMm: 8, material: "universal", lifetimeMin: 400 },
  { id: "saw-120",  kind: "saw",  label: "Serra 120mm", diameterMm: 120, lengthMm: 30, rpm: 6000, feedMmMin: 6000, maxDepthMm: 45, material: "mdf", lifetimeMin: 1500 },
  { id: "disc-150", kind: "disc", label: "Disco 150mm", diameterMm: 150, lengthMm: 30, rpm: 6000, feedMmMin: 8000, maxDepthMm: 45, material: "mdf", lifetimeMin: 1500 },
  { id: "special-glass", kind: "special", label: "Diamantada — vidro", diameterMm: 8, lengthMm: 40, rpm: 22000, feedMmMin: 1200, maxDepthMm: 10, material: "glass", lifetimeMin: 300 },
];

export function findTool(id: string): CncTool | undefined {
  return CNC_TOOLS.find((t) => t.id === id);
}

export function toolsByKind(kind: CncToolKind): readonly CncTool[] {
  return CNC_TOOLS.filter((t) => t.kind === kind);
}
