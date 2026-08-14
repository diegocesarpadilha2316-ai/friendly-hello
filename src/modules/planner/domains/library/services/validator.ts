import type { LibraryHardware, LibraryMaterial } from "../types";

export interface ValidationResult<T> {
  readonly valid: T | null;
  readonly errors: readonly string[];
}

export function validateMaterialRow(
  row: Record<string, unknown>,
  line: number,
): ValidationResult<LibraryMaterial> {
  const errors: string[] = [];
  const id = String(row.id ?? row.codigo ?? "").trim();
  const manufacturer = String(row.fabricante ?? row.marca ?? "").trim();
  const category = String(row.categoria ?? "chapa").trim();
  const thickness = Number(row.espessura_mm ?? row.espessura ?? 0);
  if (!id) errors.push(`linha ${line}: codigo ausente`);
  if (!manufacturer) errors.push(`linha ${line}: fabricante ausente`);
  if (!category) errors.push(`linha ${line}: categoria ausente`);
  if (!Number.isFinite(thickness) || thickness <= 0)
    errors.push(`linha ${line}: espessura invalida`);
  if (errors.length) return { valid: null, errors };
  const price = Number(row.preco_m2 ?? row.preco ?? 0);
  const g = String(row.sentido_veio ?? "")
    .trim()
    .toLowerCase();
  const grain: LibraryMaterial["grain"] =
    g === "vertical" || g === "horizontal" || g === "livre" ? g : null;
  const mat: LibraryMaterial = {
    id,
    name: String(row.nome ?? row.padrao ?? id).trim(),
    manufacturer,
    line: (row.linha as string | null) ?? null,
    category,
    pattern: (row.padrao as string | null) ?? null,
    colorName: (row.cor_nome as string | null) ?? null,
    colorHex: (row.cor_hex as string | null) ?? null,
    textureUrl: (row.textura_url as string | null) ?? null,
    thicknessMm: thickness,
    widthMm: Number.isFinite(Number(row.largura_mm)) ? Number(row.largura_mm) : null,
    lengthMm: Number.isFinite(Number(row.comprimento_mm)) ? Number(row.comprimento_mm) : null,
    grain,
    pricePerM2: Number.isFinite(price) && price > 0 ? price : null,
  };
  return { valid: mat, errors: [] };
}

export function validateHardwareRow(
  row: Record<string, unknown>,
  line: number,
): ValidationResult<LibraryHardware> {
  const errors: string[] = [];
  const id = String(row.id ?? row.codigo ?? "").trim();
  const manufacturer = String(row.fabricante ?? row.marca ?? "").trim();
  const category = String(row.categoria ?? "").trim();
  const model = String(row.modelo ?? row.nome ?? "").trim();
  if (!id) errors.push(`linha ${line}: codigo ausente`);
  if (!manufacturer) errors.push(`linha ${line}: fabricante ausente`);
  if (!category) errors.push(`linha ${line}: categoria ausente`);
  if (!model) errors.push(`linha ${line}: modelo ausente`);
  if (errors.length) return { valid: null, errors };
  const price = Number(row.preco_unitario ?? row.preco ?? 0);
  const hw: LibraryHardware = {
    id,
    manufacturer,
    brand: String(row.marca ?? manufacturer),
    category,
    model,
    description: (row.descricao as string | null) ?? null,
    imageUrl: (row.imagem_url as string | null) ?? null,
    unitPrice: Number.isFinite(price) && price > 0 ? price : null,
    cncParams: (row.parametros_cnc as Record<string, unknown> | undefined) ?? {},
    drillDiameterMm: Number.isFinite(Number(row.furacao)) ? Number(row.furacao) : null,
    drillDepthMm: Number.isFinite(Number(row.profundidade)) ? Number(row.profundidade) : null,
    clearanceMm: Number.isFinite(Number(row.folga)) ? Number(row.folga) : null,
  };
  return { valid: hw, errors: [] };
}
