/**
 * Catálogo semente (Fase 3.4). Cada item cobre um dos 24 subtipos exigidos
 * pelo escopo. Os itens são estáticos, portáteis e determinísticos — a
 * futura camada de catálogo persistido apenas amplia esta lista.
 */
import type {
  CatalogCategory,
  CatalogCollection,
  CatalogItem,
  CatalogSubtype,
} from "./types";

export const CATALOG_CATEGORIES: readonly CatalogCategory[] = [
  { id: "modulos",         label: "Módulos",         description: "Corpos paramétricos — armários, balcões, torres, ilhas." },
  { id: "tampos",          label: "Tampos & Bancadas", description: "Tampos, bancadas, ilhas e painéis." },
  { id: "portas-gavetas",  label: "Portas & Gavetas", description: "Frentes, gavetas e prateleiras." },
  { id: "prateleiras",     label: "Prateleiras",     description: "Prateleiras, divisórias e nichos." },
  { id: "acessorios",      label: "Acessórios",      description: "Ferragens, pés, perfis." },
  { id: "acabamentos",     label: "Acabamentos",     description: "Rodapés, vidros, espelhos." },
  { id: "iluminacao",      label: "Iluminação",      description: "Fitas LED, spots e perfis luminosos." },
  { id: "aberturas",       label: "Aberturas",       description: "Janelas, portas de ambiente, portais e vãos." },
  { id: "pisos",           label: "Pisos",           description: "Porcelanato, madeira, cerâmico, vinílico, laminados." },
  { id: "revestimentos",   label: "Revestimentos",   description: "Azulejos, papéis de parede, revestimentos 3D." },
  { id: "paredes-teto",    label: "Paredes & Teto",  description: "Paredes divisórias, tetos, sancas e forros." },
  { id: "eletros",         label: "Eletrodomésticos", description: "Geladeira, cooktop, forno, coifa, microondas, lava-louças." },
  { id: "hidraulica",      label: "Louças & Metais", description: "Cubas, torneiras, vasos, chuveiros, banheiras." },
  { id: "moveis-soltos",   label: "Móveis Soltos",   description: "Sofás, camas, mesas, cadeiras, poltronas, estantes." },
  { id: "decoracao",       label: "Decoração",       description: "Quadros, vasos, plantas, luminárias, objetos." },
  { id: "textil",          label: "Têxtil",          description: "Tapetes, cortinas, persianas." },
];

function item(
  id: string,
  name: string,
  subtype: CatalogSubtype,
  category: CatalogItem["category"],
  defaults: { width: number; depth: number; height: number },
  extras: Partial<CatalogItem> = {},
): CatalogItem {
  const width = { min: Math.max(100, Math.round(defaults.width * 0.4)), max: Math.round(defaults.width * 2.5), step: 10 };
  const depth = { min: Math.max(100, Math.round(defaults.depth * 0.4)), max: Math.round(defaults.depth * 2.5), step: 10 };
  const height = { min: Math.max(50, Math.round(defaults.height * 0.4)), max: Math.round(defaults.height * 2), step: 10 };
  return {
    id,
    name,
    subtype,
    category,
    description: extras.description ?? `${name} paramétrico do Dioris Planner.`,
    brand: extras.brand ?? "Dioris",
    line: extras.line ?? "Standard",
    code: extras.code ?? id.toUpperCase(),
    parametric: {
      width, depth, height,
      defaults,
      materials: extras.parametric?.materials ?? ["MDF 18mm", "MDP 18mm", "Compensado 18mm"],
      colors: extras.parametric?.colors ?? ["Branco TX", "Grafite", "Nogueira", "Carvalho Naturale"],
      finishes: extras.parametric?.finishes ?? ["Fosco", "Acetinado", "Alto brilho"],
      extra: extras.parametric?.extra,
    },
    material: extras.material ?? "MDF 18mm",
    color: extras.color ?? "Branco TX",
    version: extras.version ?? "1.0.0",
    status: extras.status ?? "active",
    tags: extras.tags ?? [subtype],
    ai: extras.ai ?? {
      semanticTags: [subtype, name.toLowerCase()],
      contexts: ["cozinha", "dormitorio", "sala", "closet", "escritorio"],
      narrative: `${name} paramétrico apto a inserção, substituição e otimização automática pela IA do Planner.`,
    },
    weightKg: extras.weightKg,
    priceBRL: extras.priceBRL,
    supplier: extras.supplier,
    image: extras.image,
    thumbnail: extras.thumbnail,
    model3D: extras.model3D,
    model2D: extras.model2D,
    texture: extras.texture,
  };
}

export const CATALOG_ITEMS: readonly CatalogItem[] = [
  // ---- Módulos ----
  item("mod-armario-base", "Armário Base", "armario", "modulos",
    { width: 800, depth: 580, height: 720 },
    { description: "Módulo de armário base com uma porta e prateleira interna.", tags: ["armario", "base", "cozinha", "utilidade"] }),
  item("mod-balcao-cozinha", "Balcão de Cozinha", "balcao", "modulos",
    { width: 1200, depth: 600, height: 900 },
    { description: "Balcão de cozinha com tampo integrado, base e rodapé.", tags: ["balcao", "cozinha"] }),
  item("mod-gaveteiro-3g", "Gaveteiro 3 Gavetas", "gaveteiro", "modulos",
    { width: 600, depth: 500, height: 900 }, { tags: ["gaveteiro", "cozinha", "dormitorio"] }),
  item("mod-nicho-quadrado", "Nicho Quadrado", "nicho", "modulos",
    { width: 400, depth: 300, height: 400 }, { tags: ["nicho"] }),
  item("mod-torre-forno", "Torre Quente (Forno)", "torre", "modulos",
    { width: 600, depth: 580, height: 2100 }, { tags: ["torre", "cozinha", "forno"] }),
  item("mod-aereo-porta", "Aéreo 1 Porta", "aereo", "modulos",
    { width: 800, depth: 320, height: 700 }, { tags: ["aereo", "cozinha"] }),
  item("mod-cristaleira", "Cristaleira", "cristaleira", "modulos",
    { width: 900, depth: 400, height: 1800 }, { tags: ["cristaleira", "sala"] }),
  item("mod-roupeiro-6portas", "Roupeiro 6 Portas", "roupeiro", "modulos",
    { width: 2400, depth: 600, height: 2400 }, { tags: ["roupeiro", "dormitorio"] }),
  item("mod-closet-modulo", "Closet Modular", "closet", "modulos",
    { width: 1000, depth: 600, height: 2400 }, { tags: ["closet", "dormitorio"] }),
  item("mod-painel-tv", "Painel TV", "painel", "modulos",
    { width: 2000, depth: 40, height: 1200 }, { tags: ["painel", "sala", "tv"] }),
  item("mod-ilha-central", "Ilha Central", "ilha", "modulos",
    { width: 2000, depth: 900, height: 900 }, { tags: ["ilha", "cozinha", "central"] }),

  // ---- Tampos & Bancadas ----
  item("tampo-quartzo", "Tampo em Quartzo", "tampo", "tampos",
    { width: 2000, depth: 620, height: 20 },
    { material: "Quartzo", tags: ["tampo", "quartzo", "cozinha"] }),
  item("bancada-madeira", "Bancada Madeira Maciça", "bancada", "tampos",
    { width: 1800, depth: 600, height: 40 }, { material: "Madeira maciça", tags: ["bancada", "madeira"] }),

  // ---- Portas & Gavetas ----
  item("porta-lisa", "Porta Lisa", "porta", "portas-gavetas",
    { width: 400, depth: 18, height: 720 }, { tags: ["porta", "frente"] }),
  item("gaveta-padrao", "Gaveta Padrão", "gaveta", "portas-gavetas",
    { width: 600, depth: 500, height: 150 }, { tags: ["gaveta"] }),

  // ---- Prateleiras ----
  item("prateleira-simples", "Prateleira Simples", "prateleira", "prateleiras",
    { width: 800, depth: 300, height: 25 }, { tags: ["prateleira"] }),
  item("divisoria-mdf", "Divisória MDF", "divisoria", "prateleiras",
    { width: 18, depth: 580, height: 720 }, { tags: ["divisoria"] }),

  // ---- Acessórios ----
  item("ferragem-dobradica", "Ferragem — Dobradiça", "ferragem", "acessorios",
    { width: 100, depth: 100, height: 20 }, { tags: ["ferragem", "dobradica"] }),
  item("pe-regulavel", "Pé Regulável", "pe", "acessorios",
    { width: 40, depth: 40, height: 100 }, { tags: ["pe"] }),
  item("perfil-aluminio", "Perfil de Alumínio", "perfil", "acessorios",
    { width: 2000, depth: 40, height: 40 }, { material: "Alumínio", tags: ["perfil"] }),

  // ---- Acabamentos ----
  item("rodape-pvc", "Rodapé PVC", "rodape", "acabamentos",
    { width: 2000, depth: 15, height: 100 }, { material: "PVC", tags: ["rodape"] }),
  item("vidro-temperado", "Vidro Temperado 8mm", "vidro", "acabamentos",
    { width: 800, depth: 8, height: 600 }, { material: "Vidro temperado", tags: ["vidro"] }),
  item("espelho-bisote", "Espelho Bisotê", "espelho", "acabamentos",
    { width: 800, depth: 6, height: 1200 }, { material: "Espelho", tags: ["espelho"] }),

  // ---- Iluminação ----
  item("led-fita", "Fita LED 3000K", "iluminacao", "iluminacao",
    { width: 1000, depth: 10, height: 5 }, { material: "LED", tags: ["led", "iluminacao"] }),
];

export const CATALOG_COLLECTIONS: readonly CatalogCollection[] = [
  {
    id: "cozinha-essencial",
    label: "Cozinha Essencial",
    description: "Kit inicial de cozinha — balcão, aéreos, tampo e ilha.",
    itemIds: ["mod-balcao-cozinha", "mod-aereo-porta", "tampo-quartzo", "mod-ilha-central"],
  },
  {
    id: "dormitorio-completo",
    label: "Dormitório Completo",
    description: "Roupeiro, painel de TV e closet modular.",
    itemIds: ["mod-roupeiro-6portas", "mod-painel-tv", "mod-closet-modulo"],
  },
  {
    id: "sala-integrada",
    label: "Sala Integrada",
    description: "Painel TV, cristaleira e nichos decorativos.",
    itemIds: ["mod-painel-tv", "mod-cristaleira", "mod-nicho-quadrado"],
  },
];

export function findCatalogItem(id: string): CatalogItem | null {
  return CATALOG_ITEMS.find((i) => i.id === id) ?? null;
}