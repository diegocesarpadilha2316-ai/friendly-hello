import { searchLibraryMaterials } from "../../catalog/services/library-supabase";
import { searchHardware } from "./hardware-supabase";
import type { LibraryHardware, LibraryMaterial } from "../types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function parseThickness(hint: string): number | null {
  const m = /(\d{1,3})\s*mm?/i.exec(hint);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
export async function findMaterialByHint(hint: string): Promise<LibraryMaterial | null> {
  const q = normalize(hint);
  if (!q) return null;
  const thickness = parseThickness(hint);
  const cleaned = q.replace(/\bmdf\b|\bmdp\b|\bhdf\b|\d+\s*mm?/gi, "").trim();
  const results = await searchLibraryMaterials({ query: cleaned || q, limit: 20 });
  const filtered = thickness
    ? results.filter((m) => Math.abs(m.thicknessMm - thickness) < 0.5)
    : results;
  return filtered[0] ?? results[0] ?? null;
}
export async function findHardwareByHint(hint: string): Promise<LibraryHardware | null> {
  const q = normalize(hint);
  if (!q) return null;
  const results = await searchHardware({ query: q, limit: 20 });
  return results[0] ?? null;
}
export async function findManyMaterials(
  hint: string,
  limit = 12,
): Promise<readonly LibraryMaterial[]> {
  return searchLibraryMaterials({ query: normalize(hint), limit });
}
export async function findManyHardware(
  hint: string,
  limit = 12,
): Promise<readonly LibraryHardware[]> {
  return searchHardware({ query: normalize(hint), limit });
}
