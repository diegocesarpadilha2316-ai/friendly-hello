import type { CncJobPreview, CncTargetMachine, CutListRow } from "../types";

export const CNC_MACHINES: readonly CncTargetMachine[] = [
  {
    id: "biesse-selco",
    brand: "Biesse",
    model: "Selco WNA",
    kind: "seccionadora",
    formats: ["xxl", "dxf"],
    status: "planejado",
  },
  {
    id: "scm-gabbiani",
    brand: "SCM",
    model: "Gabbiani Galaxy",
    kind: "seccionadora",
    formats: ["xxl", "dxf"],
    status: "planejado",
  },
  {
    id: "biesse-akron",
    brand: "Biesse",
    model: "Akron 1400",
    kind: "coladeira",
    formats: ["cix"],
    status: "planejado",
  },
  {
    id: "scm-startech",
    brand: "SCM",
    model: "Startech CN",
    kind: "furadeira",
    formats: ["cix", "dxf"],
    status: "planejado",
  },
  {
    id: "biesse-rover",
    brand: "Biesse",
    model: "Rover K",
    kind: "router",
    formats: ["gcode", "dxf"],
    status: "beta",
  },
  {
    id: "cnc-generico",
    brand: "Genérico",
    model: "3-Axis CNC",
    kind: "router",
    formats: ["gcode", "dxf"],
    status: "planejado",
  },
];

export function previewCncJobs(
  rows: readonly CutListRow[],
  machineId: string,
): readonly CncJobPreview[] {
  const machine = CNC_MACHINES.find((m) => m.id === machineId);
  const format = machine?.formats.includes("gcode") ? "gcode" : "dxf";
  return rows.slice(0, 8).map((row) => ({
    code: row.code,
    machineId,
    format,
    operations: [
      `HEAD ${row.thicknessMm}mm`,
      `CUT ${row.lengthMm}×${row.widthMm}`,
      row.edgeTape !== "—" ? `EDGE ${row.edgeTape}` : "NO-EDGE",
      "DRILL minifix ×4",
    ],
    estimatedMinutes: Math.max(2, Math.round(((row.lengthMm + row.widthMm) / 700) * 10) / 10),
  }));
}

export function toGcodeStub(row: CutListRow): string {
  return [
    "; Dioris CNC preview — apenas visualização",
    `; peça ${row.code} · ${row.name}`,
    "G21 ; mm",
    "G90 ; absoluto",
    "M03 S18000",
    "G0 X0 Y0 Z5",
    `G1 X${row.lengthMm} F3000`,
    `G1 Y${row.widthMm}`,
    "G1 X0",
    "G1 Y0",
    "M05",
    "M30",
  ].join("\n");
}

export function toDxfStub(row: CutListRow): string {
  return `0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nDIORIS\n70\n1\n90\n4\n10\n0\n20\n0\n10\n${row.lengthMm}\n20\n0\n10\n${row.lengthMm}\n20\n${row.widthMm}\n10\n0\n20\n${row.widthMm}\n0\nENDSEC\n0\nEOF\n`;
}
