import type { ProductionPart } from "../../types";
import type { DrillingSheet, DrillOp, DrillOpKind } from "./types";

function pushOp(
  ops: DrillOp[],
  base: Omit<DrillOp, "id">,
): void {
  ops.push({ ...base, id: `${base.partCode}-${base.kind}-${ops.length + 1}` });
}

function opsForPart(part: ProductionPart, code: string): DrillOp[] {
  const ops: DrillOp[] = [];
  const inset = 37; // padrão marceneiro
  const L = Math.max(part.widthMm, part.heightMm);
  const S = Math.min(part.widthMm, part.heightMm);

  const isCase =
    part.category === "lateral" ||
    part.category === "base" ||
    part.category === "tampo" ||
    part.category === "divisoria" ||
    part.category === "fundo";

  if (isCase) {
    // minifix nas 4 extremidades da face interna
    const minifixes: DrillOpKind[] = ["minifix-cabeca", "minifix-corpo"];
    for (const kind of minifixes) {
      pushOp(ops, {
        partCode: code, kind, face: "F1",
        x: inset, y: inset, diameterMm: kind === "minifix-cabeca" ? 15 : 5,
        depthMm: kind === "minifix-cabeca" ? 12.5 : 34, tool: "broca-hss",
      });
      pushOp(ops, {
        partCode: code, kind, face: "F1",
        x: L - inset, y: inset, diameterMm: kind === "minifix-cabeca" ? 15 : 5,
        depthMm: kind === "minifix-cabeca" ? 12.5 : 34, tool: "broca-hss",
      });
    }
    // cavilhas centrais (2 por face)
    pushOp(ops, { partCode: code, kind: "cavilha", face: "T", x: inset, y: 9, diameterMm: 8, depthMm: 30, tool: "broca-8mm" });
    pushOp(ops, { partCode: code, kind: "cavilha", face: "T", x: L - inset, y: 9, diameterMm: 8, depthMm: 30, tool: "broca-8mm" });
  }

  if (part.category === "porta") {
    // dobradiças: 2 copos φ35 a 100mm das extremidades
    pushOp(ops, { partCode: code, kind: "dobradica-copo", face: "F2", x: 22.5, y: 100, diameterMm: 35, depthMm: 12.5, tool: "caneco-35" });
    pushOp(ops, { partCode: code, kind: "dobradica-copo", face: "F2", x: 22.5, y: S - 100, diameterMm: 35, depthMm: 12.5, tool: "caneco-35" });
    if (S > 900) {
      pushOp(ops, { partCode: code, kind: "dobradica-copo", face: "F2", x: 22.5, y: S / 2, diameterMm: 35, depthMm: 12.5, tool: "caneco-35" });
    }
    // puxador cava (fresagem representada como furação passante)
    pushOp(ops, { partCode: code, kind: "puxador-passante", face: "F1", x: L / 2, y: 40, diameterMm: 10, depthMm: part.thicknessMm, tool: "fresa-10" });
  }

  if (part.category === "gaveta" || part.category === "frente") {
    // corrediças: 2 pontos por lateral
    pushOp(ops, { partCode: code, kind: "corredica-fixacao", face: "F2", x: 37, y: 37, diameterMm: 5, depthMm: 12, tool: "broca-5" });
    pushOp(ops, { partCode: code, kind: "corredica-fixacao", face: "F2", x: L - 37, y: 37, diameterMm: 5, depthMm: 12, tool: "broca-5" });
  }

  if (part.category === "painel" || part.category === "ripado") {
    pushOp(ops, { partCode: code, kind: "perfil-canal", face: "F1", x: 0, y: 0, diameterMm: 4, depthMm: 8, tool: "fresa-perfil" });
    pushOp(ops, { partCode: code, kind: "led-canal", face: "F1", x: 0, y: 20, diameterMm: 12, depthMm: 8, tool: "fresa-canal" });
  }

  if (part.category === "prateleira") {
    // 4 furos de suporte / confirmat
    pushOp(ops, { partCode: code, kind: "confirmat", face: "T", x: inset, y: 9, diameterMm: 7, depthMm: 50, tool: "broca-confirmat" });
    pushOp(ops, { partCode: code, kind: "confirmat", face: "T", x: L - inset, y: 9, diameterMm: 7, depthMm: 50, tool: "broca-confirmat" });
  }

  return ops;
}

export function buildDrillingSheets(
  parts: readonly ProductionPart[],
): readonly DrillingSheet[] {
  const sheets: DrillingSheet[] = [];
  parts
    .filter((p) => p.kind !== "fita-borda")
    .forEach((part, idx) => {
      const code = `P-${String(idx + 1).padStart(4, "0")}`;
      const ops = opsForPart(part, code);
      if (ops.length === 0) return;
      sheets.push({
        partCode: code,
        partName: `${part.furnitureLabel} · ${part.label}`,
        ops,
        totalHoles: ops.length,
        estimatedSeconds: Math.round(ops.length * 4.5),
      });
    });
  return sheets;
}

export function countDrillOpsByKind(
  sheets: readonly DrillingSheet[],
): Record<DrillOpKind, number> {
  const map = {} as Record<DrillOpKind, number>;
  for (const s of sheets) {
    for (const op of s.ops) {
      map[op.kind] = (map[op.kind] ?? 0) + 1;
    }
  }
  return map;
}