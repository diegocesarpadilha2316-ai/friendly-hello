import type { CutListRow } from "../../types";
import type {
  CamFormat,
  FabricationMachine,
  PostProcessorPreview,
} from "./types";
import { findMachine } from "./machines";

function pickFormat(machine: FabricationMachine): CamFormat {
  return machine.formats[0];
}

function gcode(row: CutListRow): { header: string; body: string; footer: string } {
  const header = [
    "; Dioris Post-Processor — G-Code (preview)",
    `; peça ${row.code} · ${row.name}`,
    "G21 ; mm",
    "G90 ; absoluto",
    "G17 ; XY",
    "M03 S18000",
  ].join("\n");
  const body = [
    "G0 X0 Y0 Z5",
    `G1 X${row.lengthMm} F3000`,
    `G1 Y${row.widthMm}`,
    "G1 X0",
    "G1 Y0",
  ].join("\n");
  const footer = ["M05", "M30"].join("\n");
  return { header, body, footer };
}

function dxf(row: CutListRow): { header: string; body: string; footer: string } {
  const header = "0\nSECTION\n2\nENTITIES";
  const body = `0\nLWPOLYLINE\n8\nDIORIS\n70\n1\n90\n4\n10\n0\n20\n0\n10\n${row.lengthMm}\n20\n0\n10\n${row.lengthMm}\n20\n${row.widthMm}\n10\n0\n20\n${row.widthMm}`;
  const footer = "0\nENDSEC\n0\nEOF";
  return { header, body, footer };
}

function bpp(row: CutListRow): { header: string; body: string; footer: string } {
  const header = [
    "[H]",
    `TYP=PANEL`,
    `LPX=${row.lengthMm}`,
    `LPY=${row.widthMm}`,
    `LPZ=${row.thicknessMm}`,
    `MAT=${row.material}`,
  ].join("\n");
  const body = "[B]\nOP=CUT_OUTLINE";
  const footer = "[E]";
  return { header, body, footer };
}

function cix(row: CutListRow): { header: string; body: string; footer: string } {
  const header = `BEGIN\n  PANEL "${row.code}" ${row.lengthMm} ${row.widthMm} ${row.thicknessMm}`;
  const body = `  CUT OUTLINE\n  EDGE ${row.edgeTape}`;
  const footer = "END";
  return { header, body, footer };
}

function generic(row: CutListRow, format: CamFormat): { header: string; body: string; footer: string } {
  return {
    header: `# Dioris ${format.toUpperCase()} preview\n# ${row.code} · ${row.name}`,
    body: `SIZE ${row.lengthMm}x${row.widthMm}x${row.thicknessMm}\nMATERIAL ${row.material}\nCUT OUTLINE`,
    footer: "END",
  };
}

export function generatePostProcessor(
  row: CutListRow,
  machineId: string,
  formatOverride?: CamFormat,
): PostProcessorPreview | null {
  const machine = findMachine(machineId);
  if (!machine) return null;
  const format = formatOverride && machine.formats.includes(formatOverride) ? formatOverride : pickFormat(machine);
  const parts =
    format === "gcode" ? gcode(row) :
    format === "dxf" ? dxf(row) :
    format === "bpp" ? bpp(row) :
    format === "cix" || format === "cid3" ? cix(row) :
    generic(row, format);
  const opsCount = parts.body.split("\n").filter(Boolean).length;
  return {
    code: row.code,
    machineId,
    format,
    header: parts.header,
    body: parts.body,
    footer: parts.footer,
    operationsCount: opsCount,
    estimatedMinutes: Math.max(2, Math.round((row.lengthMm + row.widthMm) / 700 * 10) / 10),
  };
}

export function serializePostProcessor(preview: PostProcessorPreview): string {
  return `${preview.header}\n${preview.body}\n${preview.footer}\n`;
}

export function bundlePostProcessors(
  rows: readonly CutListRow[],
  machineId: string,
  format?: CamFormat,
): string {
  return rows
    .map((r) => generatePostProcessor(r, machineId, format))
    .filter((p): p is PostProcessorPreview => !!p)
    .map(serializePostProcessor)
    .join("\n; ────────────────\n");
}