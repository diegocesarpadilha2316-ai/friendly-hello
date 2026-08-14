/**
 * Etapa 12 — Quantificação: transforma o resultado de produção em itens
 * de orçamento com quantidade líquida, perda e preço rastreável.
 *
 * O domínio NÃO importa tipos de outros domínios: consome uma entrada
 * estrutural (duck-typed) montada pelo hook a partir do relatório de
 * produção já existente. Nada é recalculado em paralelo — as quantidades
 * físicas continuam vindo de uma única fonte (motor de produção).
 */
import type { BudgetCategory, BudgetItem, BudgetSettings, BudgetUnit } from "../types";
import { money } from "./defaults";

export interface QuantifyPart {
  readonly kind: string;
  readonly category: string;
  readonly label: string;
  readonly material: string;
  readonly finish: string;
  readonly qty: number;
  readonly areaM2: number;
  readonly edgeMeters?: number;
  readonly furnitureLabel: string;
  readonly roomLabel: string;
}

export interface QuantifyHardware {
  readonly kind: string;
  readonly brand: string;
  readonly code: string;
  readonly label: string;
  readonly qty: number;
  readonly unit: BudgetUnit;
  readonly unitPrice: number;
}

export interface QuantifyInput {
  readonly parts: readonly QuantifyPart[];
  readonly hardware: readonly QuantifyHardware[];
  readonly boardsCount: number;
  readonly settings: BudgetSettings;
  /** Resolve o preço unitário de um material de chapa (R$/m²). */
  readonly materialPricePerM2: (material: string) => number | null;
}

function grossQty(net: number, wastePct: number, unit: BudgetUnit): number {
  const raw = net * (1 + wastePct / 100);
  if (unit === "un" || unit === "pc" || unit === "chapa" || unit === "kit") {
    return Math.ceil(raw - 1e-9);
  }
  return Math.round(raw * 100) / 100;
}

function makeItem(input: {
  id: string;
  category: BudgetCategory;
  name: string;
  origin: string;
  unit: BudgetUnit;
  quantityNet: number;
  wastePct: number;
  unitCost: number | null;
  priceSource: string;
  estimated?: boolean;
}): BudgetItem {
  const quantityGross = grossQty(input.quantityNet, input.wastePct, input.unit);
  const unitCost = input.unitCost != null && input.unitCost > 0 ? money(input.unitCost) : null;
  return {
    id: input.id,
    source: "producao",
    category: input.category,
    name: input.name,
    origin: input.origin,
    unit: input.unit,
    quantityNet: Math.round(input.quantityNet * 1000) / 1000,
    wastePct: input.wastePct,
    quantityGross,
    unitCost,
    pricingStatus: unitCost == null ? "ausente" : input.estimated ? "estimado" : "conhecido",
    priceSource: unitCost == null ? "—" : input.priceSource,
    totalCost: unitCost == null ? null : money(unitCost * quantityGross),
    manualPrice: false,
    manualQuantity: false,
  };
}

/** Gera as linhas físicas do orçamento (materiais, fitas, ferragens, acabamentos). */
export function quantify(input: QuantifyInput): readonly BudgetItem[] {
  const { settings } = input;
  const waste = settings.wastePctByCategory;
  const items: BudgetItem[] = [];

  // ── Chapas: agrupadas por material real das peças ──
  const byMaterial = new Map<string, { areaM2: number; parts: number; rooms: Set<string> }>();
  for (const p of input.parts) {
    if (p.kind === "fita-borda") continue;
    const key = p.material || "Material não definido";
    const acc = byMaterial.get(key) ?? { areaM2: 0, parts: 0, rooms: new Set<string>() };
    acc.areaM2 += p.areaM2 * p.qty;
    acc.parts += p.qty;
    acc.rooms.add(p.roomLabel);
    byMaterial.set(key, acc);
  }
  for (const [material, acc] of byMaterial) {
    const perM2 = input.materialPricePerM2(material);
    const estimated = perM2 == null && settings.boardPrice > 0;
    // Sem preço de catálogo, converte o preço de chapa cheia (2,75 × 1,85 m).
    const fallbackPerM2 = estimated ? settings.boardPrice / 5.0875 : null;
    items.push(
      makeItem({
        id: `producao:chapa:${material}`,
        category: "chapas",
        name: material,
        origin: `${acc.parts} peças · ${[...acc.rooms].join(", ")}`,
        unit: "m2",
        quantityNet: acc.areaM2,
        wastePct: waste.chapas,
        unitCost: perM2 ?? fallbackPerM2,
        priceSource: perM2 != null ? "Catálogo Dioris" : "Preço de chapa da empresa",
        estimated: perM2 == null,
      }),
    );
  }

  // ── Fita de borda ──
  const edgeMeters = input.parts
    .filter((p) => p.kind === "fita-borda")
    .reduce((acc, p) => acc + (p.edgeMeters ?? 0), 0);
  if (edgeMeters > 0) {
    items.push(
      makeItem({
        id: "producao:fita:pvc",
        category: "fitas",
        name: "Fita de borda PVC",
        origin: "Perímetro das peças com fita",
        unit: "m",
        quantityNet: edgeMeters,
        wastePct: waste.fitas,
        unitCost: settings.edgeTapePricePerM,
        priceSource: "Padrão da empresa",
        estimated: true,
      }),
    );
  }

  // ── Ferragens (BOM consolidado) ──
  for (const h of input.hardware) {
    if (h.qty <= 0) continue;
    const category: BudgetCategory = h.kind === "perfil" ? "acabamentos" : "ferragens";
    items.push(
      makeItem({
        id: `producao:ferragem:${h.kind}:${h.brand}:${h.code}`,
        category,
        name: `${h.label}${h.brand ? ` · ${h.brand}` : ""}`,
        origin: h.code ? `Código ${h.code}` : "BOM de ferragens",
        unit: h.unit,
        quantityNet: h.qty,
        wastePct: waste[category],
        unitCost: h.unitPrice > 0 ? h.unitPrice : null,
        priceSource: "Catálogo de ferragens",
      }),
    );
  }

  // ── Pintura/laca sobre frentes ──
  const paintM2 = input.parts
    .filter((p) => p.category === "porta" || p.category === "frente")
    .reduce((acc, p) => acc + p.areaM2 * p.qty, 0);
  if (paintM2 > 0 && settings.paintPricePerM2 > 0) {
    items.push(
      makeItem({
        id: "producao:acabamento:pintura",
        category: "acabamentos",
        name: "Pintura / laca em frentes",
        origin: `${paintM2.toFixed(2)} m² de frentes`,
        unit: "m2",
        quantityNet: paintM2,
        wastePct: waste.acabamentos,
        unitCost: settings.paintPricePerM2,
        priceSource: "Padrão da empresa",
        estimated: true,
      }),
    );
  }

  return items;
}

/** Área total de chapa processada — base do indicador R$/m². */
export function processedAreaM2(parts: readonly QuantifyPart[]): number {
  return parts.filter((p) => p.kind !== "fita-borda").reduce((acc, p) => acc + p.areaM2 * p.qty, 0);
}
