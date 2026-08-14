import type { PartLabel, ProductionPart } from "../types";

export function buildLabels(
  parts: readonly ProductionPart[],
  meta: { projectId: string; projectName: string; clientName: string },
): readonly PartLabel[] {
  return parts
    .filter((p) => p.kind !== "fita-borda")
    .map((p, idx) => {
      const code = `${meta.projectId.slice(0, 4).toUpperCase()}-${(idx + 1).toString().padStart(4, "0")}`;
      const payload = JSON.stringify({ code, part: p.kind, mod: p.furnitureId, qty: p.qty });
      return {
        code,
        qrPayload: payload,
        barcodePayload: code,
        projectName: meta.projectName,
        clientName: meta.clientName,
        environmentLabel: p.environmentId,
        roomLabel: p.roomLabel,
        moduleLabel: p.furnitureLabel,
        partLabel: p.label,
        position: `${p.category.toUpperCase()} · ${idx + 1}`,
        dimensions: `${p.widthMm} × ${p.heightMm} × ${p.thicknessMm} mm`,
        material: p.material,
        edgeTape: p.finish,
      };
    });
}
