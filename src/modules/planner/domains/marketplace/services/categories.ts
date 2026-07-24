/** Fase 3.25 — Categorias oficiais do Marketplace. */
import type { MarketplaceCategoryId } from "../types";

export interface MarketplaceCategory {
  readonly id: MarketplaceCategoryId;
  readonly label: string;
  readonly description: string;
}

export const MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
  { id: "cozinhas", label: "Cozinhas", description: "Módulos e ilhas para cozinhas" },
  { id: "dormitorios", label: "Dormitórios", description: "Roupeiros e camas planejadas" },
  { id: "closets", label: "Closets", description: "Sistemas de closet modulares" },
  { id: "banheiros", label: "Banheiros", description: "Gabinetes e nichos para banho" },
  { id: "escritorios", label: "Escritórios", description: "Home office e corporativo" },
  { id: "lavanderias", label: "Lavanderias", description: "Áreas de serviço planejadas" },
  { id: "salas", label: "Salas", description: "Estantes, painéis e racks" },
  { id: "paineis", label: "Painéis", description: "Painéis ripados e decorativos" },
  { id: "portas", label: "Portas", description: "Portas e frentes especiais" },
  { id: "gavetas", label: "Gavetas", description: "Gavetas e gaveteiros" },
  { id: "ferragens", label: "Ferragens", description: "Dobradiças, corrediças, puxadores" },
  { id: "perfis", label: "Perfis", description: "Perfis, golas e cantoneiras" },
  { id: "iluminacao", label: "Iluminação", description: "LEDs, spots e sensores" },
  { id: "vidros", label: "Vidros", description: "Vidros técnicos e decorativos" },
  { id: "espelhos", label: "Espelhos", description: "Espelhos técnicos" },
  { id: "decoracao", label: "Decoração", description: "Objetos decorativos" },
  { id: "objetos", label: "Objetos", description: "Utilitários e adornos" },
  { id: "ambientes", label: "Ambientes completos", description: "Combos e setups prontos" },
];

export function listCategories(): readonly MarketplaceCategory[] {
  return MARKETPLACE_CATEGORIES;
}
