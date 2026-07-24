import type { ProductionExportSpec } from "../types";

export const PRODUCTION_EXPORTS: readonly ProductionExportSpec[] = [
  { format: "pdf", label: "PDF Executivo", description: "Relatório completo com KPIs, lista de corte e plano.", extension: "pdf", mime: "application/pdf" },
  { format: "excel", label: "Excel (XLSX)", description: "Planilha editável com peças, corte, ferragens e orçamento.", extension: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { format: "csv", label: "CSV", description: "Lista de corte plana para importação em ERP/CAM.", extension: "csv", mime: "text/csv" },
  { format: "xml", label: "XML (Cutrite/OptiCut)", description: "Integração com software de otimização de corte.", extension: "xml", mime: "application/xml" },
  { format: "json", label: "JSON API", description: "Payload cru consumido pelo SDK Dioris.", extension: "json", mime: "application/json" },
];

export function serializeCutListCsv(rows: readonly { code: string; name: string; material: string; thicknessMm: number; lengthMm: number; widthMm: number; qty: number; grain: string; edgeTape: string }[]): string {
  const header = "codigo;nome;material;espessura;comprimento;largura;qtd;veio;fita";
  const body = rows
    .map((r) => [r.code, r.name, r.material, r.thicknessMm, r.lengthMm, r.widthMm, r.qty, r.grain, r.edgeTape].join(";"))
    .join("\n");
  return `${header}\n${body}\n`;
}