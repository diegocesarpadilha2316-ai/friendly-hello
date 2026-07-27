/**
 * Módulo 05 — Filtros avançados da Biblioteca.
 *
 * Schema declarativo + função pura `applyFilters()`. O painel de UI apenas
 * lê `deriveOptions()` e emite `LibraryFilterState`.
 */
import type { CatalogItem, CatalogCategoryId } from "./types";
import { bucketsFor } from "./taxonomy";

export interface LibraryFilterState {
  bucketId?: string;
  category?: CatalogCategoryId;
  brand?: string;
  line?: string;
  material?: string;
  color?: string;
  doors?: number;      // 1..6, 0 = sem porta
  drawers?: number;    // 1..8
  minWidth?: number;   // mm
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minDepth?: number;
  maxDepth?: number;
}

function countIn(s: string, kw: string): number {
  const rx = new RegExp(`(\\d+)\\s*${kw}`);
  const m = s.toLowerCase().match(rx);
  return m ? Number(m[1]) : 0;
}

export function itemDoors(item: CatalogItem): number {
  return countIn(item.name, "porta");
}
export function itemDrawers(item: CatalogItem): number {
  return countIn(item.name, "gavet");
}

export function applyFilters(items: readonly CatalogItem[], f: LibraryFilterState): readonly CatalogItem[] {
  return items.filter((i) => {
    if (f.bucketId && !bucketsFor(i).includes(f.bucketId)) return false;
    if (f.category && i.category !== f.category) return false;
    if (f.brand && i.brand !== f.brand) return false;
    if (f.line && i.line !== f.line) return false;
    if (f.material && i.material !== f.material) return false;
    if (f.color && i.color !== f.color) return false;
    if (typeof f.doors === "number" && itemDoors(i) !== f.doors) return false;
    if (typeof f.drawers === "number" && itemDrawers(i) !== f.drawers) return false;
    const w = i.parametric.defaults.width;
    const h = i.parametric.defaults.height;
    const d = i.parametric.defaults.depth;
    if (f.minWidth != null && w < f.minWidth) return false;
    if (f.maxWidth != null && w > f.maxWidth) return false;
    if (f.minHeight != null && h < f.minHeight) return false;
    if (f.maxHeight != null && h > f.maxHeight) return false;
    if (f.minDepth != null && d < f.minDepth) return false;
    if (f.maxDepth != null && d > f.maxDepth) return false;
    return true;
  });
}

export interface FilterOptions {
  brands: readonly string[];
  lines: readonly string[];
  materials: readonly string[];
  colors: readonly string[];
}

export function deriveOptions(items: readonly CatalogItem[]): FilterOptions {
  const set = <T,>(arr: (T | undefined | null)[]) =>
    [...new Set(arr.filter((x): x is T => x != null && x !== ""))].sort() as readonly T[];
  return {
    brands: set(items.map((i) => i.brand)) as readonly string[],
    lines: set(items.map((i) => i.line)) as readonly string[],
    materials: set(items.map((i) => i.material)) as readonly string[],
    colors: set(items.map((i) => i.color)) as readonly string[],
  };
}

export function hasActiveFilters(f: LibraryFilterState): boolean {
  return Object.values(f).some((v) => v !== undefined && v !== "" && v !== null);
}