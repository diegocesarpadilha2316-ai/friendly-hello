/**
 * Fase 3.24 — Regras de validação paramétrica (informativas).
 */
import type { CatalogItem, CatalogRule, CatalogVariant } from "./types";

export const CATALOG_RULES: readonly CatalogRule[] = [
  {
    id: "rule-porta-max-largura",
    when: (item, v) => item.category === "porta" && v.widthMm > 600,
    message: "Portas com largura acima de 600mm exigem dupla dobradiça e reforço.",
    severity: "warn",
  },
  {
    id: "rule-armario-min-altura",
    when: (item, v) => item.category === "armario" && v.heightMm < 400,
    message: "Altura mínima recomendada para armários é 400mm.",
    severity: "warn",
  },
  {
    id: "rule-gaveta-max-largura",
    when: (item, v) => item.category === "gaveta" && v.widthMm > 1200,
    message: "Gavetas acima de 1200mm exigem corrediças de alta capacidade.",
    severity: "warn",
  },
  {
    id: "rule-vidro-min-espessura",
    when: (item, v) => item.category === "vidro" && v.depthMm < 6,
    message: "Vidros abaixo de 6mm não são recomendados para portas.",
    severity: "error",
  },
];

export function evaluateRules(item: CatalogItem, variant: CatalogVariant): readonly CatalogRule[] {
  return CATALOG_RULES.filter((r) => r.when(item, variant));
}
