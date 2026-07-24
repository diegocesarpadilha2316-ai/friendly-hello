/**
 * Fase 3.24 — Catálogo mestre de itens paramétricos Dioris.
 * Fonte determinística, imutável. Nenhum store novo.
 */
import type { CatalogItem } from "./types";

function base(id: string, name: string, category: CatalogItem["category"], defaults: CatalogItem["defaults"], overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    sku: `DR-${id.toUpperCase()}`,
    name,
    description: name,
    category,
    subcategory: category,
    manufacturer: "dioris",
    tags: [category],
    parametric: {
      widthMm: { min: 300, max: 1200, step: 10 },
      heightMm: { min: 200, max: 2400, step: 10 },
      depthMm: { min: 200, max: 700, step: 10 },
      thicknessMm: [15, 18, 25],
      shelves: { min: 0, max: 6 },
      doors: [0, 1, 2, 3, 4],
      drawers: [0, 1, 2, 3, 4, 5, 6],
      withLed: true,
      withGlass: true,
      withMirror: true,
    },
    defaults,
    basePrice: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export const CATALOG_ITEMS: readonly CatalogItem[] = [
  base("armario-2p", "Armário 2 portas", "armario", { widthMm: 800, heightMm: 720, depthMm: 350, thicknessMm: 18, materialId: "mat-mdf-18-carvalho", handleId: "handle-alca-160", hingeId: "hinge-blum-clip-110" }, { basePrice: 1280, tags: ["armario", "cozinha", "sala"] }),
  base("armario-3p", "Armário 3 portas", "armario", { widthMm: 1200, heightMm: 720, depthMm: 350, thicknessMm: 18, materialId: "mat-mdf-18-carvalho", handleId: "handle-alca-160" }, { basePrice: 1780 }),
  base("balcao-2p-2g", "Balcão 2P/2G", "balcao", { widthMm: 900, heightMm: 720, depthMm: 550, thicknessMm: 18, materialId: "mat-mdf-18-carvalho", handleId: "handle-alca-160", slideId: "slide-blum-tandembox-500" }, { basePrice: 2380, tags: ["balcao", "cozinha"] }),
  base("aereo-2p", "Aéreo 2 portas", "aereo", { widthMm: 800, heightMm: 700, depthMm: 320, thicknessMm: 18, materialId: "mat-mdf-15-branco", handleId: "handle-alca-96" }, { basePrice: 980 }),
  base("torre-forno", "Torre Forno + Micro", "torre", { widthMm: 600, heightMm: 2200, depthMm: 570, thicknessMm: 18, materialId: "mat-mdf-18-preto-supremo" }, { basePrice: 3480 }),
  base("closet-modulo", "Closet Módulo Central", "closet", { widthMm: 1000, heightMm: 2400, depthMm: 550, thicknessMm: 18, materialId: "mat-mdf-18-carvalho" }, { basePrice: 4280 }),
  base("painel-ripado", "Painel Ripado", "painel", { widthMm: 1200, heightMm: 2400, depthMm: 30, thicknessMm: 18, materialId: "mat-macico-freijo" }, { basePrice: 1980 }),
  base("nicho-vertical", "Nicho Vertical", "nicho", { widthMm: 400, heightMm: 800, depthMm: 300, thicknessMm: 18, materialId: "mat-mdf-18-off-white" }, { basePrice: 620 }),
  base("cristaleira-2p", "Cristaleira 2P Vidro", "cristaleira", { widthMm: 1000, heightMm: 1600, depthMm: 380, thicknessMm: 18, materialId: "mat-mdf-18-carvalho" }, { basePrice: 2680, tags: ["vidro"] }),
  base("tampo-cozinha", "Tampo Cozinha 40mm", "tampo", { widthMm: 2500, heightMm: 40, depthMm: 600, thicknessMm: 40, materialId: "mat-macico-freijo" }, { basePrice: 1980 }),
  base("ilha-central", "Ilha Central", "ilha", { widthMm: 2000, heightMm: 900, depthMm: 900, thicknessMm: 18, materialId: "mat-mdf-18-preto-supremo" }, { basePrice: 5680 }),
  base("prateleira-simples", "Prateleira Simples", "prateleira", { widthMm: 800, heightMm: 25, depthMm: 300, thicknessMm: 25, materialId: "mat-macico-freijo" }, { basePrice: 320 }),
  base("porta-lisa", "Porta Lisa", "porta", { widthMm: 400, heightMm: 720, depthMm: 18, thicknessMm: 18, materialId: "mat-mdf-18-carvalho", handleId: "handle-alca-160", hingeId: "hinge-blum-clip-110" }, { basePrice: 220 }),
  base("gaveta-media", "Gaveta Média", "gaveta", { widthMm: 800, heightMm: 200, depthMm: 500, thicknessMm: 15, materialId: "mat-mdf-15-branco", slideId: "slide-blum-tandembox-500" }, { basePrice: 460 }),
  base("divisoria-modulo", "Divisória Módulo", "divisoria", { widthMm: 600, heightMm: 2400, depthMm: 40, thicknessMm: 18, materialId: "mat-mdf-18-off-white" }, { basePrice: 780 }),
  base("led-perfil-lin", "LED Perfil Linear", "led", { widthMm: 2000, heightMm: 20, depthMm: 20, thicknessMm: 0 }, { basePrice: 240 }),
  base("perfil-gola", "Perfil Gola Horizontal", "perfil", { widthMm: 3000, heightMm: 40, depthMm: 40, thicknessMm: 0 }, { basePrice: 180 }),
  base("vidro-porta", "Vidro Porta Cristaleira", "vidro", { widthMm: 400, heightMm: 720, depthMm: 6, thicknessMm: 6 }, { basePrice: 220 }),
  base("espelho-porta", "Espelho de Porta", "espelho", { widthMm: 400, heightMm: 1600, depthMm: 4, thicknessMm: 4 }, { basePrice: 320 }),
  base("rodape-100", "Rodapé 100mm", "rodape", { widthMm: 2400, heightMm: 100, depthMm: 15, thicknessMm: 15 }, { basePrice: 96 }),
  base("pe-regulavel", "Pé Regulável 100mm", "pe", { widthMm: 40, heightMm: 100, depthMm: 40, thicknessMm: 0 }, { basePrice: 12 }),
  base("acc-porta-talheres", "Acessório Porta-Talheres", "acessorio", { widthMm: 800, heightMm: 50, depthMm: 500, thicknessMm: 0 }, { basePrice: 320 }),
];

export function listItems(): readonly CatalogItem[] {
  return CATALOG_ITEMS;
}

export function getItem(id: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find((i) => i.id === id);
}

export function itemsByCategory(category: CatalogItem["category"]): readonly CatalogItem[] {
  return CATALOG_ITEMS.filter((i) => i.category === category);
}