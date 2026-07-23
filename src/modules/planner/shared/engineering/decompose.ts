/**
 * Decomposição paramétrica de UM móvel em suas peças produzidas.
 * Pura, determinística — o MESMO objeto alimenta Lista de Corte, Plano
 * de Corte, Orçamento, Produção, Render e IA (Fase 3.5+).
 */
import type { Editor2DPrimitive } from "../editor-2d/types";
import { findFinish } from "./materials";
import type {
  CompanyManufacturingRules,
  FurniturePart,
  FurnitureEngineeringParams,
} from "./types";
import { resolveEngineering } from "./parameters";

function part(base: string, idx: number, data: Omit<FurniturePart, "id">): FurniturePart {
  return { id: `${base}:${data.kind}:${idx}`, ...data };
}

export interface DecompositionResult {
  furnitureId: string;
  engineering: FurnitureEngineeringParams;
  parts: readonly FurniturePart[];
  totals: {
    partCount: number;
    boardAreaM2: number;
    edgeMeters: number;
  };
}

export function decomposeFurniture(
  furniture: Extract<Editor2DPrimitive, { kind: "furniture" }>,
  rules: CompanyManufacturingRules,
): DecompositionResult {
  const eng = resolveEngineering(furniture, rules);
  const W = furniture.width;
  const D = furniture.depth;
  const H = furniture.height;
  const t = eng.thicknessMm;
  const bt = eng.backThicknessMm;
  const c = eng.clearanceMm;
  const finish = findFinish(eng.brandId, eng.finishId);
  const material = `${eng.brandId.toUpperCase()} ${t}mm`;
  const finishLabel = finish?.label ?? eng.finishId;
  const grain = finish?.grain ?? eng.grain;

  const parts: FurniturePart[] = [];
  const base = furniture.id;
  const push = (
    kind: FurniturePart["kind"],
    w: number,
    h: number,
    qty = 1,
    extras: Partial<FurniturePart> = {},
  ) => {
    parts.push(
      part(base, parts.length, {
        kind,
        label: extras.label ?? kind,
        widthMm: Math.max(1, Math.round(w)),
        heightMm: Math.max(1, Math.round(h)),
        thicknessMm: extras.thicknessMm ?? t,
        qty,
        material: extras.material ?? material,
        finish: extras.finish ?? finishLabel,
        grain: extras.grain ?? grain,
        edgeMeters: extras.edgeMeters,
        notes: extras.notes,
      }),
    );
  };

  push("lateral", D, H, 2);
  push("base", W - 2 * t, D, 1);
  push("tampo", W - 2 * t, D, 1);

  const backInset = eng.back === "rebaixado" ? t : eng.back === "encaixado" ? 8 : 0;
  push("fundo", W - backInset * 2, H - backInset * 2, 1, { thicknessMm: bt });

  if (eng.shelves > 0) push("prateleira", W - 2 * t - c, D - c, eng.shelves);

  if (eng.doors > 0 && eng.door !== "sem-porta") {
    const dw = (W - c * (eng.doors + 1)) / eng.doors;
    const dh = H - 2 * eng.reveal;
    push("porta", dw, dh, eng.doors, { finish: `${finishLabel} • ${eng.door}` });
  }

  if (eng.drawers > 0 && eng.drawer !== "sem-gaveta") {
    const gh = (H - c * (eng.drawers + 1)) / eng.drawers;
    const gw = W - 2 * t - c;
    for (let i = 0; i < eng.drawers; i++) {
      push("gaveta-frente", W - c * 2, gh, 1, { label: `frente ${i + 1}` });
      push("gaveta-lateral", D - 20, Math.max(80, gh - 20), 2, { label: `laterais ${i + 1}` });
      push("gaveta-fundo", gw, Math.max(80, gh - 20), 1, { label: `fundo ${i + 1}`, thicknessMm: bt });
      push("gaveta-base", gw, D - 20, 1, { label: `base ${i + 1}`, thicknessMm: bt });
    }
  }

  if (eng.base === "rodape") push("rodape", W, 100, 1);
  if (H > 900) push("travessa", W - 2 * t, 80, 1);

  const edgeMeters =
    (parts
      .filter((p) => p.kind === "porta" || p.kind === "gaveta-frente" || p.kind === "tampo")
      .reduce((acc, p) => acc + 2 * (p.widthMm + p.heightMm) * p.qty, 0) /
      1000) *
    (eng.edge === "sem-fita" ? 0 : 1);
  if (edgeMeters > 0) {
    push("fita-borda", edgeMeters * 1000, 22, 1, {
      material: eng.edge,
      finish: finishLabel,
      edgeMeters,
      notes: "somatório linear das frentes",
    });
  }

  const boardAreaM2 = parts
    .filter((p) => p.kind !== "fita-borda")
    .reduce((acc, p) => acc + (p.widthMm * p.heightMm * p.qty) / 1_000_000, 0);

  return {
    furnitureId: furniture.id,
    engineering: eng,
    parts,
    totals: {
      partCount: parts.reduce((n, p) => n + p.qty, 0),
      boardAreaM2: Math.round(boardAreaM2 * 100) / 100,
      edgeMeters: Math.round(edgeMeters * 100) / 100,
    },
  };
}