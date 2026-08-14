import type { CutListRow, ProductionPart } from "../types";

function shortId(base: string, idx: number): string {
  const hash = base.split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  return `${hash.toString(36).slice(0, 4).toUpperCase()}-${String(idx + 1).padStart(3, "0")}`;
}

export function buildCutList(parts: readonly ProductionPart[]): readonly CutListRow[] {
  const rows: CutListRow[] = [];
  parts
    .filter((p) => p.kind !== "fita-borda")
    .forEach((p, idx) => {
      const brand = (p.material.split(" ")[0] ?? "").trim();
      const hasEdge =
        p.category === "porta" ||
        p.category === "frente" ||
        p.category === "tampo" ||
        p.category === "bancada";
      rows.push({
        code: shortId(p.id, idx),
        name: `${p.furnitureLabel} · ${p.label}`,
        material: p.material,
        brand,
        thicknessMm: p.thicknessMm,
        lengthMm: Math.max(p.widthMm, p.heightMm),
        widthMm: Math.min(p.widthMm, p.heightMm),
        qty: p.qty,
        grain: p.grain,
        edges: { top: hasEdge, right: hasEdge, bottom: hasEdge, left: hasEdge },
        edgeTape: hasEdge ? p.finish : "—",
        weightKg: Math.round(p.weightKg * p.qty * 100) / 100,
        areaM2: Math.round(p.areaM2 * p.qty * 1000) / 1000,
        notes: p.notes,
      });
    });
  return rows;
}
