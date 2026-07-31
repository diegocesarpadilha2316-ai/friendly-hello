/**
 * PRESETS INTERNOS — receitas prontas consumidas pelo Layout Engine.
 * Novos presets são apenas dados; nenhum motor precisa mudar.
 */
import type { LayoutRecipe } from "./layout-engine";
import type { InteriorCavity, InteriorFamilyId } from "./types";

export const INTERIOR_PRESETS: readonly LayoutRecipe[] = [
  {
    id: "roupeiro-casal",
    label: "Roupeiro casal",
    families: ["roupeiro", "closet"],
    dividers: true,
    columns: [
      {
        label: "Cabideiro longo",
        flex: 1.2,
        bands: [
          { module: "sapateira", heightMm: 200, repeat: 2, role: "Sapateira" },
          { module: "cabideiro", flex: 1, role: "Cabideiro longo" },
          { module: "maleiro", heightMm: 400, role: "Maleiro" },
        ],
      },
      {
        label: "Gavetas + cabideiro curto",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 200, repeat: 3, role: "Gaveta" },
          { module: "cabideiro", flex: 1, role: "Cabideiro curto" },
          { module: "maleiro", heightMm: 400, role: "Maleiro" },
        ],
      },
      {
        label: "Prateleiras",
        flex: 1,
        bands: [
          { module: "cesto-aramado", heightMm: 200, repeat: 2, role: "Cesto" },
          { module: "prateleira", flex: 1, repeat: 4, role: "Prateleira" },
          { module: "maleiro", heightMm: 400, role: "Maleiro" },
        ],
      },
    ],
  },
  {
    id: "roupeiro-solteiro",
    label: "Roupeiro solteiro",
    families: ["roupeiro"],
    dividers: true,
    columns: [
      {
        label: "Cabideiro",
        flex: 1,
        bands: [
          { module: "sapateira", heightMm: 200, role: "Sapateira" },
          { module: "cabideiro", flex: 1, role: "Cabideiro" },
          { module: "maleiro", heightMm: 350, role: "Maleiro" },
        ],
      },
      {
        label: "Prateleiras e gavetas",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 200, repeat: 2, role: "Gaveta" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
          { module: "maleiro", heightMm: 350, role: "Maleiro" },
        ],
      },
    ],
  },
  {
    id: "closet",
    label: "Closet",
    families: ["closet", "roupeiro"],
    dividers: true,
    columns: [
      {
        label: "Penduráveis longos",
        flex: 1,
        bands: [
          { module: "sapateira", heightMm: 200, repeat: 2, role: "Sapateira" },
          { module: "cabideiro", flex: 1, role: "Cabideiro longo" },
        ],
      },
      {
        label: "Organização",
        flex: 1,
        bands: [
          { module: "porta-joias", heightMm: 90, role: "Porta-joias" },
          { module: "gaveta-interna", heightMm: 180, repeat: 2, role: "Gaveta" },
          { module: "calceiro", heightMm: 700, role: "Calceiro" },
          { module: "prateleira", flex: 1, repeat: 2, role: "Prateleira" },
        ],
      },
      {
        label: "Acessórios",
        flex: 0.8,
        bands: [
          { module: "porta-gravatas", heightMm: 150, role: "Porta-gravatas" },
          { module: "porta-cintos", heightMm: 150, role: "Porta-cintos" },
          { module: "nicho", flex: 1, repeat: 3, role: "Nicho" },
        ],
      },
    ],
  },
  {
    id: "infantil",
    label: "Roupeiro infantil",
    families: ["roupeiro", "closet"],
    dividers: true,
    columns: [
      {
        label: "Brinquedos e roupas",
        flex: 1,
        bands: [
          { module: "cesto-aramado", heightMm: 220, repeat: 2, role: "Cesto" },
          { module: "cabideiro", heightMm: 1000, role: "Cabideiro baixo" },
          { module: "prateleira", flex: 1, repeat: 2, role: "Prateleira" },
        ],
      },
      {
        label: "Nichos",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 180, repeat: 2, role: "Gaveta" },
          { module: "nicho", flex: 1, repeat: 3, role: "Nicho" },
        ],
      },
    ],
  },
  {
    id: "executivo",
    label: "Executivo / home office",
    families: ["escritorio", "home-office", "painel"],
    dividers: true,
    columns: [
      {
        label: "Arquivo",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 250, repeat: 2, role: "Gaveta de arquivo" },
          { module: "modulo-fechado", heightMm: 700, role: "Módulo fechado" },
          { module: "prateleira", flex: 1, repeat: 2, role: "Prateleira" },
        ],
      },
      {
        label: "Exposição",
        flex: 1,
        bands: [
          { module: "modulo-aberto", heightMm: 500, role: "Módulo aberto" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
        ],
      },
    ],
  },
  {
    id: "lavanderia",
    label: "Lavanderia",
    families: ["lavanderia", "banheiro"],
    dividers: true,
    columns: [
      {
        label: "Cestos",
        flex: 1,
        bands: [
          { module: "cesto-aramado", heightMm: 250, repeat: 3, role: "Cesto de roupa" },
          { module: "prateleira", flex: 1, repeat: 2, role: "Prateleira" },
          { module: "maleiro", heightMm: 350, role: "Maleiro" },
        ],
      },
      {
        label: "Produtos",
        flex: 1,
        bands: [
          { module: "modulo-fechado", heightMm: 800, role: "Armário fechado" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
        ],
      },
    ],
  },
  {
    id: "despensa",
    label: "Despensa",
    families: ["cozinha", "lavanderia"],
    dividers: true,
    columns: [
      {
        label: "Secos",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 200, repeat: 2, role: "Gaveta" },
          { module: "prateleira", flex: 1, repeat: 5, role: "Prateleira" },
        ],
      },
      {
        label: "Volumes",
        flex: 1,
        bands: [
          { module: "cesto-aramado", heightMm: 220, repeat: 2, role: "Cesto" },
          { module: "prateleira-inclinada", heightMm: 200, role: "Prateleira inclinada" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
        ],
      },
    ],
  },
  {
    id: "cristaleira",
    label: "Cristaleira",
    families: ["cristaleira", "painel", "cozinha"],
    dividers: true,
    columns: [
      {
        label: "Adega",
        flex: 1,
        bands: [
          { module: "adega", heightMm: 700, role: "Adega" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
        ],
      },
      {
        label: "Cristais",
        flex: 1,
        bands: [
          { module: "gaveta-interna", heightMm: 180, role: "Gaveta de talheres" },
          { module: "nicho", heightMm: 400, repeat: 2, role: "Nicho iluminado" },
          { module: "prateleira", flex: 1, repeat: 3, role: "Prateleira" },
        ],
      },
    ],
  },
];

export function getInteriorPreset(id: string): LayoutRecipe | undefined {
  return INTERIOR_PRESETS.find((p) => p.id === id);
}

export function listPresetsForFamily(family: InteriorFamilyId): readonly LayoutRecipe[] {
  return INTERIOR_PRESETS.filter((p) => p.families.includes(family));
}

/**
 * Escolha automática de preset: família + largura do vão.
 * Nunca devolve `undefined` — o roupeiro solteiro é o fallback seguro.
 */
export function pickPreset(family: InteriorFamilyId, cavity: InteriorCavity): LayoutRecipe {
  const candidates = listPresetsForFamily(family);
  if (candidates.length === 0) return getInteriorPreset("roupeiro-solteiro")!;
  if (family === "roupeiro" || family === "closet") {
    if (cavity.widthMm >= 1800) return getInteriorPreset("roupeiro-casal")!;
    return candidates[0];
  }
  return candidates[0];
}