/**
 * Extensão massiva do catálogo (Fase pós 3.4).
 *
 * Amplia a biblioteca para superar Promob / SketchUp em cobertura: variações
 * de cada módulo (larguras, portas, gavetas), coleções de fabricantes,
 * eletrodomésticos, hidráulica, móveis soltos, decoração e têxtil.
 *
 * Zero providers, zero stores. Puro dado determinístico consumido pelo
 * `LibraryPanel`, IA, Produção e Render — todos já existentes.
 */
import type { CatalogItem, CatalogSubtype, CatalogCategoryId } from "./types";

function mk(
  id: string,
  name: string,
  subtype: CatalogSubtype,
  category: CatalogCategoryId,
  w: number, d: number, h: number,
  extras: Partial<CatalogItem> = {},
): CatalogItem {
  const width  = { min: Math.max(100, Math.round(w * 0.4)), max: Math.round(w * 2.5), step: 10 };
  const depth  = { min: Math.max(100, Math.round(d * 0.4)), max: Math.round(d * 2.5), step: 10 };
  const height = { min: Math.max(50,  Math.round(h * 0.4)), max: Math.round(h * 2),   step: 10 };
  return {
    id,
    name,
    subtype,
    category,
    description: extras.description ?? `${name} — módulo paramétrico Dioris.`,
    brand: extras.brand ?? "Dioris",
    line:  extras.line  ?? "Premium",
    code:  extras.code  ?? id.toUpperCase(),
    parametric: {
      width, depth, height,
      defaults: { width: w, depth: d, height: h },
      materials: extras.parametric?.materials ?? ["MDF 18mm", "MDP 18mm", "Compensado 18mm", "MDF 25mm"],
      colors:    extras.parametric?.colors    ?? ["Branco TX", "Grafite", "Nogueira", "Carvalho Naturale", "Louro Freijó", "Preto Supremo", "Off White"],
      finishes:  extras.parametric?.finishes  ?? ["Fosco", "Acetinado", "Alto brilho", "Texturizado"],
      extra:     extras.parametric?.extra,
    },
    material: extras.material ?? "MDF 18mm",
    color:    extras.color    ?? "Carvalho Naturale",
    version:  extras.version  ?? "1.0.0",
    status:   extras.status   ?? "active",
    tags:     extras.tags     ?? [subtype],
    ai: extras.ai ?? {
      semanticTags: [subtype, name.toLowerCase()],
      contexts: ["cozinha", "dormitorio", "sala", "closet", "escritorio", "banheiro", "area-servico", "lavanderia", "home-office"],
      narrative: `${name} paramétrico, apto a inserção, substituição e otimização automática pela IA.`,
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

/* ============================================================
 *  1) MARCENARIA — variações amplas por módulo/largura/portas
 * ============================================================ */

const WIDTHS_STD = [400, 500, 600, 700, 800, 900, 1000, 1200] as const;
const WIDTHS_LARGE = [1200, 1500, 1800, 2100, 2400, 2700, 3000] as const;

function serie<T extends string>(
  prefix: string, label: string, subtype: CatalogSubtype, category: CatalogCategoryId,
  widths: readonly number[], depth: number, height: number,
  tags: readonly T[],
): CatalogItem[] {
  return widths.map((w) => mk(
    `${prefix}-${w}`, `${label} ${w}mm`, subtype, category, w, depth, height,
    { tags: [...tags, `${w}mm`] as string[] },
  ));
}

const ARMARIOS: CatalogItem[] = [
  ...serie("arm-base-1p", "Armário Base 1 Porta", "armario", "modulos", [300, 400, 500, 600], 580, 720, ["armario", "cozinha", "base"]),
  ...serie("arm-base-2p", "Armário Base 2 Portas", "armario", "modulos", [700, 800, 900, 1000, 1200], 580, 720, ["armario", "cozinha", "base"]),
  ...serie("arm-canto-90", "Armário de Canto 90°", "armario", "modulos", [900, 1000, 1100], 900, 720, ["armario", "canto", "cozinha"]),
  mk("arm-canto-l-diagonal", "Armário de Canto Diagonal (L)", "armario", "modulos", 900, 900, 720, { tags: ["armario", "canto", "diagonal"] }),
  mk("arm-canto-giratorio",  "Armário Canto Giratório 3/4",   "armario", "modulos", 900, 900, 720, { tags: ["armario", "canto", "giratorio"] }),
  ...serie("arm-sob-pia", "Armário Sob Pia", "armario", "modulos", [800, 1000, 1200, 1500, 1800], 580, 720, ["armario", "pia", "cozinha"]),
  mk("arm-sob-cooktop", "Armário Sob Cooktop", "armario", "modulos", 800, 580, 720, { tags: ["armario", "cooktop"] }),
  mk("arm-mult-uso-2p",   "Armário Multiuso 2P Alto", "armario", "modulos", 800, 500, 2100, { tags: ["armario", "multiuso", "servico"] }),
  mk("arm-mult-uso-4p",   "Armário Multiuso 4P Alto", "armario", "modulos", 1600, 500, 2100, { tags: ["armario", "multiuso"] }),
  mk("arm-servico-vas",   "Armário de Serviço Vassoura", "armario", "modulos", 400, 500, 2100, { tags: ["armario", "servico", "vassoura"] }),
];

const AEREOS: CatalogItem[] = [
  ...serie("aer-1p", "Aéreo 1 Porta", "aereo", "modulos", [300, 400, 500, 600], 320, 700, ["aereo", "cozinha"]),
  ...serie("aer-2p", "Aéreo 2 Portas", "aereo", "modulos", [700, 800, 900, 1000, 1200], 320, 700, ["aereo", "cozinha"]),
  ...serie("aer-basc", "Aéreo Basculante", "aereo", "modulos", [600, 800, 1000, 1200], 320, 400, ["aereo", "basculante", "servo"]),
  mk("aer-canto",      "Aéreo de Canto 90°",   "aereo", "modulos", 900, 900, 700, { tags: ["aereo", "canto"] }),
  mk("aer-cristal-1p", "Aéreo Cristaleira 1P", "aereo", "modulos", 500, 320, 700, { tags: ["aereo", "vidro"] }),
  mk("aer-cristal-2p", "Aéreo Cristaleira 2P", "aereo", "modulos", 900, 320, 700, { tags: ["aereo", "vidro"] }),
  mk("aer-microondas", "Aéreo p/ Microondas",  "aereo", "modulos", 600, 380, 700, { tags: ["aereo", "microondas"] }),
  mk("aer-adega",      "Aéreo Adega Climatizada", "aereo", "modulos", 600, 380, 900, { tags: ["aereo", "adega"] }),
];

const BALCOES: CatalogItem[] = [
  ...serie("balcao-1p-1g", "Balcão 1P/1G", "balcao", "modulos", [400, 500, 600], 580, 900, ["balcao", "cozinha"]),
  ...serie("balcao-2p-2g", "Balcão 2P/2G", "balcao", "modulos", [700, 800, 900, 1000, 1200], 580, 900, ["balcao", "cozinha"]),
  ...serie("balcao-3g",    "Balcão 3 Gavetas", "balcao", "modulos", [400, 500, 600, 700], 580, 900, ["balcao", "gaveteiro"]),
  ...serie("balcao-4g",    "Balcão 4 Gavetas", "balcao", "modulos", [500, 600, 700, 800], 580, 900, ["balcao", "gaveteiro"]),
  mk("balcao-gourmet",   "Balcão Gourmet c/ Cuba", "balcao", "modulos", 1500, 600, 900, { tags: ["balcao", "gourmet"] }),
  mk("balcao-bar",       "Balcão Bar Alto",        "balcao", "modulos", 1500, 500, 1100, { tags: ["balcao", "bar"] }),
  mk("balcao-cava",      "Balcão Cava de Vinhos",  "balcao", "modulos", 600, 580, 900, { tags: ["balcao", "vinho"] }),
];

const TORRES: CatalogItem[] = [
  ...serie("torre-forno",     "Torre p/ Forno", "torre", "modulos", [600, 700], 580, 2100, ["torre", "forno"]),
  mk("torre-forno-micro",     "Torre Forno + Microondas", "torre", "modulos", 600, 580, 2100, { tags: ["torre", "forno", "micro"] }),
  mk("torre-forno-cafeteira", "Torre Forno + Cafeteira",  "torre", "modulos", 600, 580, 2100, { tags: ["torre", "forno", "cafeteira"] }),
  mk("torre-geladeira",       "Torre p/ Geladeira",       "torre", "modulos", 900, 700, 2200, { tags: ["torre", "geladeira"] }),
  mk("torre-adega",           "Torre p/ Adega",           "torre", "modulos", 600, 700, 2200, { tags: ["torre", "adega"] }),
  mk("torre-despensa",        "Torre Despensa Puxador Gola", "torre", "modulos", 800, 580, 2400, { tags: ["torre", "despensa"] }),
];

const ROUPEIROS: CatalogItem[] = [
  ...serie("roup-2p", "Roupeiro 2 Portas", "roupeiro", "modulos", [800, 1000, 1200], 600, 2200, ["roupeiro", "dormitorio"]),
  ...serie("roup-3p", "Roupeiro 3 Portas", "roupeiro", "modulos", [1200, 1500, 1800], 600, 2200, ["roupeiro", "dormitorio"]),
  ...serie("roup-4p", "Roupeiro 4 Portas", "roupeiro", "modulos", [1600, 1800, 2000], 600, 2400, ["roupeiro", "dormitorio"]),
  ...serie("roup-6p", "Roupeiro 6 Portas", "roupeiro", "modulos", [2400, 2700, 3000], 600, 2400, ["roupeiro", "dormitorio"]),
  mk("roup-correr-2p", "Roupeiro Portas de Correr 2P", "roupeiro", "modulos", 1800, 650, 2400, { tags: ["roupeiro", "correr"] }),
  mk("roup-correr-3p", "Roupeiro Portas de Correr 3P", "roupeiro", "modulos", 2400, 650, 2400, { tags: ["roupeiro", "correr"] }),
  mk("roup-espelhado", "Roupeiro c/ Porta Espelhada",   "roupeiro", "modulos", 1800, 600, 2400, { tags: ["roupeiro", "espelho"] }),
];

const CLOSETS: CatalogItem[] = [
  mk("closet-cabideiro-simples", "Closet Cabideiro Simples", "closet", "modulos", 1000, 600, 2400, { tags: ["closet", "cabideiro"] }),
  mk("closet-cabideiro-duplo",   "Closet Cabideiro Duplo",   "closet", "modulos", 1000, 600, 2400, { tags: ["closet", "cabideiro"] }),
  mk("closet-gaveteiro-6g",      "Closet Gaveteiro 6G",      "closet", "modulos", 800,  600, 2400, { tags: ["closet", "gaveteiro"] }),
  mk("closet-sapateira",         "Closet Sapateira",         "closet", "modulos", 1000, 400, 2400, { tags: ["closet", "sapateira"] }),
  mk("closet-bijoux",            "Closet Porta-Bijoux",      "closet", "modulos", 800,  600, 2400, { tags: ["closet", "bijoux"] }),
  mk("closet-porta-gravata",     "Closet Porta-Gravatas",    "closet", "modulos", 800,  600, 2400, { tags: ["closet", "gravata"] }),
  mk("closet-cristaleira",       "Closet Cristaleira Vidro", "closet", "modulos", 1000, 400, 2400, { tags: ["closet", "vidro"] }),
  mk("closet-vestidor-U",        "Vestidor em U",            "closet", "modulos", 3000, 600, 2400, { tags: ["closet", "vestidor"] }),
  mk("closet-vestidor-L",        "Vestidor em L",            "closet", "modulos", 2400, 600, 2400, { tags: ["closet", "vestidor"] }),
];

const PAINEIS: CatalogItem[] = [
  ...serie("painel-tv", "Painel TV", "painel", "modulos", [1600, 2000, 2400, 3000], 40, 1200, ["painel", "tv", "sala"]),
  mk("painel-tv-ripado",   "Painel TV Ripado Nogueira", "painel", "modulos", 2400, 40, 1200, { tags: ["painel", "ripado"] }),
  mk("painel-tv-led",      "Painel TV c/ LED Perimetral", "painel", "modulos", 2400, 60, 1400, { tags: ["painel", "led"] }),
  mk("painel-cabeceira",   "Painel Cabeceira Estofada",  "painel", "modulos", 1800, 100, 1200, { tags: ["painel", "cabeceira"] }),
  mk("painel-lavabo",      "Painel Ripado Lavabo",        "painel", "modulos", 900, 30, 2100, { tags: ["painel", "lavabo"] }),
];

const NICHOS: CatalogItem[] = [
  ...serie("nicho", "Nicho", "nicho", "modulos", [200, 300, 400, 500, 600, 800], 300, 300, ["nicho"]),
  mk("nicho-vertical",   "Nicho Vertical Alto", "nicho", "modulos", 300, 300, 1200, { tags: ["nicho", "vertical"] }),
  mk("nicho-composto",   "Composição de Nichos", "nicho", "modulos", 1200, 300, 1200, { tags: ["nicho", "composicao"] }),
  mk("nicho-led",        "Nicho c/ LED",         "nicho", "modulos", 400, 300, 400, { tags: ["nicho", "led"] }),
];

const TAMPOS: CatalogItem[] = [
  mk("tampo-quartzo-branco", "Tampo Quartzo Branco Neve",  "tampo", "tampos", 2400, 620, 20, { material: "Quartzo", color: "Branco Neve", tags: ["tampo", "quartzo"] }),
  mk("tampo-quartzo-cinza",  "Tampo Quartzo Cinza",        "tampo", "tampos", 2400, 620, 20, { material: "Quartzo", color: "Cinza", tags: ["tampo", "quartzo"] }),
  mk("tampo-quartzo-preto",  "Tampo Quartzo Preto Absoluto","tampo","tampos", 2400, 620, 20, { material: "Quartzo", color: "Preto Absoluto", tags: ["tampo", "quartzo"] }),
  mk("tampo-granito-preto",  "Tampo Granito Preto São Gabriel", "tampo", "tampos", 2400, 620, 30, { material: "Granito", color: "Preto SG" }),
  mk("tampo-granito-branco", "Tampo Granito Branco Siena",  "tampo", "tampos", 2400, 620, 30, { material: "Granito", color: "Branco Siena" }),
  mk("tampo-marmore-carrara","Tampo Mármore Carrara",       "tampo", "tampos", 2400, 620, 30, { material: "Mármore", color: "Carrara" }),
  mk("tampo-marmore-calacata","Tampo Mármore Calacata",     "tampo", "tampos", 2400, 620, 30, { material: "Mármore", color: "Calacata" }),
  mk("tampo-dekton",         "Tampo Dekton",                "tampo", "tampos", 2400, 620, 20, { material: "Dekton" }),
  mk("tampo-inox",           "Tampo Inox Escovado",         "tampo", "tampos", 2400, 620, 40, { material: "Inox" }),
  mk("bancada-freijo",       "Bancada Maciça Freijó",       "bancada", "tampos", 2000, 600, 40, { material: "Freijó" }),
  mk("bancada-carvalho",     "Bancada Maciça Carvalho",     "bancada", "tampos", 2000, 600, 40, { material: "Carvalho" }),
  mk("bancada-teca",         "Bancada Maciça Teca",         "bancada", "tampos", 2000, 600, 40, { material: "Teca" }),
  mk("bancada-concreto",     "Bancada Concreto Aparente",   "bancada", "tampos", 2400, 600, 40, { material: "Concreto" }),
];

/* ============================================================
 *  2) PORTAS / GAVETAS / FRENTES
 * ============================================================ */

const FRENTES: CatalogItem[] = [
  mk("porta-lisa-mdf",         "Porta Lisa MDF",             "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "lisa"] }),
  mk("porta-fresada-classic",  "Porta Fresada Provençal",    "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "fresada"] }),
  mk("porta-shaker",           "Porta Shaker",               "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "shaker"] }),
  mk("porta-ripada",           "Porta Ripada",               "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "ripada"] }),
  mk("porta-canelada",         "Porta Canelada",             "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "canelada"] }),
  mk("porta-perfil-gola",      "Porta c/ Perfil Gola",       "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "gola"] }),
  mk("porta-vidro-canelado",   "Porta Vidro Canelado",       "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "vidro", "canelado"] }),
  mk("porta-vidro-fume",       "Porta Vidro Fumê",           "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "vidro", "fume"] }),
  mk("porta-vidro-reeded",     "Porta Vidro Reeded",         "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "vidro"] }),
  mk("porta-espelhada",        "Porta Espelhada",            "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "espelho"] }),
  mk("porta-basculante-alu",   "Porta Basculante Alumínio",  "porta", "portas-gavetas", 800, 18, 400, { tags: ["porta", "basculante"] }),
  mk("porta-veneziana",        "Porta Veneziana Ventilada",  "porta", "portas-gavetas", 400, 18, 720, { tags: ["porta", "veneziana"] }),
  mk("gaveta-100",             "Gaveta 100mm",               "gaveta","portas-gavetas", 600, 500, 100, { tags: ["gaveta", "baixa"] }),
  mk("gaveta-150",             "Gaveta 150mm",               "gaveta","portas-gavetas", 600, 500, 150, { tags: ["gaveta"] }),
  mk("gaveta-200",             "Gaveta 200mm",               "gaveta","portas-gavetas", 600, 500, 200, { tags: ["gaveta"] }),
  mk("gaveta-300",             "Gaveta 300mm",               "gaveta","portas-gavetas", 600, 500, 300, { tags: ["gaveta", "alta"] }),
  mk("gaveta-interna",         "Gaveta Interna",             "gaveta","portas-gavetas", 600, 450, 150, { tags: ["gaveta", "interna"] }),
  mk("gaveta-vidro",           "Gaveta com Frente de Vidro", "gaveta","portas-gavetas", 600, 500, 200, { tags: ["gaveta", "vidro"] }),
];

/* ============================================================
 *  3) FERRAGENS / ACESSÓRIOS
 * ============================================================ */

const FERRAGENS: CatalogItem[] = [
  mk("hardware-dobra-clip",    "Dobradiça Clip-On 110°",     "ferragem", "acessorios", 100, 100, 20, { brand: "Blum",   tags: ["ferragem", "dobradica"] }),
  mk("hardware-dobra-caneco",  "Dobradiça Caneco 35mm",       "ferragem", "acessorios", 100, 100, 20, { brand: "Hettich",tags: ["ferragem", "dobradica"] }),
  mk("hardware-slide-tandem",  "Corrediça Tandembox",         "ferragem", "acessorios", 500, 100, 200, { brand: "Blum",   tags: ["ferragem", "corredica"] }),
  mk("hardware-slide-quadro",  "Corrediça Quadro",             "ferragem", "acessorios", 500, 40, 40, { brand: "Blum",   tags: ["ferragem", "corredica"] }),
  mk("hardware-slide-legra",   "Corrediça Legrabox",           "ferragem", "acessorios", 500, 100, 200, { brand: "Blum",   tags: ["ferragem", "corredica", "premium"] }),
  mk("hardware-slide-innotech","Corrediça Innotech Atira",     "ferragem", "acessorios", 500, 100, 200, { brand: "Hettich",tags: ["ferragem", "corredica"] }),
  mk("hardware-aventos-hf",    "Aventos HF Basculante",        "ferragem", "acessorios", 800, 100, 400, { brand: "Blum",   tags: ["ferragem", "aventos"] }),
  mk("hardware-aventos-hk",    "Aventos HK-XS",                "ferragem", "acessorios", 800, 100, 400, { brand: "Blum",   tags: ["ferragem", "aventos"] }),
  mk("hardware-tip-on",        "Tip-On Push to Open",          "ferragem", "acessorios", 50, 30, 30, { brand: "Blum" }),
  mk("hardware-servo-drive",   "Servo-Drive Elétrico",         "ferragem", "acessorios", 300, 40, 40, { brand: "Blum" }),
  mk("hardware-canto-mag",     "Canto Mágico (LeMans)",        "ferragem", "acessorios", 900, 900, 600, { brand: "Kessebohmer" }),
  mk("hardware-sapateira-giro","Sapateira Basculante",         "ferragem", "acessorios", 800, 200, 200, { tags: ["ferragem", "sapateira"] }),
  mk("hardware-porta-talheres","Porta-Talheres Modular",       "ferragem", "acessorios", 800, 450, 50, { tags: ["ferragem", "talheres"] }),
  mk("hardware-porta-tempero", "Porta-Temperos Extraível",     "ferragem", "acessorios", 200, 500, 700, { tags: ["ferragem", "temperos"] }),
  mk("hardware-lixeira-emb",   "Lixeira Embutida Dupla",       "ferragem", "acessorios", 400, 500, 500, { tags: ["ferragem", "lixeira"] }),
  mk("hardware-cabideiro-ext", "Cabideiro Extraível",          "ferragem", "acessorios", 500, 40, 40, { tags: ["ferragem", "cabideiro"] }),
  mk("hardware-porta-cinto",   "Porta-Cintos Extraível",       "ferragem", "acessorios", 500, 40, 40, { tags: ["ferragem", "cinto"] }),
  mk("pe-nivelador-100",       "Pé Nivelador 100mm",           "pe",       "acessorios", 40, 40, 100, { tags: ["pe"] }),
  mk("pe-nivelador-150",       "Pé Nivelador 150mm",           "pe",       "acessorios", 40, 40, 150, { tags: ["pe"] }),
  mk("pe-mesa-inox",           "Pé de Mesa Inox 720mm",        "pe",       "acessorios", 80, 80, 720, { material: "Inox" }),
  mk("perfil-gola-h",          "Perfil Gola Horizontal Alu",   "perfil",   "acessorios", 3000, 40, 40, { material: "Alumínio" }),
  mk("perfil-gola-v",          "Perfil Gola Vertical Alu",     "perfil",   "acessorios", 3000, 40, 40, { material: "Alumínio" }),
  mk("perfil-j-alu",           "Perfil J Alumínio Puxador",    "perfil",   "acessorios", 3000, 30, 30, { material: "Alumínio" }),
  mk("puxador-alca-96",        "Puxador Alça 96mm",            "ferragem", "acessorios", 96, 30, 30, { material: "Aço" }),
  mk("puxador-alca-128",       "Puxador Alça 128mm",           "ferragem", "acessorios", 128, 30, 30 ),
  mk("puxador-alca-160",       "Puxador Alça 160mm",           "ferragem", "acessorios", 160, 30, 30 ),
  mk("puxador-alca-256",       "Puxador Alça 256mm",           "ferragem", "acessorios", 256, 30, 30 ),
  mk("puxador-cava",           "Puxador Cava Fresada",         "ferragem", "acessorios", 120, 20, 30 ),
  mk("puxador-conica",         "Puxador Cônico Bronze",        "ferragem", "acessorios", 40, 30, 30, { material: "Bronze" }),
];

/* ============================================================
 *  4) ILUMINAÇÃO
 * ============================================================ */

const ILUMINACAO: CatalogItem[] = [
  mk("led-fita-2700k",   "Fita LED 2700K",           "iluminacao", "iluminacao", 5000, 10, 5, { tags: ["led", "quente"] }),
  mk("led-fita-3000k",   "Fita LED 3000K",           "iluminacao", "iluminacao", 5000, 10, 5, { tags: ["led"] }),
  mk("led-fita-4000k",   "Fita LED 4000K Neutra",    "iluminacao", "iluminacao", 5000, 10, 5, { tags: ["led"] }),
  mk("led-fita-6500k",   "Fita LED 6500K Fria",      "iluminacao", "iluminacao", 5000, 10, 5, { tags: ["led"] }),
  mk("led-fita-rgb",     "Fita LED RGB c/ Controle", "iluminacao", "iluminacao", 5000, 12, 6, { tags: ["led", "rgb"] }),
  mk("perfil-led-embutir","Perfil LED Embutir Alu",  "iluminacao", "iluminacao", 2000, 24, 12, { tags: ["led", "perfil"] }),
  mk("perfil-led-sobrepor","Perfil LED Sobrepor",    "iluminacao", "iluminacao", 2000, 20, 20, { tags: ["led"] }),
  mk("spot-embutir",     "Spot Embutir Redondo 90mm","spot", "iluminacao", 90, 90, 60, { tags: ["spot"] }),
  mk("spot-embutir-quad","Spot Embutir Quadrado",    "spot", "iluminacao", 90, 90, 60, { tags: ["spot"] }),
  mk("spot-direcionavel","Spot Direcionável AR70",   "spot", "iluminacao", 100, 100, 100, { tags: ["spot", "ar70"] }),
  mk("pendente-globo",   "Pendente Globo Vidro",     "pendente", "iluminacao", 300, 300, 400, { tags: ["pendente"] }),
  mk("pendente-cone",    "Pendente Cone Metal",      "pendente", "iluminacao", 250, 250, 300, { tags: ["pendente"] }),
  mk("pendente-linear",  "Pendente Linear Sala Jantar", "pendente", "iluminacao", 1200, 100, 200, { tags: ["pendente"] }),
  mk("lustre-cristal",   "Lustre Cristal Clássico",  "pendente", "iluminacao", 700, 700, 900, { tags: ["lustre"] }),
  mk("arandela-tubular", "Arandela Tubular",         "arandela", "iluminacao", 100, 100, 400, { tags: ["arandela"] }),
  mk("arandela-leitura", "Arandela de Leitura",      "arandela", "iluminacao", 200, 200, 250, { tags: ["arandela"] }),
  mk("plafon-redondo",   "Plafon Redondo LED",       "iluminacao", "iluminacao", 400, 400, 60, { tags: ["plafon"] }),
  mk("plafon-quadrado",  "Plafon Quadrado LED",      "iluminacao", "iluminacao", 400, 400, 60, { tags: ["plafon"] }),
];

/* ============================================================
 *  5) ELETRODOMÉSTICOS (expansão)
 * ============================================================ */

const ELETROS: CatalogItem[] = [
  mk("geladeira-inverse",    "Geladeira Inverse 460L",       "geladeira",  "eletros", 700, 750, 1900, { brand: "Brastemp" }),
  mk("geladeira-french-plus","Geladeira French Door 540L",   "geladeira",  "eletros", 900, 780, 1830, { brand: "LG" }),
  mk("frigobar",             "Frigobar 120L",                "geladeira",  "eletros", 500, 520, 830,  { brand: "Consul" }),
  mk("adega-24g",            "Adega Climatizada 24 Garrafas","adega",      "eletros", 500, 590, 830,  { brand: "Electrolux" }),
  mk("adega-46g",            "Adega Climatizada 46 Garrafas","adega",      "eletros", 600, 590, 1500, { brand: "Electrolux" }),
  mk("cooktop-inducao-4",    "Cooktop Indução 4 Bocas",      "cooktop",    "eletros", 600, 520, 60,   { brand: "Electrolux" }),
  mk("cooktop-inducao-5",    "Cooktop Indução 5 Bocas",      "cooktop",    "eletros", 750, 520, 60,   { brand: "Fischer" }),
  mk("cooktop-domino",       "Cooktop Dominó Grill",         "cooktop",    "eletros", 300, 520, 60,   { brand: "Elica" }),
  mk("cooktop-gas-4",        "Cooktop Gás 4 Bocas",          "cooktop",    "eletros", 600, 510, 55 ),
  mk("forno-embutir-60",     "Forno Elétrico Embutido 60cm", "forno",      "eletros", 595, 560, 595,  { brand: "Bosch" }),
  mk("forno-embutir-90",     "Forno Elétrico Embutido 90cm", "forno",      "eletros", 900, 560, 480,  { brand: "Tecno" }),
  mk("forno-duplo",          "Forno Duplo Elétrico",         "forno",      "eletros", 595, 560, 900,  { brand: "Fischer" }),
  mk("micro-embutir",        "Microondas Embutido 25L",      "microondas", "eletros", 595, 380, 380,  { brand: "Electrolux" }),
  mk("micro-mesa",           "Microondas Mesa 30L",          "microondas", "eletros", 510, 400, 300,  { brand: "LG" }),
  mk("cafeteira-embutir",    "Cafeteira Embutida",           "microondas", "eletros", 595, 470, 455,  { brand: "Bosch", tags: ["cafeteira"] }),
  mk("coifa-parede-60",      "Coifa Parede 60cm",            "coifa",      "eletros", 600, 500, 700 ),
  mk("coifa-parede-120",     "Coifa Parede 120cm",           "coifa",      "eletros", 1200, 500, 700 ),
  mk("coifa-ilha-inox",      "Coifa Ilha Inox 90cm",         "coifa",      "eletros", 900, 600, 800 ),
  mk("coifa-tetotal",        "Coifa Teto Baixo",             "coifa",      "eletros", 900, 500, 200 ),
  mk("lava-loucas-8",        "Lava-Louças 8 Serviços",       "lava-loucas","eletros", 450, 600, 820,  { brand: "Brastemp" }),
  mk("lava-loucas-14",       "Lava-Louças 14 Serviços",      "lava-loucas","eletros", 600, 600, 820,  { brand: "Bosch" }),
  mk("lava-roupas-11",       "Lava-Roupas 11kg",             "lava-roupas","eletros", 630, 660, 1050, { brand: "Consul" }),
  mk("lava-e-seca",          "Lava e Seca 11kg",             "lava-roupas","eletros", 600, 640, 850,  { brand: "LG" }),
  mk("secadora",             "Secadora 10kg",                "lava-roupas","eletros", 600, 600, 850,  { brand: "Electrolux" }),
  mk("tv-55",                "TV 55” 4K",                    "tv",         "eletros", 1230, 60, 720,  { brand: "Samsung" }),
  mk("tv-65",                "TV 65” OLED",                  "tv",         "eletros", 1450, 60, 840,  { brand: "LG" }),
  mk("tv-75",                "TV 75” QLED",                  "tv",         "eletros", 1670, 60, 970,  { brand: "Samsung" }),
  mk("tv-85",                "TV 85” 8K",                    "tv",         "eletros", 1900, 60, 1090, { brand: "Sony" }),
];

/* ============================================================
 *  6) HIDRÁULICA / LOUÇAS / METAIS
 * ============================================================ */

const HIDRAULICA: CatalogItem[] = [
  mk("cuba-inox-simples",     "Cuba Inox Simples",           "cuba",         "hidraulica", 500, 400, 200, { material: "Inox" }),
  mk("cuba-inox-dupla",       "Cuba Inox Dupla",             "cuba",         "hidraulica", 900, 450, 200, { material: "Inox" }),
  mk("cuba-granito",          "Cuba em Granito",             "cuba",         "hidraulica", 500, 400, 180, { material: "Granito" }),
  mk("cuba-esculpida-marmore","Cuba Esculpida em Mármore",   "cuba",         "hidraulica", 700, 400, 100, { material: "Mármore" }),
  mk("cuba-apoio-cerâmica",   "Cuba de Apoio Cerâmica",      "cuba",         "hidraulica", 460, 460, 120, { material: "Cerâmica" }),
  mk("cuba-semi-encaixe",     "Cuba Semi-Encaixe",           "cuba",         "hidraulica", 500, 400, 150 ),
  mk("torneira-monocomando",  "Torneira Monocomando Bica Alta","torneira",   "hidraulica", 180, 60, 380,  { brand: "Deca" }),
  mk("torneira-parede",       "Torneira de Parede Gourmet",  "torneira",     "hidraulica", 220, 60, 200,  { brand: "Docol" }),
  mk("torneira-cozinha-flex", "Torneira Cozinha Flexível",   "torneira",     "hidraulica", 200, 60, 400,  { brand: "Franke" }),
  mk("torneira-bica-baixa",   "Torneira Bica Baixa Banheiro","torneira",     "hidraulica", 130, 50, 120,  { brand: "Deca" }),
  mk("misturador-ducha",      "Misturador c/ Ducha Higiênica","torneira",    "hidraulica", 150, 60, 200,  { brand: "Docol" }),
  mk("chuveiro-ducha",        "Ducha Quadrada 200mm",         "chuveiro",     "hidraulica", 200, 200, 40,  { brand: "Deca" }),
  mk("chuveiro-tubular",      "Chuveiro Tubular Redondo",     "chuveiro",     "hidraulica", 250, 250, 40,  { brand: "Lorenzetti" }),
  mk("chuveiro-cascata",      "Chuveiro Cascata Sensação",    "chuveiro",     "hidraulica", 400, 200, 60,  { brand: "Deca" }),
  mk("vaso-cx-acoplada",      "Vaso c/ Caixa Acoplada",       "vaso-sanitario","hidraulica",380, 700, 780, { brand: "Deca" }),
  mk("vaso-suspenso",         "Vaso Suspenso c/ Caixa Embutida","vaso-sanitario","hidraulica",370, 550, 400,{ brand: "Deca" }),
  mk("bide-suspenso",         "Bidê Suspenso",                "vaso-sanitario","hidraulica",370, 550, 400 ),
  mk("banheira-freestanding", "Banheira Freestanding Oval",   "banheira",     "hidraulica", 1700, 800, 600, { material: "Resina" }),
  mk("banheira-hidro",        "Banheira Hidromassagem",       "banheira",     "hidraulica", 1800, 900, 550 ),
  mk("banheira-vitoriana",    "Banheira Vitoriana c/ Pés",    "banheira",     "hidraulica", 1700, 800, 700 ),
];

/* ============================================================
 *  7) MÓVEIS SOLTOS — sala, quarto, escritório, jantar
 * ============================================================ */

const MOVEIS: CatalogItem[] = [
  mk("sofa-2l",       "Sofá 2 Lugares",             "sofa",   "moveis-soltos", 1600, 900, 850, { tags: ["sofa"] }),
  mk("sofa-3l",       "Sofá 3 Lugares",             "sofa",   "moveis-soltos", 2200, 950, 850 ),
  mk("sofa-retratil", "Sofá Retrátil 4L",           "sofa",   "moveis-soltos", 2600, 1600, 850 ),
  mk("sofa-l",        "Sofá em L com Chaise",       "sofa",   "moveis-soltos", 2800, 1800, 850 ),
  mk("sofa-modular",  "Sofá Modular 6 Módulos",     "sofa",   "moveis-soltos", 3400, 1000, 850 ),
  mk("poltrona-charles","Poltrona Charles Eames",   "poltrona","moveis-soltos", 830, 830, 830 ),
  mk("poltrona-costela","Poltrona Costela",         "poltrona","moveis-soltos", 850, 900, 780 ),
  mk("poltrona-papai",  "Poltrona Papai Reclinável","poltrona","moveis-soltos", 900, 950, 1050 ),
  mk("puff-quadrado", "Puff Quadrado",              "poltrona","moveis-soltos", 500, 500, 400 ),
  mk("mesa-jantar-4",  "Mesa de Jantar 4 Lugares",  "mesa",   "moveis-soltos", 1200, 900, 780 ),
  mk("mesa-jantar-6",  "Mesa de Jantar 6 Lugares",  "mesa",   "moveis-soltos", 1800, 1000, 780 ),
  mk("mesa-jantar-8",  "Mesa de Jantar 8 Lugares",  "mesa",   "moveis-soltos", 2400, 1100, 780 ),
  mk("mesa-jantar-10", "Mesa de Jantar 10 Lugares", "mesa",   "moveis-soltos", 3000, 1100, 780 ),
  mk("mesa-redonda-4", "Mesa Redonda 4 Lugares",    "mesa",   "moveis-soltos", 1200, 1200, 780 ),
  mk("mesa-centro",    "Mesa de Centro",            "mesa",   "moveis-soltos", 1200, 700, 400 ),
  mk("mesa-lateral",   "Mesa Lateral",              "mesa",   "moveis-soltos", 500, 500, 500 ),
  mk("mesa-escritorio","Mesa de Escritório L",      "mesa",   "moveis-soltos", 1600, 1400, 750 ),
  mk("mesa-reuniao",   "Mesa de Reunião 8 lugares", "mesa",   "moveis-soltos", 2400, 1200, 750 ),
  mk("cadeira-jantar", "Cadeira Jantar Estofada",   "cadeira","moveis-soltos", 500, 550, 900 ),
  mk("cadeira-eames",  "Cadeira Eames DSW",         "cadeira","moveis-soltos", 460, 550, 810 ),
  mk("cadeira-wishbone","Cadeira Wishbone",         "cadeira","moveis-soltos", 550, 520, 760 ),
  mk("cadeira-bar",    "Banqueta Bar 750mm",         "cadeira","moveis-soltos", 400, 400, 750 ),
  mk("cadeira-office", "Cadeira Presidente Office", "cadeira","moveis-soltos", 700, 700, 1100 ),
  mk("cama-queen",     "Cama Queen 158x198",         "cama",   "moveis-soltos", 1680, 2080, 1050 ),
  mk("cama-king",      "Cama King 193x203",          "cama",   "moveis-soltos", 2030, 2130, 1050 ),
  mk("cama-super-king","Cama Super King 203x203",    "cama",   "moveis-soltos", 2130, 2130, 1050 ),
  mk("cama-solteiro",  "Cama Solteiro 88x188",       "cama",   "moveis-soltos", 980, 1980, 900 ),
  mk("cama-box-baú",   "Cama Box Baú Casal",         "cama",   "moveis-soltos", 1580, 2000, 550 ),
  mk("criado-1g",      "Criado-Mudo 1 Gaveta",       "criado-mudo","moveis-soltos", 500, 450, 550 ),
  mk("criado-2g",      "Criado-Mudo 2 Gavetas",      "criado-mudo","moveis-soltos", 600, 450, 600 ),
  mk("estante-livros", "Estante de Livros 6 Prateleiras","estante","moveis-soltos", 900, 350, 2100 ),
  mk("estante-modular","Estante Modular Composição","estante","moveis-soltos", 2400, 400, 2100 ),
  mk("aparador-classico","Aparador Clássico 4 Portas","aparador","moveis-soltos", 1800, 450, 850 ),
  mk("aparador-sala","Aparador Sala Nogueira",       "aparador","moveis-soltos", 1400, 400, 780 ),
  mk("rack-tv",       "Rack TV Suspenso",            "aparador","moveis-soltos", 2000, 400, 400 ),
  mk("home-theater",  "Home Theater Modular",        "estante","moveis-soltos", 3000, 500, 2400 ),
];

/* ============================================================
 *  8) DECORAÇÃO / TÊXTIL
 * ============================================================ */

const DECOR: CatalogItem[] = [
  mk("tapete-retangular", "Tapete Retangular 2x3",     "tapete",     "textil",    2000, 3000, 10, { tags: ["tapete"] }),
  mk("tapete-redondo",    "Tapete Redondo 2m",         "tapete",     "textil",    2000, 2000, 10 ),
  mk("tapete-runner",     "Passadeira 80x300",         "tapete",     "textil",    800, 3000, 10 ),
  mk("cortina-linho",     "Cortina Linho c/ Trilho",   "cortina",    "textil",    3000, 100, 2700 ),
  mk("cortina-blackout",  "Cortina Blackout Duplo Trilho","cortina", "textil",    3000, 100, 2700 ),
  mk("cortina-voil",      "Cortina Voil Off-White",    "cortina",    "textil",    3000, 100, 2700 ),
  mk("persiana-rolo",     "Persiana Rolo Solar",       "persiana",   "textil",    1500, 50, 2000 ),
  mk("persiana-romana",   "Persiana Romana Bandô",     "persiana",   "textil",    1500, 100, 2000 ),
  mk("persiana-horizontal","Persiana Horizontal Alu 25mm","persiana","textil",    1500, 30, 2000 ),
  mk("persiana-vertical", "Persiana Vertical",         "persiana",   "textil",    2000, 60, 2400 ),
  mk("quadro-abstrato",   "Quadro Abstrato Grande",    "quadro",     "decoracao", 1400, 40, 1000 ),
  mk("quadro-galeria",    "Composição Galeria 6 quadros","quadro",   "decoracao", 2000, 40, 1200 ),
  mk("espelho-decor",     "Espelho Decorativo Orgânico","quadro",    "decoracao", 800, 40, 1200 ),
  mk("vaso-cachepot-g",   "Cachepot Cerâmica Grande",  "vaso-planta","decoracao", 400, 400, 500 ),
  mk("vaso-cachepot-m",   "Cachepot Cerâmica Médio",   "vaso-planta","decoracao", 300, 300, 400 ),
  mk("planta-monstera",   "Planta Monstera Deliciosa", "planta",     "decoracao", 800, 800, 1400 ),
  mk("planta-strelitzia", "Planta Strelitzia Nicolai", "planta",     "decoracao", 900, 900, 1800 ),
  mk("planta-olive",      "Oliveira em Vaso",          "planta",     "decoracao", 800, 800, 2000 ),
  mk("planta-suculenta",  "Suculenta em Vaso",         "planta",     "decoracao", 200, 200, 200 ),
  mk("planta-pendente",   "Planta Pendente Jiboia",    "planta",     "decoracao", 300, 300, 900 ),
  mk("luminaria-mesa-classica","Luminária de Mesa Clássica","luminaria","decoracao", 350, 350, 550 ),
  mk("luminaria-piso-arco","Luminária de Piso em Arco","luminaria",  "decoracao", 1200, 300, 2000 ),
  mk("luminaria-piso-tripe","Luminária de Piso Tripé", "luminaria",  "decoracao", 600, 600, 1600 ),
  mk("objeto-vaso-alto",  "Vaso Decorativo Alto",      "objeto-deco","decoracao", 300, 300, 800 ),
  mk("objeto-bowl",       "Bowl Decorativo Mármore",   "objeto-deco","decoracao", 400, 400, 120 ),
  mk("objeto-castical",   "Castiçal Trio Metal",       "objeto-deco","decoracao", 300, 100, 300 ),
];

/* ============================================================
 *  9) PISOS / REVESTIMENTOS / PAREDES-TETO — expansão
 * ============================================================ */

const ACABAMENTOS: CatalogItem[] = [
  mk("piso-porcel-preto",     "Porcelanato Preto 60x120",    "piso", "pisos", 1200, 600, 10, { material: "Porcelanato", color: "Preto" }),
  mk("piso-porcel-terracota", "Porcelanato Terracota 60x60", "piso", "pisos", 600, 600, 10, { material: "Porcelanato", color: "Terracota" }),
  mk("piso-porcel-cimento",   "Porcelanato Cimento Queimado","piso", "pisos", 900, 900, 10, { material: "Porcelanato" }),
  mk("piso-madeira-freijo",   "Piso Madeira Freijó",         "piso", "pisos", 1200, 190, 15, { material: "Madeira", color: "Freijó" }),
  mk("piso-madeira-cumaru",   "Piso Madeira Cumaru",         "piso", "pisos", 1200, 190, 15, { material: "Madeira", color: "Cumaru" }),
  mk("piso-madeira-ipe",      "Piso Madeira Ipê",            "piso", "pisos", 1200, 190, 15, { material: "Madeira", color: "Ipê" }),
  mk("piso-vinilico-carvalho","Vinílico LVT Carvalho",       "piso", "pisos", 1200, 180, 4,  { material: "Vinílico LVT", color: "Carvalho" }),
  mk("piso-vinilico-preto",   "Vinílico LVT Preto",          "piso", "pisos", 1200, 180, 4 ),
  mk("piso-taco-classico",    "Taco Clássico Madeira",       "piso", "pisos", 400, 100, 15, { material: "Madeira" }),
  mk("piso-marmore-branco",   "Piso Mármore Branco",         "piso", "pisos", 800, 800, 20, { material: "Mármore" }),
  mk("piso-granilite",        "Piso Granilite Retrô",        "piso", "pisos", 400, 400, 20 ),
  mk("piso-microcimento",     "Piso Microcimento",           "piso", "pisos", 3000, 3000, 8 ),
  mk("azulejo-subway-preto",  "Azulejo Subway Preto",         "azulejo","revestimentos", 200, 8, 100, { color: "Preto" }),
  mk("azulejo-portugues",     "Azulejo Português Estampado",  "azulejo","revestimentos", 200, 8, 200 ),
  mk("azulejo-marmore-branco","Azulejo Efeito Mármore",       "azulejo","revestimentos", 300, 8, 600 ),
  mk("azulejo-fish-scale",    "Azulejo Escama de Peixe",      "azulejo","revestimentos", 100, 8, 120 ),
  mk("papel-parede-listrado", "Papel de Parede Listrado",     "papel-parede","revestimentos", 2500, 1, 2500 ),
  mk("papel-parede-boiserie", "Papel de Parede Boiserie",     "papel-parede","revestimentos", 2500, 1, 2500 ),
  mk("revest-cimenticio-3d",  "Revestimento Cimentício 3D",   "revestimento","revestimentos", 300, 20, 300 ),
  mk("boiserie-classica",     "Boiserie Clássica MDF",        "revestimento","revestimentos", 2400, 20, 2700 ),
  mk("ripado-metal-dourado",  "Ripado Metálico Dourado",      "revestimento","revestimentos", 2400, 20, 200 ),
  mk("parede-vidro-black",    "Parede Vidro Aramado Black",   "parede", "paredes-teto", 3000, 100, 2700, { material: "Vidro/Aço" }),
  mk("parede-alvenaria-tijolo","Parede Tijolo à Vista",       "parede", "paredes-teto", 3000, 150, 2700 ),
  mk("teto-madeira-ripado",   "Forro Ripado Madeira",         "teto",   "paredes-teto", 3000, 3000, 30 ),
  mk("teto-lambri",           "Forro Lambri PVC",             "teto",   "paredes-teto", 3000, 3000, 15 ),
  mk("sanca-aberta",          "Sanca Aberta LED",             "teto",   "paredes-teto", 3000, 300, 200 ),
];

/* ============================================================
 *  10) ABERTURAS — expansão
 * ============================================================ */

const ABERTURAS_EXTRA: CatalogItem[] = [
  mk("janela-fixa",             "Janela Fixa Panorâmica",    "janela",         "aberturas", 2400, 100, 1200, { material: "Alumínio" }),
  mk("janela-pivotante",        "Janela Pivotante",          "janela",         "aberturas", 1000, 100, 1200 ),
  mk("janela-oitao",            "Janela Oitão Triangular",   "janela",         "aberturas", 1200, 100, 800 ),
  mk("janela-arco",             "Janela em Arco",            "janela",         "aberturas", 1200, 100, 1400 ),
  mk("porta-blindada",          "Porta Blindada Entrada",    "porta-ambiente", "aberturas", 900, 80, 2100, { material: "Aço" }),
  mk("porta-vidro-temperado",   "Porta Vidro Temperado",     "porta-correr",   "aberturas", 900, 10, 2100, { material: "Vidro temperado" }),
  mk("porta-pivotante-madeira", "Porta Pivotante Madeira Nobre","porta-ambiente","aberturas", 1200, 60, 2400 ),
  mk("porta-correr-embutida",   "Porta Correr Embutida na Parede","porta-correr","aberturas", 1000, 40, 2100 ),
  mk("porta-dupla-abrir",       "Porta Dupla de Abrir",      "porta-ambiente", "aberturas", 1600, 40, 2100 ),
  mk("portao-social",           "Portão Social Alumínio",    "porta-ambiente", "aberturas", 1000, 60, 2100 ),
  mk("portao-basculante",       "Portão Basculante Garagem", "porta-ambiente", "aberturas", 3000, 100, 2400 ),
];

/* ============================================================
 *  Consolidação
 * ============================================================ */

export const EXTENDED_CATALOG_ITEMS: readonly CatalogItem[] = [
  ...ARMARIOS,
  ...AEREOS,
  ...BALCOES,
  ...TORRES,
  ...ROUPEIROS,
  ...CLOSETS,
  ...PAINEIS,
  ...NICHOS,
  ...TAMPOS,
  ...FRENTES,
  ...FERRAGENS,
  ...ILUMINACAO,
  ...ELETROS,
  ...HIDRAULICA,
  ...MOVEIS,
  ...DECOR,
  ...ACABAMENTOS,
  ...ABERTURAS_EXTRA,
];

export const EXTENDED_CATALOG_COUNT = EXTENDED_CATALOG_ITEMS.length;