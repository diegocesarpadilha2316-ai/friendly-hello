/**
 * Fase 3.27 — Hooks determinísticos para a IA operar sobre resultados
 * de importação. Sem I/O — apenas resposta pt-BR pré-formatada.
 */
import type { ImportResult } from "../types";
import { detectFloorplan } from "./converter";

export function describeImport(result: ImportResult): string {
  const fp = detectFloorplan(result);
  return [
    `Arquivo ${result.filename} (${result.format.toUpperCase()}) importado.`,
    `${result.entities.length} entidades, ${result.layers.length} camadas.`,
    `${fp.walls.length} segmentos de parede, ${fp.openings.filter((o) => o.type === "door").length} portas, ${fp.openings.filter((o) => o.type === "window").length} janelas, ${fp.floors.length} pisos/ambientes.`,
    result.warnings.length ? `${result.warnings.length} avisos.` : "Sem avisos.",
  ].join(" ");
}

export interface AICommandMatch {
  readonly command: "recognize-walls" | "to-3d" | "to-parametric" | "editable" | "unknown";
  readonly hint?: string;
}

export function matchImporterCommand(prompt: string): AICommandMatch {
  const p = prompt.toLowerCase();
  if (/reconhec.*pared/.test(p)) return { command: "recognize-walls" };
  if (/(3d|ambiente 3d|em 3d|para 3d)/.test(p)) return { command: "to-3d" };
  if (/(param[eé]trico)/.test(p)) return { command: "to-parametric" };
  if (/(edit[aá]vel|convert)/.test(p)) return { command: "editable" };
  return { command: "unknown" };
}