/**
 * Fase 3.32 — Integração CNC.
 * Gera programas reais para todos os formatos suportados pela máquina primária
 * (GCODE, BPP, CID3, CIX, DXF, NC, MPR, XML) reutilizando o program-generator existente.
 */
import { CNC_MACHINE_CATALOG, findCncMachine, generatePrograms } from "../services/cnc";
import type { CncFormat } from "../services/cnc/types";
import type { CutListRow } from "../types";
import type { CncManifest, CncManifestEntry } from "./types";

export const PRIMARY_MACHINE_ID = CNC_MACHINE_CATALOG[0]?.id ?? "generic-3axis";

export function buildCncManifest(
  cutList: readonly CutListRow[],
  machineId: string = PRIMARY_MACHINE_ID,
): CncManifest {
  const machine = findCncMachine(machineId) ?? findCncMachine("generic-3axis");
  const entries: CncManifestEntry[] = [];
  if (!machine || cutList.length === 0) {
    return { primaryMachineId: machineId, entries: [], totalPrograms: 0, totalMinutes: 0 };
  }
  for (const format of machine.formats as readonly CncFormat[]) {
    const programs = generatePrograms(cutList, machine.id, format);
    if (programs.length === 0) continue;
    entries.push({
      machineId: machine.id,
      machineLabel: `${machine.brand.toUpperCase()} ${machine.model}`,
      format,
      programs,
      totalMin: programs.reduce((a, p) => a + p.estimatedMin, 0),
      totalOps: programs.reduce((a, p) => a + p.operations.length, 0),
    });
  }
  const totalPrograms = entries.reduce((a, e) => a + e.programs.length, 0);
  const totalMinutes = entries.reduce((a, e) => a + e.totalMin, 0);
  return { primaryMachineId: machine.id, entries, totalPrograms, totalMinutes };
}