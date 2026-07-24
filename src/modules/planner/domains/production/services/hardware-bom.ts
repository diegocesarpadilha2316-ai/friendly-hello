import type { CompanyManufacturingRules } from "@/modules/planner/shared/engineering/types";
import type { HardwareBomRow, ProductionPart } from "../types";

interface Counters { doors: number; drawers: number; panels: number; ledLinearM: number; cases: number }

function count(parts: readonly ProductionPart[]): Counters {
  const c: Counters = { doors: 0, drawers: 0, panels: 0, ledLinearM: 0, cases: 0 };
  const modules = new Set<string>();
  for (const p of parts) {
    modules.add(p.furnitureId);
    if (p.category === "porta") c.doors += p.qty;
    if (p.category === "frente") c.drawers += p.qty;
    if (p.category === "painel" || p.category === "ripado") c.panels += p.qty;
  }
  c.cases = modules.size;
  c.ledLinearM = Math.round(c.cases * 0.3 * 1.2 * 10) / 10;
  return c;
}

export function buildHardwareBom(
  parts: readonly ProductionPart[],
  rules: CompanyManufacturingRules,
): readonly HardwareBomRow[] {
  const c = count(parts);
  const d = rules.defaults.hardware;
  const rows: HardwareBomRow[] = [];
  const push = (row: Omit<HardwareBomRow, "total">) => {
    rows.push({ ...row, total: Math.round(row.qty * row.unitPrice * 100) / 100 });
  };
  const hingesQty = c.doors * 2;
  push({ kind: "dobradica", brand: "Blum", code: d.dobradica ?? "clip-top", label: "Dobradiça Clip Top 110°", qty: hingesQty, unit: "pc", unitPrice: 12.5 });
  push({ kind: "corredica", brand: "Blum", code: d.corredica ?? "tandembox", label: "Corrediça Tandembox 500mm", qty: c.drawers * 2, unit: "pc", unitPrice: 89 });
  push({ kind: "pistao", brand: "Blum", code: d.pistao ?? "aventos-hf", label: "Pistão a gás Aventos HF", qty: Math.max(0, Math.round(c.doors * 0.15)), unit: "pc", unitPrice: 145 });
  push({ kind: "puxador", brand: "Dioris", code: d.puxador ?? "cava-128", label: "Puxador Cava 128mm", qty: c.doors + c.drawers, unit: "pc", unitPrice: 22 });
  push({ kind: "perfil", brand: "Rometal", code: d.perfil ?? "j-preto", label: "Perfil J alumínio preto", qty: c.panels, unit: "m", unitPrice: 28 });
  push({ kind: "cabideiro", brand: "Rometal", code: d.cabideiro ?? "oval-25", label: "Cabideiro oval 25mm", qty: Math.max(0, Math.floor(c.cases * 0.15)), unit: "pc", unitPrice: 46 });
  push({ kind: "amortecedor", brand: "Blum", code: d.amortecedor ?? "blumotion", label: "Blumotion para dobradiça", qty: hingesQty, unit: "pc", unitPrice: 6.5 });
  push({ kind: "parafuso", brand: "Ciser", code: "3.5x16", label: "Parafuso chipboard 3.5×16", qty: c.cases * 24, unit: "pc", unitPrice: 0.12 });
  push({ kind: "minifix", brand: "Hafele", code: "15mm", label: "Minifix 15mm cabeça+parafuso", qty: c.cases * 8, unit: "pc", unitPrice: 0.85 });
  push({ kind: "cavilha", brand: "Ciser", code: "8x30", label: "Cavilha 8×30mm", qty: c.cases * 16, unit: "pc", unitPrice: 0.18 });
  push({ kind: "confirmat", brand: "Ciser", code: "7x50", label: "Parafuso Confirmat 7×50", qty: c.cases * 4, unit: "pc", unitPrice: 0.9 });
  push({ kind: "led", brand: "Osram", code: "led-strip-2700k", label: "Fita LED 2700K 12V", qty: c.ledLinearM, unit: "m", unitPrice: 34 });
  push({ kind: "transformador", brand: "Osram", code: "driver-60w", label: "Driver LED 60W 12V", qty: Math.max(0, Math.ceil(c.ledLinearM / 5)), unit: "pc", unitPrice: 89 });
  return rows;
}