/**
 * Fase 3.12 — Objetos decorativos e mobiliário de composição.
 * Metadados para a cena de render — o Editor 3D existente pode
 * instanciar via biblioteca sem duplicar catálogo.
 */
import type { PropAsset } from "../../types/ultra";

export const PROP_ASSETS: readonly PropAsset[] = [
  {
    id: "prop.livros.pilha",
    category: "livros",
    label: "Pilha de Livros",
    dimensionsMm: [300, 220, 160],
    tags: ["decor"],
  },
  {
    id: "prop.vaso.ceramica",
    category: "vasos",
    label: "Vaso Cerâmica",
    dimensionsMm: [220, 220, 350],
  },
  {
    id: "prop.quadro.abstrato",
    category: "quadros",
    label: "Quadro Abstrato",
    dimensionsMm: [900, 40, 1200],
  },
  {
    id: "prop.tapete.persa",
    category: "tapetes",
    label: "Tapete Persa",
    dimensionsMm: [2400, 15, 1600],
  },
  {
    id: "prop.cortina.linho",
    category: "cortinas",
    label: "Cortina Linho",
    dimensionsMm: [2200, 40, 2800],
  },
  {
    id: "prop.persiana.rolo",
    category: "persianas",
    label: "Persiana Rolô",
    dimensionsMm: [1800, 50, 2200],
  },
  { id: "prop.tv.65", category: "tv", label: 'TV 65"', dimensionsMm: [1450, 60, 830] },
  {
    id: "prop.notebook.14",
    category: "notebook",
    label: 'Notebook 14"',
    dimensionsMm: [320, 15, 220],
  },
  {
    id: "prop.utensilios.cozinha",
    category: "utensilios",
    label: "Utensílios de Cozinha",
    dimensionsMm: [400, 200, 300],
  },
  {
    id: "prop.loucas.jantar",
    category: "loucas",
    label: "Jogo de Louças",
    dimensionsMm: [400, 400, 200],
  },
  {
    id: "prop.sofa.3lugares",
    category: "sofa",
    label: "Sofá 3 Lugares",
    dimensionsMm: [2400, 950, 850],
  },
  {
    id: "prop.poltrona.classic",
    category: "poltrona",
    label: "Poltrona Clássica",
    dimensionsMm: [850, 900, 900],
  },
  {
    id: "prop.mesa.jantar.8",
    category: "mesa",
    label: "Mesa de Jantar 8p",
    dimensionsMm: [2400, 1000, 750],
  },
  {
    id: "prop.cadeira.eames",
    category: "cadeira",
    label: "Cadeira Design",
    dimensionsMm: [500, 550, 900],
  },
  {
    id: "prop.decor.escultura",
    category: "decorativo",
    label: "Escultura Decorativa",
    dimensionsMm: [250, 250, 450],
  },
];
