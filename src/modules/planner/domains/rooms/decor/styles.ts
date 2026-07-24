/**
 * Fase 3.8 — IA Decoradora: catálogo de estilos.
 *
 * Fonte única de verdade para as afinidades de estilo. Consumido pelos
 * componentes de UI, pelo motor de regras e por qualquer futura IA real.
 */
import type { DecorStyle } from "./types";

export const DECOR_STYLES: readonly DecorStyle[] = [
  {
    id: "moderno",
    name: "Moderno",
    description: "Linhas retas, superfícies limpas e paleta neutra com um acento contemporâneo.",
    palette: ["#111318", "#2A2E36", "#E7E5DE", "#B7A78A", "#3B82F6"],
    materials: ["MDF laqueado", "porcelanato acetinado", "metal escovado", "vidro temperado"],
    lightTemperature: "neutra",
    suitedFor: ["sala", "cozinha", "dormitorio", "escritorio", "corporativo"],
    tags: ["neutro", "reto", "elegante"],
  },
  {
    id: "contemporaneo",
    name: "Contemporâneo",
    description: "Equilíbrio entre atualidade e conforto — texturas e curvas suaves.",
    palette: ["#1A1D24", "#F5F1EA", "#C9AE7C", "#7A6A55", "#38618C"],
    materials: ["madeira freijó", "linho", "porcelanato mate", "aço inox"],
    lightTemperature: "quente",
    suitedFor: ["sala", "cozinha", "dormitorio", "closet"],
    tags: ["confortável", "atual"],
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Menos é mais — paleta reduzida, mobiliário essencial, iluminação embutida.",
    palette: ["#0F1113", "#FFFFFF", "#EDEBE6", "#BDB9B0"],
    materials: ["MDF branco", "concreto polido", "porcelanato off-white"],
    lightTemperature: "neutra",
    suitedFor: ["sala", "escritorio", "dormitorio", "banheiro"],
    tags: ["clean", "essencial"],
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Aço, concreto e madeira crua — trilhos aparentes, luminárias metálicas.",
    palette: ["#1B1B1B", "#3B3B3B", "#8A6E4B", "#B7B4A9", "#D97706"],
    materials: ["aço bruto", "concreto aparente", "madeira demolição", "tijolo aparente"],
    lightTemperature: "quente",
    suitedFor: ["sala", "cozinha", "comercial", "corporativo"],
    tags: ["urbano", "cru", "loft"],
  },
  {
    id: "escandinavo",
    name: "Escandinavo",
    description: "Luz natural, madeira clara, brancos amplos e toques têxteis.",
    palette: ["#F5F2EC", "#DCDACB", "#B8956A", "#2F3E46", "#84A98C"],
    materials: ["carvalho claro", "linho natural", "lã", "porcelanato palha"],
    lightTemperature: "neutra",
    suitedFor: ["sala", "dormitorio", "escritorio", "cozinha"],
    tags: ["claro", "aconchegante", "natural"],
  },
  {
    id: "classico",
    name: "Clássico",
    description: "Simetria, molduras e paleta atemporal — madeira nobre e tecidos ricos.",
    palette: ["#2B1A11", "#6B4423", "#C7A26A", "#F1E7D0", "#3B3F5A"],
    materials: ["madeira nogueira", "mármore travertino", "veludo", "bronze"],
    lightTemperature: "quente",
    suitedFor: ["sala", "dormitorio", "escritorio"],
    tags: ["atemporal", "sofisticado"],
  },
  {
    id: "luxo",
    name: "Luxo",
    description: "Mármores, dourados e iluminação cenográfica — impacto visual.",
    palette: ["#0B0B0F", "#1E1E2E", "#C9A227", "#F2E9D0", "#7E1D2A"],
    materials: ["mármore Calacatta", "latão polido", "veludo", "onix retroiluminado"],
    lightTemperature: "quente",
    suitedFor: ["sala", "dormitorio", "banheiro", "closet", "comercial"],
    tags: ["premium", "cinematográfico"],
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Fusão de calma japonesa e simplicidade escandinava — madeira, papel, linho.",
    palette: ["#F1EBDD", "#C8B69A", "#5C4A3B", "#2E2A26", "#8E9A6B"],
    materials: ["carvalho fumê", "papel washi", "linho", "cerâmica fosca"],
    lightTemperature: "quente",
    suitedFor: ["sala", "dormitorio", "banheiro", "escritorio"],
    tags: ["zen", "orgânico"],
  },
  {
    id: "boho",
    name: "Boho",
    description: "Camadas de texturas, tapeçarias, plantas e cores terrosas.",
    palette: ["#F2E1C1", "#C97B63", "#8E5B3E", "#5D8A66", "#2E3532"],
    materials: ["fibra natural", "rattan", "algodão cru", "cerâmica esmaltada"],
    lightTemperature: "quente",
    suitedFor: ["sala", "dormitorio", "escritorio"],
    tags: ["artesanal", "livre"],
  },
  {
    id: "rustico",
    name: "Rústico",
    description: "Madeira de demolição, pedra bruta, ferro forjado — clima aconchegante.",
    palette: ["#3B2A1E", "#6E5140", "#B08968", "#DDB892", "#7F5539"],
    materials: ["madeira demolição", "pedra São Tomé", "ferro forjado", "couro"],
    lightTemperature: "quente",
    suitedFor: ["sala", "cozinha", "dormitorio"],
    tags: ["rústico", "acolhedor"],
  },
  {
    id: "corporativo",
    name: "Corporativo",
    description: "Neutralidade profissional, luz uniforme, materiais duráveis.",
    palette: ["#0F172A", "#1E293B", "#94A3B8", "#F1F5F9", "#0EA5E9"],
    materials: ["MDF grafite", "porcelanato cimenticio", "tecido acústico", "vidro"],
    lightTemperature: "fria",
    suitedFor: ["escritorio", "corporativo", "comercial"],
    tags: ["profissional", "sóbrio"],
  },
  {
    id: "infantil",
    name: "Infantil",
    description: "Cores lúdicas, formas suaves e mobiliário seguro.",
    palette: ["#FEF3C7", "#FCA5A5", "#93C5FD", "#A7F3D0", "#F9A8D4"],
    materials: ["MDF laqueado colorido", "tecido antialérgico", "cortiça"],
    lightTemperature: "quente",
    suitedFor: ["dormitorio", "sala", "escritorio"],
    tags: ["lúdico", "colorido"],
  },
];

export function getDecorStyle(id: string): DecorStyle {
  return DECOR_STYLES.find((s) => s.id === id) ?? DECOR_STYLES[0];
}

export const DEFAULT_DECOR_STYLE_ID: (typeof DECOR_STYLES)[number]["id"] = "contemporaneo";