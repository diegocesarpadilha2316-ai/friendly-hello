/**
 * Fase 3.24 — Modos de preview do catálogo.
 */
import type { CatalogPreviewMode } from "./types";

export const CATALOG_PREVIEW_MODES: readonly CatalogPreviewMode[] = [
  { id: "2d",        label: "2D" },
  { id: "3d",        label: "3D" },
  { id: "explodido", label: "Explodido" },
  { id: "estrutura", label: "Estrutura" },
  { id: "producao",  label: "Produção" },
];

export function previewLabel(id: CatalogPreviewMode["id"]): string {
  return CATALOG_PREVIEW_MODES.find((m) => m.id === id)?.label ?? "2D";
}