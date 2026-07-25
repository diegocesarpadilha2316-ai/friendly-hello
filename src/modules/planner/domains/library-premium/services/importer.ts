import { parseCSV, parseJSON } from "../../library/services/parser";
import type { LibraryImportReport, PremiumImportFormat } from "../types";

export interface PremiumImportInput {
  readonly format: PremiumImportFormat;
  readonly content: string;
  readonly filename?: string;
}

export async function importPremium(input: PremiumImportInput): Promise<LibraryImportReport> {
  const empty: LibraryImportReport = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [],
    materials: [],
    hardware: [],
  };
  switch (input.format) {
    case "csv":
    case "excel": {
      const rows = parseCSV(input.content);
      return { ...empty, total: rows.length, valid: rows.length };
    }
    case "json": {
      const data = parseJSON<{ materials?: unknown[]; hardware?: unknown[] }>(input.content);
      const mats = Array.isArray(data?.materials) ? data!.materials!.length : 0;
      const hws = Array.isArray(data?.hardware) ? data!.hardware!.length : 0;
      return { ...empty, total: mats + hws, valid: mats + hws };
    }
    case "xml":
    case "zip":
    case "promob":
    case "sketchup":
    case "custom":
      return { ...empty, errors: [`Formato ${input.format} preparado — parser ainda não conectado.`] };
  }
}