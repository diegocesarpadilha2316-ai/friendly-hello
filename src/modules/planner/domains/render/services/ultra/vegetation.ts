/**
 * Fase 3.12 — Biblioteca de vegetação.
 * Apenas metadados: id, tipo, dimensão. O motor de render consumirá
 * os assets através dos providers existentes.
 */
import type { VegetationAsset } from "../../types/ultra";

export const VEGETATION_ASSETS: readonly VegetationAsset[] = [
  {
    id: "veg.arvore.ipe",
    kind: "arvore",
    label: "Ipê Amarelo",
    heightMm: 8000,
    tags: ["decidua", "brasil"],
  },
  {
    id: "veg.arvore.oliveira",
    kind: "arvore",
    label: "Oliveira",
    heightMm: 5000,
    tags: ["mediterranea"],
  },
  {
    id: "veg.palmeira.imperial",
    kind: "palmeira",
    label: "Palmeira Imperial",
    heightMm: 12000,
    tags: ["tropical"],
  },
  {
    id: "veg.arbusto.buxinho",
    kind: "arbusto",
    label: "Buxinho",
    heightMm: 800,
    tags: ["topiaria"],
  },
  { id: "veg.flor.orquidea", kind: "flor", label: "Orquídea Branca", heightMm: 400 },
  {
    id: "veg.interna.costela",
    kind: "planta-interna",
    label: "Costela de Adão",
    heightMm: 1400,
    tags: ["interior"],
  },
  {
    id: "veg.interna.zamioculca",
    kind: "planta-interna",
    label: "Zamioculca",
    heightMm: 800,
    tags: ["interior"],
  },
  { id: "veg.interna.espada", kind: "planta-interna", label: "Espada de São Jorge", heightMm: 900 },
  {
    id: "veg.jardim.tropical",
    kind: "jardim",
    label: "Jardim Tropical",
    heightMm: 1500,
    tags: ["composicao"],
  },
  { id: "veg.grama.esmeralda", kind: "grama", label: "Grama Esmeralda", heightMm: 40 },
  { id: "veg.pedra.seixo", kind: "pedra-decorativa", label: "Seixo Branco", heightMm: 60 },
  { id: "veg.pedra.basalto", kind: "pedra-decorativa", label: "Basalto", heightMm: 80 },
];
