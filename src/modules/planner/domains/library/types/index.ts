/**
 * Fase 3.26 — Tipos da Biblioteca Oficial Dioris.
 *
 * Reutilizam a bridge Supabase existente (`catalog/services/library-supabase`)
 * como fonte única de verdade — não criam novos providers/stores.
 */
import type { LibraryMaterial } from "../../catalog/services/library-supabase";

export type { LibraryMaterial };

export interface LibraryHardware {
  readonly id: string;
  readonly manufacturer: string;
  readonly brand: string;
  readonly category: string;      // Dobradiça, Corrediça, Puxador, LED, Perfil, Vidro, Espelho...
  readonly model: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly unitPrice: number | null;
  readonly cncParams: Readonly<Record<string, unknown>>;
  readonly drillDiameterMm: number | null;
  readonly drillDepthMm: number | null;
  readonly clearanceMm: number | null;
}

export interface LibraryPBRMaps {
  readonly albedo: string | null;
  readonly normal: string | null;
  readonly roughness: string | null;
  readonly ao: string | null;
  readonly metallic: string | null;
  readonly displacement: string | null;
  readonly opacity: string | null;
  readonly emission: string | null;
}

export interface LibrarySearchFilters {
  readonly query?: string;
  readonly manufacturer?: string;
  readonly category?: string;
  readonly material?: string;
  readonly thicknessMm?: number;
  readonly finish?: string;
  readonly line?: string;
  readonly color?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly limit?: number;
}

export type LibraryExportFormat = "json" | "csv" | "xml" | "excel" | "bom";

export interface LibraryImportReport {
  readonly total: number;
  readonly valid: number;
  readonly invalid: number;
  readonly errors: readonly string[];
  readonly materials: readonly LibraryMaterial[];
  readonly hardware: readonly LibraryHardware[];
}
