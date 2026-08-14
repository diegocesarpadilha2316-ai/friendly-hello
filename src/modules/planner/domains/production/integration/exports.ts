/**
 * Fase 3.32 — Catálogo e serializadores de exportação industrial.
 */
import type { FinalExportFormat, FinalExportSpec, IndustrialBundle } from "./types";

export const FINAL_EXPORTS: readonly FinalExportSpec[] = [
  {
    format: "manifesto-cnc",
    label: "Manifesto CNC",
    description: "Índice de todos os programas gerados",
    extension: "csv",
    mime: "text/csv",
    target: "cnc",
  },
  {
    format: "relatorio-industrial-pdf",
    label: "Relatório Industrial",
    description: "Resumo executivo · KPIs · custos · entrega",
    extension: "txt",
    mime: "text/plain",
    target: "escritorio",
  },
  {
    format: "plano-corte-csv",
    label: "Plano de Corte (CSV)",
    description: "Chapas · peças · aproveitamento",
    extension: "csv",
    mime: "text/csv",
    target: "producao",
  },
  {
    format: "plano-corte-dxf",
    label: "Plano de Corte (DXF)",
    description: "Contornos das peças por chapa",
    extension: "dxf",
    mime: "application/dxf",
    target: "producao",
  },
  {
    format: "mrp-xlsx",
    label: "MRP (CSV)",
    description: "Materiais, ferragens e custos",
    extension: "csv",
    mime: "text/csv",
    target: "escritorio",
  },
  {
    format: "cnc-lote-zip",
    label: "CNC · lote de programas",
    description: "Concatenado texto — todos os formatos",
    extension: "txt",
    mime: "text/plain",
    target: "cnc",
  },
  {
    format: "kpis-json",
    label: "KPIs (JSON)",
    description: "Snapshot completo dos indicadores",
    extension: "json",
    mime: "application/json",
    target: "logistica",
  },
];

export function serializeExport(format: FinalExportFormat, b: IndustrialBundle): string {
  switch (format) {
    case "manifesto-cnc": {
      const rows = ["machine;format;part;operations;time_min"];
      for (const e of b.cnc.entries)
        for (const p of e.programs) {
          rows.push(
            [e.machineLabel, e.format, p.partCode, p.operations.length, p.estimatedMin].join(";"),
          );
        }
      return rows.join("\n");
    }
    case "relatorio-industrial-pdf": {
      const lines = [
        `Dioris — Relatório Industrial (Fase 3.32)`,
        `Projeto: ${b.projectName} · Cliente: ${b.clientName}`,
        `Gerado: ${new Date(b.generatedAt).toLocaleString("pt-BR")}`,
        ``,
        `Peças: ${b.production.totals.parts} · Módulos: ${b.production.totals.modules}`,
        `Chapas: ${b.nesting?.best.statistics.boardsCount ?? b.production.cuttingPlan.totals.boardsCount}`,
        `Aproveitamento: ${((b.nesting?.best.statistics.avgUsageRatio ?? b.production.cuttingPlan.totals.avgUsageRatio) * 100).toFixed(1)}%`,
        `Algoritmo vencedor: ${b.nesting?.winnerAlgorithm ?? "—"}`,
        `Programas CNC: ${b.cnc.totalPrograms} (${b.cnc.totalMinutes} min)`,
        `Materiais (MRP): ${b.mrp.totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        `Receita: ${(b.cost?.final ?? b.production.budget.summary.final).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        `Margem: ${(b.cost?.marginPct ?? b.production.budget.parameters.marginPct).toFixed(1)}%`,
        b.factoryDelivery
          ? `Entrega: ${new Date(b.factoryDelivery.finishDate).toLocaleDateString("pt-BR")} (${b.factoryDelivery.effectiveDays}d)`
          : "",
        b.balance
          ? `Gargalo: ${b.balance.bottleneckLabel} · estágio ${b.balance.bottleneckStage}`
          : "",
      ].filter(Boolean);
      return lines.join("\n");
    }
    case "plano-corte-csv": {
      const rows = ["board;material;length;width;usage;waste_m2"];
      const boards = b.nesting?.best.boards ?? [];
      for (const bd of boards) {
        rows.push(
          [
            bd.index,
            bd.spec.material,
            bd.spec.lengthMm,
            bd.spec.widthMm,
            (bd.usageRatio * 100).toFixed(1) + "%",
            bd.wasteM2.toFixed(2),
          ].join(";"),
        );
      }
      return rows.join("\n");
    }
    case "plano-corte-dxf": {
      const boards = b.nesting?.best.boards ?? [];
      const entities: string[] = [];
      for (const bd of boards)
        for (const pl of bd.placements) {
          entities.push(
            "0",
            "LWPOLYLINE",
            "8",
            `BOARD_${bd.index}`,
            "90",
            "4",
            "70",
            "1",
            "10",
            String(pl.x),
            "20",
            String(pl.y),
            "10",
            String(pl.x + pl.w),
            "20",
            String(pl.y),
            "10",
            String(pl.x + pl.w),
            "20",
            String(pl.y + pl.h),
            "10",
            String(pl.x),
            "20",
            String(pl.y + pl.h),
          );
        }
      return ["0", "SECTION", "2", "ENTITIES", ...entities, "0", "ENDSEC", "0", "EOF"].join("\n");
    }
    case "mrp-xlsx": {
      const rows = ["code;label;category;qty;unit;unit_price;total"];
      for (const it of b.mrp.items) {
        rows.push(
          [it.code, it.label, it.category, it.qty, it.unit, it.unitPrice, it.total].join(";"),
        );
      }
      return rows.join("\n");
    }
    case "cnc-lote-zip": {
      const chunks: string[] = [];
      for (const e of b.cnc.entries)
        for (const p of e.programs) {
          chunks.push(`; === ${e.machineLabel} · ${e.format.toUpperCase()} · ${p.partCode} ===`);
          chunks.push(p.code);
          chunks.push("");
        }
      return chunks.join("\n");
    }
    case "kpis-json":
      return JSON.stringify(
        { generatedAt: b.generatedAt, projectName: b.projectName, kpis: b.kpis },
        null,
        2,
      );
  }
}

export function downloadBundle(format: FinalExportFormat, b: IndustrialBundle): void {
  if (typeof window === "undefined") return;
  const spec = FINAL_EXPORTS.find((s) => s.format === format);
  if (!spec) return;
  const content = serializeExport(format, b);
  const blob = new Blob([content], { type: spec.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dioris-${format}-${b.projectName.replace(/\s+/g, "-").toLowerCase()}.${spec.extension}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
