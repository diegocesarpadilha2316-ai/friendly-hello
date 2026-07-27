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
import { EXTENDED_CATALOG_ITEMS } from "./catalog-extended";

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
  item("mod-balcao-pia-cuba", "Balcão de Pia com Cuba", "balcao", "modulos",
    { width: 1500, depth: 600, height: 900 },
    {
      description: "Módulo inferior de cozinha para pia, com cuba inox integrada, tampo e base técnica.",
      tags: ["balcao", "pia", "cuba", "cozinha", "hidraulica", "sink"],
    }),
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

  // ================================================================
  // ============  DECORAÇÃO / ARQUITETURA (estilo Promob)  ==========
  // ================================================================

  // ---- Aberturas ----
  item("janela-2f-correr",    "Janela 2 Folhas de Correr",     "janela",         "aberturas",   { width: 1200, depth: 100, height: 1000 }, { material: "Alumínio", tags: ["janela", "correr"], description: "Janela de correr 2 folhas com vidro temperado." }),
  item("janela-maxim-ar",     "Janela Maxim-Ar",               "janela",         "aberturas",   { width: 800, depth: 100, height: 600 },  { material: "Alumínio", tags: ["janela", "maxim-ar"] }),
  item("janela-basculante",   "Janela Basculante",             "janela",         "aberturas",   { width: 600, depth: 100, height: 400 },  { material: "Alumínio", tags: ["janela", "basculante", "banheiro"] }),
  item("janela-4f-correr",    "Janela 4 Folhas de Correr",     "janela",         "aberturas",   { width: 2000, depth: 100, height: 1200 }, { material: "Alumínio", tags: ["janela", "correr", "grande"] }),
  item("janela-guilhotina",   "Janela Guilhotina",             "janela",         "aberturas",   { width: 900, depth: 100, height: 1200 }, { material: "Madeira", tags: ["janela", "guilhotina"] }),
  item("janela-veneziana",    "Janela com Veneziana",          "janela",         "aberturas",   { width: 1200, depth: 100, height: 1200 }, { material: "Alumínio", tags: ["janela", "veneziana"] }),
  item("porta-abrir-madeira", "Porta de Abrir Madeira",        "porta-ambiente", "aberturas",   { width: 800, depth: 40, height: 2100 },  { material: "Madeira", tags: ["porta", "ambiente"] }),
  item("porta-correr-vidro",  "Porta de Correr Vidro",         "porta-correr",   "aberturas",   { width: 1600, depth: 40, height: 2100 }, { material: "Vidro temperado", tags: ["porta", "correr", "vidro"] }),
  item("porta-balcao-3f",     "Porta Balcão 3 Folhas",         "porta-balcao",   "aberturas",   { width: 2400, depth: 100, height: 2100 }, { material: "Alumínio", tags: ["porta", "balcao"] }),
  item("porta-camarao",       "Porta Camarão (Sanfonada)",     "porta-ambiente", "aberturas",   { width: 1000, depth: 40, height: 2100 }, { material: "PVC", tags: ["porta", "sanfonada"] }),
  item("porta-pivotante",     "Porta Pivotante",               "porta-ambiente", "aberturas",   { width: 1200, depth: 60, height: 2400 }, { material: "Madeira nobre", tags: ["porta", "pivotante"] }),
  item("portal-arco",         "Portal em Arco",                "portal",         "aberturas",   { width: 1400, depth: 200, height: 2200 }, { tags: ["portal", "arco"] }),
  item("portal-reto",         "Portal Reto",                   "portal",         "aberturas",   { width: 1200, depth: 200, height: 2100 }, { tags: ["portal"] }),

  // ---- Pisos ----
  item("piso-porcelanato-bege",   "Porcelanato Bege 90x90",    "piso", "pisos", { width: 900, depth: 900, height: 10 },  { material: "Porcelanato", color: "Bege", tags: ["piso", "porcelanato"] }),
  item("piso-porcelanato-cinza",  "Porcelanato Cinza 60x60",   "piso", "pisos", { width: 600, depth: 600, height: 10 },  { material: "Porcelanato", color: "Cinza", tags: ["piso", "porcelanato"] }),
  item("piso-porcelanato-marmore","Porcelanato Mármore Calacata","piso", "pisos", { width: 1200, depth: 600, height: 10 }, { material: "Porcelanato", color: "Branco Calacata", tags: ["piso", "marmore"] }),
  item("piso-madeira-carvalho",   "Piso Madeira Carvalho",     "piso", "pisos", { width: 1200, depth: 190, height: 15 }, { material: "Madeira engenheirada", color: "Carvalho", tags: ["piso", "madeira"] }),
  item("piso-madeira-nogueira",   "Piso Madeira Nogueira",     "piso", "pisos", { width: 1200, depth: 190, height: 15 }, { material: "Madeira", color: "Nogueira", tags: ["piso", "madeira"] }),
  item("piso-laminado-freijo",    "Laminado Freijó",           "piso", "pisos", { width: 1300, depth: 190, height: 8 },  { material: "Laminado", color: "Freijó", tags: ["piso", "laminado"] }),
  item("piso-vinilico-cinza",     "Vinílico LVT Cinza",        "piso", "pisos", { width: 1200, depth: 180, height: 4 },  { material: "Vinílico LVT", color: "Cinza", tags: ["piso", "vinilico"] }),
  item("piso-ceramico-branco",    "Cerâmico Branco 45x45",     "piso", "pisos", { width: 450, depth: 450, height: 8 },   { material: "Cerâmica", color: "Branco", tags: ["piso", "ceramico"] }),
  item("piso-cimento-queimado",   "Cimento Queimado",          "piso", "pisos", { width: 1000, depth: 1000, height: 20 },{ material: "Cimento", color: "Cinza natural", tags: ["piso", "cimento"] }),

  // ---- Revestimentos ----
  item("azulejo-metro-branco",    "Azulejo Metrô Branco",      "azulejo",      "revestimentos", { width: 200, depth: 8, height: 100 }, { material: "Cerâmica", color: "Branco", tags: ["azulejo", "metro"] }),
  item("azulejo-hexagonal",       "Azulejo Hexagonal",         "azulejo",      "revestimentos", { width: 200, depth: 8, height: 230 }, { material: "Cerâmica", tags: ["azulejo", "hexagonal"] }),
  item("azulejo-3d-onda",         "Revestimento 3D Onda",      "revestimento", "revestimentos", { width: 300, depth: 20, height: 300 },{ material: "Cimentício", tags: ["3d", "parede"] }),
  item("papel-parede-geometrico", "Papel de Parede Geométrico","papel-parede", "revestimentos", { width: 2500, depth: 1, height: 2500 },{ material: "Papel vinílico", tags: ["papel", "parede"] }),
  item("papel-parede-floral",     "Papel de Parede Floral",    "papel-parede", "revestimentos", { width: 2500, depth: 1, height: 2500 },{ material: "Papel vinílico", tags: ["papel", "floral"] }),
  item("revest-tijolinho",        "Revestimento Tijolinho",    "revestimento", "revestimentos", { width: 240, depth: 15, height: 70 },  { material: "Cerâmica", color: "Terracota", tags: ["tijolo"] }),
  item("revest-ripado-madeira",   "Painel Ripado Madeira",     "revestimento", "revestimentos", { width: 2400, depth: 20, height: 300 },{ material: "MDF ripado", color: "Nogueira", tags: ["ripado", "painel"] }),

  // ---- Paredes & Teto ----
  item("parede-divisoria",        "Parede Divisória Drywall",  "parede", "paredes-teto", { width: 3000, depth: 100, height: 2700 }, { material: "Drywall", tags: ["parede", "drywall"] }),
  item("teto-gesso",              "Forro de Gesso",            "teto",   "paredes-teto", { width: 3000, depth: 3000, height: 50 },  { material: "Gesso", tags: ["forro", "teto"] }),
  item("sanca-iluminada",         "Sanca Iluminada",           "teto",   "paredes-teto", { width: 3000, depth: 200, height: 150 },  { material: "Gesso", tags: ["sanca", "led"] }),

  // ---- Eletrodomésticos ----
  item("geladeira-frost",         "Geladeira Frost Free 450L", "geladeira",  "eletros", { width: 700, depth: 750, height: 1850 }, { brand: "Brastemp", tags: ["geladeira", "cozinha"] }),
  item("geladeira-side",          "Geladeira Side by Side",    "geladeira",  "eletros", { width: 900, depth: 750, height: 1900 }, { brand: "Samsung", tags: ["geladeira", "side"] }),
  item("geladeira-frenchdoor",    "Geladeira French Door",     "geladeira",  "eletros", { width: 900, depth: 780, height: 1800 }, { brand: "LG", tags: ["geladeira", "french"] }),
  item("fogao-5b",                "Fogão 5 Bocas",             "fogao",      "eletros", { width: 760, depth: 640, height: 940 },  { brand: "Consul", tags: ["fogao"] }),
  item("fogao-6b",                "Fogão 6 Bocas Piso",        "fogao",      "eletros", { width: 900, depth: 640, height: 940 },  { brand: "Dako", tags: ["fogao", "6b"] }),
  item("cooktop-5b-gas",          "Cooktop 5 Bocas Gás",       "cooktop",    "eletros", { width: 750, depth: 510, height: 55 },   { brand: "Fischer", tags: ["cooktop", "gas"] }),
  item("cooktop-4b-inducao",      "Cooktop 4 Bocas Indução",   "cooktop",    "eletros", { width: 600, depth: 510, height: 55 },   { brand: "Electrolux", tags: ["cooktop", "inducao"] }),
  item("coifa-parede",            "Coifa de Parede 90cm",      "coifa",      "eletros", { width: 900, depth: 500, height: 700 },  { brand: "Suggar", tags: ["coifa"] }),
  item("coifa-ilha",              "Coifa de Ilha",             "coifa",      "eletros", { width: 900, depth: 600, height: 800 },  { brand: "Falmec", tags: ["coifa", "ilha"] }),
  item("depurador",               "Depurador de Ar",           "coifa",      "eletros", { width: 800, depth: 340, height: 200 },  { tags: ["depurador"] }),
  item("forno-embutir",           "Forno Elétrico de Embutir", "forno",      "eletros", { width: 600, depth: 550, height: 595 },  { brand: "Electrolux", tags: ["forno", "embutir"] }),
  item("forno-gas-embutir",       "Forno a Gás Embutir",       "forno",      "eletros", { width: 600, depth: 550, height: 595 },  { brand: "Fischer", tags: ["forno", "gas"] }),
  item("microondas-embutir",      "Micro-ondas de Embutir",    "microondas", "eletros", { width: 600, depth: 400, height: 380 },  { brand: "Electrolux", tags: ["microondas"] }),
  item("lavaloucas-8s",           "Lava-Louças 8 Serviços",    "lava-loucas","eletros", { width: 600, depth: 600, height: 820 },  { brand: "Brastemp", tags: ["lava-loucas"] }),
  item("lavaloucas-14s",          "Lava-Louças 14 Serviços",   "lava-loucas","eletros", { width: 600, depth: 600, height: 820 },  { brand: "Bosch", tags: ["lava-loucas"] }),
  item("lavaroupas-13kg",         "Lava e Seca 13kg",          "lava-roupas","eletros", { width: 600, depth: 650, height: 850 },  { brand: "LG", tags: ["lava-roupas"] }),
  item("adega-24-garrafas",       "Adega Climatizada 24 Gar.", "adega",      "eletros", { width: 400, depth: 550, height: 850 },  { brand: "Electrolux", tags: ["adega"] }),
  item("tv-55",                   "TV 55\"",                    "tv",         "eletros", { width: 1230, depth: 60, height: 715 },  { brand: "Samsung", tags: ["tv"] }),
  item("tv-65",                   "TV 65\"",                    "tv",         "eletros", { width: 1450, depth: 60, height: 830 },  { brand: "LG", tags: ["tv", "65"] }),
  item("tv-75",                   "TV 75\"",                    "tv",         "eletros", { width: 1670, depth: 70, height: 960 },  { brand: "Sony", tags: ["tv", "75"] }),

  // ---- Louças & Metais ----
  item("cuba-inox-simples",       "Cuba Inox Simples",         "cuba",       "hidraulica", { width: 470, depth: 300, height: 170 }, { material: "Inox", tags: ["cuba"] }),
  item("cuba-inox-dupla",         "Cuba Inox Dupla",           "cuba",       "hidraulica", { width: 800, depth: 400, height: 170 }, { material: "Inox", tags: ["cuba", "dupla"] }),
  item("cuba-granito",            "Cuba Granito",              "cuba",       "hidraulica", { width: 560, depth: 340, height: 200 }, { material: "Granito", tags: ["cuba"] }),
  item("cuba-banheiro-apoio",     "Cuba de Apoio Banheiro",    "cuba",       "hidraulica", { width: 460, depth: 320, height: 140 }, { material: "Cerâmica", tags: ["cuba", "banheiro"] }),
  item("torneira-monocomando",    "Torneira Monocomando",      "torneira",   "hidraulica", { width: 60, depth: 200, height: 300 },  { material: "Cromado", brand: "Deca", tags: ["torneira"] }),
  item("torneira-gourmet",        "Torneira Gourmet",          "torneira",   "hidraulica", { width: 60, depth: 250, height: 500 },  { material: "Aço escovado", brand: "Docol", tags: ["torneira", "gourmet"] }),
  item("vaso-caixa-acoplada",     "Vaso c/ Caixa Acoplada",    "vaso-sanitario","hidraulica",{ width: 380, depth: 700, height: 780 },{ material: "Cerâmica", brand: "Deca", tags: ["vaso"] }),
  item("vaso-suspenso",           "Vaso Suspenso",             "vaso-sanitario","hidraulica",{ width: 360, depth: 540, height: 340 },{ material: "Cerâmica", brand: "Roca", tags: ["vaso", "suspenso"] }),
  item("chuveiro-ducha",          "Ducha Chuveirão",           "chuveiro",   "hidraulica", { width: 250, depth: 250, height: 100 }, { material: "Cromado", brand: "Lorenzetti", tags: ["chuveiro"] }),
  item("banheira-ofuro",          "Banheira Ofurô",            "banheira",   "hidraulica", { width: 1400, depth: 800, height: 550 }, { material: "Acrílica", tags: ["banheira"] }),
  item("banheira-hidro",          "Banheira Hidromassagem",    "banheira",   "hidraulica", { width: 1800, depth: 900, height: 600 }, { material: "Acrílica", tags: ["banheira", "hidro"] }),

  // ---- Móveis soltos ----
  item("sofa-2-lugares",          "Sofá 2 Lugares",            "sofa",       "moveis-soltos", { width: 1600, depth: 900, height: 850 }, { tags: ["sofa"] }),
  item("sofa-3-lugares",          "Sofá 3 Lugares",            "sofa",       "moveis-soltos", { width: 2200, depth: 950, height: 850 }, { tags: ["sofa"] }),
  item("sofa-retratil",           "Sofá Retrátil Reclinável",  "sofa",       "moveis-soltos", { width: 2600, depth: 1100, height: 900 },{ tags: ["sofa", "retratil"] }),
  item("sofa-ilha",               "Sofá de Canto em L",        "sofa",       "moveis-soltos", { width: 2800, depth: 1800, height: 850 },{ tags: ["sofa", "canto"] }),
  item("cama-solteiro",           "Cama Solteiro",             "cama",       "moveis-soltos", { width: 880, depth: 1880, height: 350 }, { tags: ["cama", "solteiro"] }),
  item("cama-casal",              "Cama Casal",                "cama",       "moveis-soltos", { width: 1380, depth: 1880, height: 400 },{ tags: ["cama", "casal"] }),
  item("cama-queen",              "Cama Queen",                "cama",       "moveis-soltos", { width: 1580, depth: 1980, height: 400 },{ tags: ["cama", "queen"] }),
  item("cama-king",               "Cama King",                 "cama",       "moveis-soltos", { width: 1930, depth: 2030, height: 400 },{ tags: ["cama", "king"] }),
  item("cama-box-bau",            "Cama Box com Baú",          "cama",       "moveis-soltos", { width: 1580, depth: 1980, height: 600 },{ tags: ["cama", "bau"] }),
  item("criado-mudo",             "Criado-Mudo 2 Gavetas",     "criado-mudo","moveis-soltos", { width: 500, depth: 400, height: 500 },  { tags: ["criado-mudo"] }),
  item("mesa-jantar-6",           "Mesa de Jantar 6 Lugares",  "mesa",       "moveis-soltos", { width: 1600, depth: 900, height: 750 }, { tags: ["mesa", "jantar"] }),
  item("mesa-jantar-8",           "Mesa de Jantar 8 Lugares",  "mesa",       "moveis-soltos", { width: 2200, depth: 1000, height: 750 },{ tags: ["mesa", "jantar", "8"] }),
  item("mesa-centro",             "Mesa de Centro",            "mesa",       "moveis-soltos", { width: 1000, depth: 600, height: 400 }, { tags: ["mesa", "centro"] }),
  item("mesa-lateral",            "Mesa Lateral",              "mesa",       "moveis-soltos", { width: 500, depth: 500, height: 550 },  { tags: ["mesa", "lateral"] }),
  item("mesa-escritorio",         "Mesa de Escritório",        "mesa",       "moveis-soltos", { width: 1400, depth: 700, height: 750 }, { tags: ["mesa", "escritorio", "home-office"] }),
  item("cadeira-jantar",          "Cadeira de Jantar",         "cadeira",    "moveis-soltos", { width: 450, depth: 500, height: 900 },  { tags: ["cadeira"] }),
  item("cadeira-escritorio",      "Cadeira Escritório",        "cadeira",    "moveis-soltos", { width: 620, depth: 620, height: 1100 }, { tags: ["cadeira", "escritorio"] }),
  item("banqueta-alta",           "Banqueta Alta Bancada",     "cadeira",    "moveis-soltos", { width: 400, depth: 400, height: 750 },  { tags: ["banqueta"] }),
  item("poltrona-decor",          "Poltrona Decorativa",       "poltrona",   "moveis-soltos", { width: 800, depth: 850, height: 950 },  { tags: ["poltrona"] }),
  item("puff",                    "Puff Redondo",              "poltrona",   "moveis-soltos", { width: 500, depth: 500, height: 450 },  { tags: ["puff"] }),
  item("estante-livros",          "Estante de Livros",         "estante",    "moveis-soltos", { width: 1600, depth: 350, height: 2200 }, { tags: ["estante"] }),
  item("aparador",                "Aparador",                  "aparador",   "moveis-soltos", { width: 1400, depth: 400, height: 850 }, { tags: ["aparador"] }),
  item("rack-tv",                 "Rack de TV",                "aparador",   "moveis-soltos", { width: 1800, depth: 450, height: 500 }, { tags: ["rack", "tv"] }),

  // ---- Decoração ----
  item("tapete-3x2",              "Tapete 3,00 x 2,00m",       "tapete",     "textil",     { width: 3000, depth: 2000, height: 10 }, { tags: ["tapete", "sala"] }),
  item("tapete-2x1_5",            "Tapete 2,00 x 1,50m",       "tapete",     "textil",     { width: 2000, depth: 1500, height: 10 }, { tags: ["tapete"] }),
  item("tapete-passadeira",       "Passadeira 2,00 x 0,60m",   "tapete",     "textil",     { width: 2000, depth: 600, height: 8 },   { tags: ["passadeira"] }),
  item("cortina-tecido",          "Cortina em Tecido",         "cortina",    "textil",     { width: 3000, depth: 100, height: 2600 }, { tags: ["cortina"] }),
  item("cortina-blackout",        "Cortina Blackout",          "cortina",    "textil",     { width: 3000, depth: 100, height: 2600 }, { tags: ["cortina", "blackout"] }),
  item("persiana-rolo",           "Persiana Rolo Screen",      "persiana",   "textil",     { width: 1500, depth: 50, height: 1800 },  { tags: ["persiana"] }),
  item("persiana-romana",         "Persiana Romana",           "persiana",   "textil",     { width: 1500, depth: 60, height: 1800 },  { tags: ["persiana", "romana"] }),
  item("quadro-abstrato",         "Quadro Abstrato Grande",    "quadro",     "decoracao",  { width: 1200, depth: 40, height: 900 },   { tags: ["quadro"] }),
  item("quadro-triptico",         "Quadro Tríptico",           "quadro",     "decoracao",  { width: 1800, depth: 30, height: 800 },   { tags: ["quadro", "triptico"] }),
  item("espelho-redondo",         "Espelho Redondo Decor",     "espelho",    "decoracao",  { width: 800, depth: 40, height: 800 },    { tags: ["espelho", "redondo"] }),
  item("vaso-planta-alto",        "Vaso c/ Planta Alto",       "vaso-planta","decoracao",  { width: 400, depth: 400, height: 1400 },  { tags: ["planta", "vaso"] }),
  item("vaso-planta-medio",       "Vaso c/ Planta Médio",      "vaso-planta","decoracao",  { width: 350, depth: 350, height: 800 },   { tags: ["planta", "vaso"] }),
  item("planta-costela-adao",     "Planta Costela-de-Adão",    "planta",     "decoracao",  { width: 800, depth: 800, height: 1200 },  { tags: ["planta"] }),
  item("planta-ficus",            "Ficus Lyrata",              "planta",     "decoracao",  { width: 700, depth: 700, height: 1800 },  { tags: ["planta"] }),
  item("planta-suculenta",        "Suculenta em Vaso",         "planta",     "decoracao",  { width: 150, depth: 150, height: 200 },   { tags: ["planta", "mini"] }),
  item("luminaria-piso",          "Luminária de Piso",         "luminaria",  "decoracao",  { width: 400, depth: 400, height: 1600 },  { tags: ["luminaria"] }),
  item("luminaria-mesa",          "Abajur de Mesa",            "luminaria",  "decoracao",  { width: 300, depth: 300, height: 500 },   { tags: ["abajur"] }),
  item("pendente-cone",           "Pendente Cone",             "pendente",   "decoracao",  { width: 250, depth: 250, height: 350 },   { tags: ["pendente"] }),
  item("pendente-cluster",        "Pendente Cluster de 5",     "pendente",   "decoracao",  { width: 600, depth: 600, height: 800 },   { tags: ["pendente", "cluster"] }),
  item("lustre-cristal",          "Lustre de Cristal",         "pendente",   "decoracao",  { width: 800, depth: 800, height: 900 },   { tags: ["lustre"] }),
  item("arandela-parede",         "Arandela de Parede",        "arandela",   "decoracao",  { width: 150, depth: 200, height: 300 },   { tags: ["arandela"] }),
  item("spot-embutir",            "Spot Embutir LED",          "spot",       "decoracao",  { width: 100, depth: 100, height: 60 },    { tags: ["spot", "led"] }),
  item("plafon-redondo",          "Plafon Redondo LED",        "spot",       "decoracao",  { width: 400, depth: 400, height: 50 },    { tags: ["plafon"] }),
  item("livros-decor",            "Pilha de Livros Decor",     "livro",      "decoracao",  { width: 250, depth: 200, height: 200 },   { tags: ["livros"] }),
  item("objeto-escultura",        "Escultura Decorativa",      "objeto-deco","decoracao",  { width: 200, depth: 200, height: 400 },   { tags: ["escultura"] }),
  item("bandeja-decor",           "Bandeja Decorativa",        "objeto-deco","decoracao",  { width: 400, depth: 250, height: 40 },    { tags: ["bandeja"] }),
  item("relogio-parede",          "Relógio de Parede",         "objeto-deco","decoracao",  { width: 500, depth: 40, height: 500 },    { tags: ["relogio"] }),
  // ---- Expansão massiva (400+ variações, fabricantes, eletros, hidráulica,
  //      móveis soltos, decoração, iluminação, pisos, aberturas). ----
  ...EXTENDED_CATALOG_ITEMS,
];

export const CATALOG_COLLECTIONS: readonly CatalogCollection[] = [
  {
    id: "cozinha-essencial",
    label: "Cozinha Essencial",
    description: "Kit inicial de cozinha — balcão, aéreos, tampo e ilha.",
    itemIds: ["mod-balcao-pia-cuba", "mod-aereo-porta", "tampo-quartzo", "mod-ilha-central"],
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
  {
    id: "cozinha-gourmet-premium",
    label: "Cozinha Gourmet Premium",
    description: "Ilha, balcão gourmet, torre forno+micro, coifa e adega.",
    itemIds: ["balcao-gourmet", "torre-forno-micro", "coifa-ilha-inox", "adega-46g", "tampo-quartzo-preto"],
  },
  {
    id: "cozinha-linear",
    label: "Cozinha Linear 3m",
    description: "Base + aéreo + torre em 3 metros lineares.",
    itemIds: ["arm-base-2p-1000", "aer-2p-1000", "torre-forno", "tampo-quartzo-branco", "coifa-parede-60"],
  },
  {
    id: "closet-completo",
    label: "Closet Completo",
    description: "Cabideiros, gaveteiros, sapateira e cristaleira.",
    itemIds: ["closet-cabideiro-duplo", "closet-gaveteiro-6g", "closet-sapateira", "closet-cristaleira"],
  },
  {
    id: "home-office-pro",
    label: "Home Office Pro",
    description: "Mesa em L, cadeira presidente, estante e painel ripado.",
    itemIds: ["mesa-escritorio", "cadeira-office", "estante-modular", "painel-tv-ripado"],
  },
  {
    id: "sala-jantar-moderna",
    label: "Sala de Jantar Moderna",
    description: "Mesa 8 lugares, cadeiras, aparador e pendente linear.",
    itemIds: ["mesa-jantar-8", "cadeira-wishbone", "aparador-sala", "pendente-linear"],
  },
  {
    id: "banheiro-premium",
    label: "Banheiro Premium",
    description: "Cuba esculpida, torneira parede, vaso suspenso, chuveiro cascata.",
    itemIds: ["cuba-esculpida-marmore", "torneira-parede", "vaso-suspenso", "chuveiro-cascata", "banheira-freestanding"],
  },
  {
    id: "sala-tv-cinema",
    label: "Sala de TV Cinema",
    description: "TV 85”, painel LED, home theater e sofá retrátil.",
    itemIds: ["tv-85", "painel-tv-led", "home-theater", "sofa-retratil", "tapete-retangular"],
  },
];

export function findCatalogItem(id: string): CatalogItem | null {
  return CATALOG_ITEMS.find((i) => i.id === id) ?? null;
}