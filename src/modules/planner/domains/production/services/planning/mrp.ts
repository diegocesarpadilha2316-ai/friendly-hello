import type { CutListRow, HardwareBomRow } from "../../types";
import type { MrpItem, MrpSummary } from "./types";

function categoryFromMaterial(mat: string): MrpItem["category"] {
  const m = mat.toLowerCase();
  if (m.includes("mdf")) return "MDF";
  if (m.includes("mdp") || m.includes("particulado")) return "MDP";
  if (m.includes("vidro")) return "Vidro";
  if (m.includes("espelho")) return "Espelho";
  return "MDF";
}

function hwCategory(kind: string): MrpItem["category"] {
  const k = kind.toLowerCase();
  if (k.includes("parafuso")) return "Parafuso";
  if (k.includes("minifix")) return "Minifix";
  if (k.includes("cavilha")) return "Cavilha";
  if (k.includes("corredic") || k.includes("slide")) return "Corredicas";
  if (k.includes("dobradica") || k.includes("hinge")) return "Dobradica";
  if (k.includes("led")) return "LED";
  if (k.includes("perfil")) return "Perfil";
  if (k.includes("puxador") || k.includes("handle")) return "Puxador";
  if (k.includes("rodizio")) return "Rodizio";
  if (k.includes("pe") || k.includes("foot")) return "Pes";
  if (k.includes("cola") || k.includes("adesivo")) return "Cola";
  if (k.includes("fita") || k.includes("tape")) return "Fita";
  return "Ferragem";
}

function unitPriceByMaterial(cat: MrpItem["category"]): number {
  const map: Record<MrpItem["category"], number> = {
    MDF: 85,
    MDP: 65,
    Ferragem: 4.5,
    Parafuso: 0.35,
    Minifix: 1.2,
    Cavilha: 0.15,
    Corredicas: 42,
    Dobradica: 8.5,
    LED: 18,
    Perfil: 22,
    Vidro: 180,
    Espelho: 260,
    Cola: 32,
    Fita: 2.5,
    Puxador: 14,
    Rodizio: 9,
    Pes: 6,
  };
  return map[cat] ?? 5;
}

export function buildMrpFromCutList(
  cutList: readonly CutListRow[],
  hardware: readonly HardwareBomRow[],
): MrpSummary {
  const byKey = new Map<string, MrpItem>();

  // Chapas por material + espessura
  for (const row of cutList) {
    const category = categoryFromMaterial(row.material);
    const key = `${category}-${row.thicknessMm}-${row.brand}`;
    const areaM2 = row.areaM2 * row.qty;
    const existing = byKey.get(key);
    const price = unitPriceByMaterial(category);
    if (existing) {
      existing.qty += areaM2;
      existing.total = +(existing.qty * existing.unitPrice).toFixed(2);
    } else {
      byKey.set(key, {
        code: key,
        label: `${row.material} ${row.thicknessMm}mm — ${row.brand}`,
        category,
        unit: "m²",
        qty: +areaM2.toFixed(3),
        unitPrice: price,
        total: +(areaM2 * price).toFixed(2),
        supplierHint: row.brand,
      });
    }
  }

  // Fita de borda
  let edgeMeters = 0;
  for (const row of cutList) {
    const perimeter =
      ((row.edges.top ? row.lengthMm : 0) +
        (row.edges.bottom ? row.lengthMm : 0) +
        (row.edges.left ? row.widthMm : 0) +
        (row.edges.right ? row.widthMm : 0)) /
      1000;
    edgeMeters += perimeter * row.qty;
  }
  if (edgeMeters > 0) {
    const price = unitPriceByMaterial("Fita");
    byKey.set("Fita-1mm", {
      code: "Fita-1mm",
      label: "Fita de borda 1mm",
      category: "Fita",
      unit: "m",
      qty: +edgeMeters.toFixed(2),
      unitPrice: price,
      total: +(edgeMeters * price).toFixed(2),
    });
  }

  // Ferragens
  for (const hw of hardware) {
    const category = hwCategory(hw.kind);
    const key = `${category}-${hw.code}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.qty += hw.qty;
      existing.total = +(existing.qty * existing.unitPrice).toFixed(2);
    } else {
      byKey.set(key, {
        code: hw.code,
        label: hw.label,
        category,
        unit: hw.unit,
        qty: hw.qty,
        unitPrice: hw.unitPrice || unitPriceByMaterial(category),
        total: hw.total || +(hw.qty * unitPriceByMaterial(category)).toFixed(2),
        supplierHint: hw.brand,
      });
    }
  }

  const items = Array.from(byKey.values()).sort((a, b) => b.total - a.total);
  const byCategory: Record<string, { qty: number; cost: number }> = {};
  let totalCost = 0;
  for (const item of items) {
    totalCost += item.total;
    const acc = byCategory[item.category] ?? { qty: 0, cost: 0 };
    acc.qty += item.qty;
    acc.cost += item.total;
    byCategory[item.category] = acc;
  }

  return {
    items,
    totalItems: items.length,
    totalCost: +totalCost.toFixed(2),
    byCategory,
  };
}