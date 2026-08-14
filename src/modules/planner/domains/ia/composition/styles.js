const P = (style, density, gap, pools, language) => ({ style, density, gap, pools, language });
export const STYLE_PROFILES = {
  moderno: P(
    "moderno",
    1,
    20,
    {
      ancora: ["tapete-3x2", "tapete-2x1_5", "tapete-retangular"],
      iluminacao: ["pendente-cluster", "pendente-cone", "luminaria-piso"],
      verde: ["planta-monstera", "vaso-planta-alto", "planta-suculenta"],
      arte: ["quadro-abstrato", "espelho-redondo"],
      objeto: ["livros-decor", "bandeja-decor", "objeto-bowl"],
      conforto: ["poltrona-charles", "puff-quadrado"],
    },
    "linhas retas, volumes continuos e paleta sobria",
  ),
  contemporaneo: P(
    "contemporaneo",
    1.05,
    20,
    {
      ancora: ["tapete-3x2", "tapete-redondo", "tapete-2x1_5"],
      iluminacao: ["pendente-cluster", "luminaria-piso-arco", "luminaria-piso"],
      verde: ["planta-strelitzia", "planta-costela-adao", "vaso-cachepot-g"],
      arte: ["quadro-galeria", "espelho-decor", "quadro-abstrato"],
      objeto: ["objeto-bowl", "livros-decor", "objeto-escultura"],
      conforto: ["poltrona-costela", "puff"],
    },
    "mistura calibrada de texturas naturais com marcenaria limpa",
  ),
  minimalista: P(
    "minimalista",
    0.6,
    30,
    {
      ancora: ["tapete-2x1_5", "tapete-passadeira"],
      iluminacao: ["pendente-cone", "plafon-redondo"],
      verde: ["planta-olive", "planta-suculenta"],
      arte: ["quadro-abstrato"],
      objeto: ["objeto-bowl", "livros-decor"],
      conforto: ["puff-quadrado"],
    },
    "vazio como elemento de projeto, poucos objetos e muita repeticao",
  ),
  industrial: P(
    "industrial",
    0.85,
    16,
    {
      ancora: ["tapete-retangular", "tapete-2x1_5"],
      iluminacao: ["pendente-cluster", "luminaria-piso-tripe", "arandela-parede"],
      verde: ["planta-ficus", "planta-costela-adao"],
      arte: ["quadro-galeria", "relogio-parede"],
      objeto: ["objeto-castical", "livros-decor"],
      conforto: ["poltrona-costela", "cadeira-eames"],
    },
    "materialidade crua, metal aparente e composicao assimetrica",
  ),
  classico: P(
    "classico",
    1.15,
    14,
    {
      ancora: ["tapete-3x2", "tapete-redondo"],
      iluminacao: ["lustre-cristal", "luminaria-mesa-classica", "arandela-parede"],
      verde: ["planta-olive", "vaso-cachepot-g", "vaso-planta-medio"],
      arte: ["quadro-triptico", "espelho-redondo", "relogio-parede"],
      objeto: ["objeto-castical", "bandeja-decor", "livros-decor"],
      conforto: ["poltrona-papai", "puff"],
    },
    "simetria, molduras e hierarquia central marcada",
  ),
  luxo: P(
    "luxo",
    1.2,
    18,
    {
      ancora: ["tapete-3x2", "tapete-redondo"],
      iluminacao: ["lustre-cristal", "pendente-cluster", "luminaria-piso-arco"],
      verde: ["planta-strelitzia", "planta-olive", "vaso-cachepot-g"],
      arte: ["espelho-decor", "quadro-galeria"],
      objeto: ["objeto-bowl", "objeto-escultura", "bandeja-decor"],
      conforto: ["poltrona-charles", "puff"],
    },
    "materiais nobres, brilho controlado e ponto focal unico",
  ),
};
const STYLE_ALIASES = [
  { style: "minimalista", words: ["minimal", "clean", "escandinav"] },
  { style: "industrial", words: ["industrial", "loft", "urbano"] },
  { style: "classico", words: ["classic", "clássic", "provenc", "provenç", "neoclas"] },
  { style: "luxo", words: ["luxo", "luxuos", "premium", "sofistic", "high end"] },
  { style: "contemporaneo", words: ["contempor", "organic", "orgânic"] },
  { style: "moderno", words: ["moderno", "moderna"] },
];
/** Normaliza qualquer rotulo de estilo (do Blueprint ou do texto) num perfil. */
export function resolveStyle(raw) {
  if (!raw) return "moderno";
  const t = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const a of STYLE_ALIASES) if (a.words.some((w) => t.includes(w))) return a.style;
  return "moderno";
}
export function styleProfile(style) {
  return STYLE_PROFILES[style];
}
