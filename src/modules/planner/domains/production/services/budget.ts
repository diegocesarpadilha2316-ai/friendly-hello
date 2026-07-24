import type { CompanyManufacturingRules } from "@/modules/planner/shared/engineering/types";
import type {
  Budget,
  BudgetLine,
  CuttingPlan,
  HardwareBomRow,
  ProductionPart,
  TimeBreakdown,
} from "../types";

const DEFAULT_BOARD_PRICE = 480;
const EDGE_TAPE_PRICE_M = 3.2;
const PAINT_PRICE_M2 = 78;
const DELIVERY_FLAT = 480;

export interface BudgetInput {
  parts: readonly ProductionPart[];
  hardware: readonly HardwareBomRow[];
  cuttingPlan: CuttingPlan;
  time: TimeBreakdown;
  rules: CompanyManufacturingRules;
  overrides?: Partial<Budget["parameters"]>;
}

export function buildBudget(input: BudgetInput): Budget {
  const params: Budget["parameters"] = {
    overheadPct: 8,
    marginPct: 22,
    taxPct: 8.5,
    laborRatePerHour: 62,
    deliveryFlat: DELIVERY_FLAT,
    ...input.overrides,
  };

  const edgeMeters = input.parts
    .filter((p) => p.kind === "fita-borda")
    .reduce((acc, p) => acc + (p.edgeMeters ?? 0), 0);
  const paintM2 = input.parts
    .filter((p) => p.category === "porta" || p.category === "frente")
    .reduce((acc, p) => acc + p.areaM2 * p.qty, 0);

  const boardsTotal = input.cuttingPlan.totals.boardsCount * DEFAULT_BOARD_PRICE;
  const hardwareTotal = input.hardware.reduce((acc, h) => acc + h.total, 0);
  const laborTotal = input.time.totalH * params.laborRatePerHour;
  const paintTotal = paintM2 * PAINT_PRICE_M2;
  const edgeTotal = edgeMeters * EDGE_TAPE_PRICE_M;
  const assemblyTotal = Math.round(input.time.assemblyH * params.laborRatePerHour * 0.7);

  const lines: BudgetLine[] = [
    { id: "mat-chapa", group: "materiais", label: `Chapas (${input.cuttingPlan.totals.boardsCount} un.)`, qty: input.cuttingPlan.totals.boardsCount, unit: "chapa", unitPrice: DEFAULT_BOARD_PRICE, total: boardsTotal },
    { id: "mat-fita", group: "materiais", label: "Fita de borda", qty: Math.round(edgeMeters), unit: "m", unitPrice: EDGE_TAPE_PRICE_M, total: Math.round(edgeTotal * 100) / 100 },
    { id: "fer-total", group: "ferragens", label: "Ferragens (consolidadas)", qty: 1, unit: "kit", unitPrice: hardwareTotal, total: Math.round(hardwareTotal * 100) / 100 },
    { id: "mo-marc", group: "mao-obra", label: "Marcenaria (h)", qty: Math.round(input.time.totalH * 10) / 10, unit: "h", unitPrice: params.laborRatePerHour, total: Math.round(laborTotal * 100) / 100 },
    { id: "pintura", group: "pintura", label: `Pintura/laca ${paintM2.toFixed(1)} m²`, qty: Math.round(paintM2 * 10) / 10, unit: "m²", unitPrice: PAINT_PRICE_M2, total: Math.round(paintTotal * 100) / 100 },
    { id: "montagem", group: "montagem", label: "Montagem no local", qty: 1, unit: "verba", unitPrice: assemblyTotal, total: assemblyTotal },
    { id: "entrega", group: "entrega", label: "Frete + entrega", qty: 1, unit: "verba", unitPrice: params.deliveryFlat, total: params.deliveryFlat },
  ];

  const subtotal = Math.round(lines.reduce((acc, l) => acc + l.total, 0) * 100) / 100;
  const overhead = Math.round(subtotal * (params.overheadPct / 100) * 100) / 100;
  const margin = Math.round((subtotal + overhead) * (params.marginPct / 100) * 100) / 100;
  const taxes = Math.round((subtotal + overhead + margin) * (params.taxPct / 100) * 100) / 100;
  const final = Math.round((subtotal + overhead + margin + taxes) * 100) / 100;
  const totalAreaM2 = input.parts.reduce((acc, p) => acc + p.areaM2 * p.qty, 0);
  const perM2 = totalAreaM2 > 0 ? Math.round((final / totalAreaM2) * 100) / 100 : 0;

  return { lines, summary: { subtotal, overhead, margin, taxes, final, perM2 }, parameters: params };
}