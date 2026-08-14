import type { LibraryHardware, LibraryMaterial, LibrarySearchFilters } from "../types";

function norm(v: string | null | undefined): string {
  return (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterMaterials(
  items: readonly LibraryMaterial[],
  f: LibrarySearchFilters,
): readonly LibraryMaterial[] {
  const q = f.query ? norm(f.query) : "";
  const man = f.manufacturer ? norm(f.manufacturer) : "";
  const cat = f.category ? norm(f.category) : "";
  const line = f.line ? norm(f.line) : "";
  const color = f.color ? norm(f.color) : "";
  return items.filter((m) => {
    if (q) {
      const hay = norm(
        `${m.name} ${m.manufacturer} ${m.line ?? ""} ${m.pattern ?? ""} ${m.colorName ?? ""}`,
      );
      if (!hay.includes(q)) return false;
    }
    if (man && !norm(m.manufacturer).includes(man)) return false;
    if (cat && !norm(m.category).includes(cat)) return false;
    if (line && !norm(m.line).includes(line)) return false;
    if (color && !norm(m.colorName).includes(color)) return false;
    if (typeof f.thicknessMm === "number" && Math.abs(m.thicknessMm - f.thicknessMm) > 0.01)
      return false;
    if (typeof f.minPrice === "number" && (m.pricePerM2 ?? 0) < f.minPrice) return false;
    if (typeof f.maxPrice === "number" && (m.pricePerM2 ?? 0) > f.maxPrice) return false;
    return true;
  });
}

export function filterHardware(
  items: readonly LibraryHardware[],
  f: LibrarySearchFilters,
): readonly LibraryHardware[] {
  const q = f.query ? norm(f.query) : "";
  const man = f.manufacturer ? norm(f.manufacturer) : "";
  const cat = f.category ? norm(f.category) : "";
  return items.filter((h) => {
    if (q) {
      const hay = norm(`${h.model} ${h.manufacturer} ${h.category} ${h.description ?? ""}`);
      if (!hay.includes(q)) return false;
    }
    if (man && !norm(h.manufacturer).includes(man)) return false;
    if (cat && !norm(h.category).includes(cat)) return false;
    if (typeof f.minPrice === "number" && (h.unitPrice ?? 0) < f.minPrice) return false;
    if (typeof f.maxPrice === "number" && (h.unitPrice ?? 0) > f.maxPrice) return false;
    return true;
  });
}
