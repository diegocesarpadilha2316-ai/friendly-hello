/**
 * Fase 3.8 — IA Decoradora: paletas de materiais e cores.
 *
 * Amostras de materiais sugeridas pela IA — não geram nós no projeto,
 * apenas orientam a paleta e a especificação futura de Render e
 * Marketplace.
 */
import type { DecorMaterialSample } from "./types";

export const DECOR_MATERIALS: readonly DecorMaterialSample[] = [
  {
    id: "mat.madeira.freijo",
    family: "madeira",
    name: "Freijó natural",
    description: "Madeira quente, veios marcados.",
    color: "#8A5A2B",
    tags: ["nobre", "quente"],
    styles: ["contemporaneo", "classico", "japandi", "escandinavo"],
  },
  {
    id: "mat.madeira.carvalho",
    family: "madeira",
    name: "Carvalho claro",
    description: "Base clara, ampla e serena.",
    color: "#C9A26B",
    tags: ["clara"],
    styles: ["escandinavo", "japandi", "minimalista", "contemporaneo"],
  },
  {
    id: "mat.madeira.demolicao",
    family: "madeira",
    name: "Madeira demolição",
    description: "Textura rústica autêntica.",
    color: "#6E5140",
    tags: ["rústica"],
    styles: ["industrial", "rustico", "boho"],
  },

  {
    id: "mat.pedra.saotome",
    family: "pedra",
    name: "Pedra São Tomé",
    description: "Piso rústico resistente.",
    color: "#8B7355",
    tags: ["rústica"],
    styles: ["rustico", "boho"],
  },
  {
    id: "mat.porcelanato.offwhite",
    family: "porcelanato",
    name: "Porcelanato off-white",
    description: "Base neutra brilhante.",
    color: "#EDEBE6",
    tags: ["neutro"],
    styles: ["minimalista", "moderno", "escandinavo", "corporativo"],
  },
  {
    id: "mat.porcelanato.cimenticio",
    family: "porcelanato",
    name: "Porcelanato cimentício",
    description: "Estética urbana.",
    color: "#8A8A8A",
    tags: ["cimento"],
    styles: ["industrial", "corporativo", "moderno"],
  },

  {
    id: "mat.marmore.calacatta",
    family: "marmore",
    name: "Mármore Calacatta",
    description: "Branco com veios dourados.",
    color: "#F1E7D0",
    tags: ["nobre", "premium"],
    styles: ["luxo", "classico", "contemporaneo"],
  },
  {
    id: "mat.marmore.travertino",
    family: "marmore",
    name: "Travertino romano",
    description: "Textura orgânica bege.",
    color: "#D9C6A8",
    tags: ["orgânico"],
    styles: ["classico", "japandi", "contemporaneo"],
  },
  {
    id: "mat.granito.sao_gabriel",
    family: "granito",
    name: "Granito São Gabriel",
    description: "Preto grafite pontuado.",
    color: "#2E2E2E",
    tags: ["escuro"],
    styles: ["moderno", "corporativo", "industrial"],
  },

  {
    id: "mat.metal.latao",
    family: "metal",
    name: "Latão polido",
    description: "Ponto dourado premium.",
    color: "#C9A227",
    tags: ["premium"],
    styles: ["luxo", "classico", "contemporaneo"],
  },
  {
    id: "mat.metal.aco_escovado",
    family: "metal",
    name: "Aço escovado",
    description: "Contemporâneo, resistente.",
    color: "#B0B7BF",
    tags: ["neutro"],
    styles: ["moderno", "corporativo", "industrial"],
  },

  {
    id: "mat.vidro.canelado",
    family: "vidro",
    name: "Vidro canelado",
    description: "Translúcido texturizado.",
    color: "#DCE7EA",
    tags: ["translúcido"],
    styles: ["contemporaneo", "japandi", "moderno"],
  },

  {
    id: "mat.tecido.linho",
    family: "tecido",
    name: "Linho natural",
    description: "Base têxtil calma.",
    color: "#EDE7D6",
    tags: ["natural"],
    styles: ["escandinavo", "japandi", "minimalista", "contemporaneo"],
  },
  {
    id: "mat.tecido.veludo.esmeralda",
    family: "tecido",
    name: "Veludo esmeralda",
    description: "Ponto dramático de cor.",
    color: "#0F5132",
    tags: ["dramático"],
    styles: ["luxo", "classico"],
  },

  {
    id: "mat.cor.aurora",
    family: "cor",
    name: "Aurora Dioris",
    description: "Gradiente característico da marca.",
    color: "#8B5CF6",
    tags: ["marca"],
    styles: ["moderno", "contemporaneo", "corporativo"],
  },
  {
    id: "mat.combo.japandi",
    family: "combinacao",
    name: "Combinação Japandi",
    description: "Freijó + linho + cerâmica fosca.",
    color: "#C8B69A",
    tags: ["combinação"],
    styles: ["japandi"],
  },
  {
    id: "mat.combo.industrial",
    family: "combinacao",
    name: "Combinação Industrial",
    description: "Aço + concreto + demolição.",
    color: "#6E5140",
    tags: ["combinação"],
    styles: ["industrial"],
  },
];

export function materialsByStyle(styleId: string): DecorMaterialSample[] {
  return DECOR_MATERIALS.filter((m) =>
    m.styles.includes(styleId as DecorMaterialSample["styles"][number]),
  );
}

export function getDecorMaterial(id: string): DecorMaterialSample | undefined {
  return DECOR_MATERIALS.find((m) => m.id === id);
}
