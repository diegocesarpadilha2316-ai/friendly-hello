import { parseCsv, parseJson } from "../../library/services/parser";
import type { LibraryImportReport, PremiumImportFormat } from "../types";

export interface PremiumImportInput {
  readonly format: PremiumImportFormat;
  readonly content: string;
  readonly filename?: string;
}

export async function importPremium(input: PremiumImportInput): Promise<LibraryImportReport> {
  switch (input.format) {
    case "csv":
    case "excel":
      return parseCsv(input.content);
    case "json":
      return parseJson(input.content);
    case "xml":
    case "zip":
    case "promob":
    case "sketchup":
    case "custom":
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        errors: [`Formato ${input.format} preparado — parser ainda não conectado.`],
        materials: [],
        hardware: [],
      };
  }
}