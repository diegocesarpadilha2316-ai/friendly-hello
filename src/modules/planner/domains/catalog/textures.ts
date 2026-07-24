/**
 * Fase 3.24 — Texturas PBR associadas aos materiais.
 */
import type { CatalogTexture } from "./types";

export const CATALOG_TEXTURES: readonly CatalogTexture[] = [
  { id: "tex-carvalho-nature", name: "Carvalho Nature", materialId: "mat-mdf-18-carvalho", albedo: "textures/carvalho-nature.jpg", normal: "textures/carvalho-nature-n.jpg", roughness: "textures/carvalho-nature-r.jpg", tileMm: [1200, 300] },
  { id: "tex-nogueira", name: "Nogueira", materialId: "mat-mdf-18-nogueira", albedo: "textures/nogueira.jpg", normal: "textures/nogueira-n.jpg", tileMm: [1200, 300] },
  { id: "tex-branco-tx", name: "Branco Texturizado", materialId: "mat-mdf-15-branco", albedo: "textures/branco-tx.jpg", tileMm: [600, 600] },
  { id: "tex-cinza-antracite", name: "Cinza Antracite", materialId: "mat-mdp-15-cinza", albedo: "textures/cinza-antracite.jpg", tileMm: [600, 600] },
  { id: "tex-preto-supremo", name: "Preto Supremo", materialId: "mat-mdf-18-preto-supremo", albedo: "textures/preto-supremo.jpg", tileMm: [800, 800] },
  { id: "tex-freijo", name: "Freijó", materialId: "mat-macico-freijo", albedo: "textures/freijo.jpg", normal: "textures/freijo-n.jpg", tileMm: [1500, 300] },
];

export function listTextures(): readonly CatalogTexture[] {
  return CATALOG_TEXTURES;
}

export function texturesFor(materialId: string): readonly CatalogTexture[] {
  return CATALOG_TEXTURES.filter((t) => t.materialId === materialId);
}