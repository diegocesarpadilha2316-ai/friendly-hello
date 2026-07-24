/**
 * Post processadores por fabricante — cada um serializa as operações
 * no formato nativo da máquina. Puros e determinísticos.
 */
import type { CncFormat, CncMachine, CncOperation, CncTool } from "./types";
import { findTool } from "./tooling";

export interface PostContext {
  readonly machine: CncMachine;
  readonly partCode: string;
  readonly operations: readonly CncOperation[];
  readonly tools: readonly CncTool[];
}

export type PostProcessor = (ctx: PostContext) => string;

export const generic: PostProcessor = (ctx) => {
  const lines = [
    `; Dioris CNC — ${ctx.partCode}`,
    `; Máquina ${ctx.machine.model} · ${ctx.operations.length} operações`,
    "G21", "G90", "M03 S18000",
  ];
  for (const o of ctx.operations) {
    const tool = findTool(o.toolId);
    lines.push(`; ${o.kind} @ ${tool?.label ?? o.toolId}`);
    lines.push(`G0 X${o.x} Y${o.y} Z5`);
    lines.push(`G1 Z${-o.depthMm} F${tool?.feedMmMin ?? 2000}`);
    if (o.widthMm && o.heightMm) {
      lines.push(`G1 X${o.x + o.widthMm} F${tool?.feedMmMin ?? 3000}`);
      lines.push(`G1 Y${o.y + o.heightMm}`);
      lines.push(`G1 X${o.x}`);
      lines.push(`G1 Y${o.y}`);
    }
    lines.push("G0 Z5");
  }
  lines.push("M05", "M30");
  return lines.join("\n");
};

export const bpp: PostProcessor = (ctx) => {
  const header = [
    "[H]", `PAN=${ctx.partCode}`, "DX=2440", "DY=1220", "DZ=18", "[EH]",
    "[OFFS]", "OFF=", "[EOFFS]",
  ];
  const ops = ctx.operations.map((o) => {
    if (o.kind === "minifix" || o.kind === "cavilha" || o.kind === "hinge" || o.kind === "drill-through" || o.kind === "drill-blind") {
      return `BH X=${o.x} Y=${o.y} Z=0 D=${o.diameterMm ?? 8} P=${o.depthMm} T="${o.toolId}"`;
    }
    return `RT X=${o.x} Y=${o.y} DX=${o.widthMm ?? 0} DY=${o.heightMm ?? 0} P=${o.depthMm} T="${o.toolId}"`;
  });
  return [...header, "[MACROS]", ...ops, "[EMACROS]"].join("\n");
};

export const cix: PostProcessor = (ctx) => {
  const ops = ctx.operations.map((o, i) => `[${i}] KIND=${o.kind} X=${o.x} Y=${o.y} Z=${o.z} D=${o.depthMm} T=${o.toolId}`).join("\n");
  return `BIESSE CIX\nPART=${ctx.partCode}\nMACHINE=${ctx.machine.model}\n${ops}\nEND`;
};

export const cid3: PostProcessor = (ctx) => {
  const ops = ctx.operations.map((o) => `${o.kind};${o.x};${o.y};${o.z};${o.depthMm};${o.toolId}`).join("\n");
  return `CID3\nPART;${ctx.partCode}\nMACHINE;${ctx.machine.model}\nOPS\n${ops}\nENDCID3`;
};

export const mpr: PostProcessor = (ctx) => {
  const header = ['<<', `Kommentar="Dioris ${ctx.partCode}"`, "L=2440", "B=1220", "D=18", ">>"];
  const ops = ctx.operations.map(
    (o) => `<100 Kommentar="${o.kind}"\n  XA=${o.x} YA=${o.y} TI=${o.depthMm} DU=${o.diameterMm ?? 0} WZ_NAME="${o.toolId}"\n>`,
  );
  return [...header, ...ops].join("\n");
};

export const nc: PostProcessor = (ctx) => {
  const lines = ["%", `O0001 (${ctx.partCode})`];
  ctx.operations.forEach((o, i) => {
    lines.push(`N${(i + 1) * 10} G0 X${o.x} Y${o.y}`);
    lines.push(`N${(i + 1) * 10 + 1} G1 Z${-o.depthMm} F1500`);
    lines.push(`N${(i + 1) * 10 + 2} G0 Z5`);
  });
  lines.push("M30", "%");
  return lines.join("\n");
};

export const xml: PostProcessor = (ctx) => {
  const ops = ctx.operations
    .map(
      (o) =>
        `  <op id="${o.id}" kind="${o.kind}" x="${o.x}" y="${o.y}" z="${o.z}" depth="${o.depthMm}" tool="${o.toolId}"/>`,
    )
    .join("\n");
  return `<?xml version="1.0"?>\n<dioris part="${ctx.partCode}" machine="${ctx.machine.model}">\n${ops}\n</dioris>`;
};

export const dxf: PostProcessor = (ctx) => {
  const entities = ctx.operations.flatMap((o) => [
    "0", "CIRCLE", "8", `LAYER_${o.kind}`,
    "10", String(o.x), "20", String(o.y), "40", String((o.diameterMm ?? 6) / 2),
  ]);
  return ["0", "SECTION", "2", "ENTITIES", ...entities, "0", "ENDSEC", "0", "EOF"].join("\n");
};

export function postProcessor(format: CncFormat): PostProcessor {
  switch (format) {
    case "bpp":   return bpp;
    case "cix":   return cix;
    case "cid3":  return cid3;
    case "mpr":   return mpr;
    case "nc":    return nc;
    case "xml":   return xml;
    case "dxf":   return dxf;
    case "gcode": return generic;
  }
}
