import type { FabricationExportSpec } from "./types";

export const FABRICATION_EXPORTS: readonly FabricationExportSpec[] = [
  { format: "pdf-plano", label: "PDF · Plano de Corte", description: "Desenho profissional das chapas com numeração, veio e ordem.", extension: "pdf", mime: "application/pdf", target: "escritorio" },
  { format: "pdf-etiquetas", label: "PDF · Etiquetas", description: "Folha A4 com QR Code e dados de cada peça.", extension: "pdf", mime: "application/pdf", target: "producao" },
  { format: "dxf-plano", label: "DXF · Plano", description: "Desenho vetorial das chapas para AutoCAD/CAM.", extension: "dxf", mime: "application/dxf", target: "cnc" },
  { format: "gcode-lote", label: "G-Code · Lote", description: "Bundle G-Code de todas as peças (router/nesting).", extension: "gcode", mime: "text/plain", target: "cnc" },
  { format: "nc-lote", label: "NC · Lote", description: "Arquivo NC compatível com controles industriais.", extension: "nc", mime: "text/plain", target: "cnc" },
  { format: "bpp-lote", label: "BPP · Lote", description: "Programa Homag BPP para centro de usinagem.", extension: "bpp", mime: "text/plain", target: "cnc" },
  { format: "csv-corte", label: "CSV · Lista de Corte", description: "Planilha plana para importação em ERP/CAM.", extension: "csv", mime: "text/csv", target: "escritorio" },
  { format: "xlsx-fabricacao", label: "XLSX · Fabricação", description: "Planilha completa (peças, corte, ferragens, orçamento).", extension: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", target: "escritorio" },
];