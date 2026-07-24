/**
 * Fase 3.8 — IA Decoradora: cenas de iluminação.
 *
 * Cada cena descreve um conjunto coerente de emissores (LED, spots,
 * fita, pendente, perfil, abajur, arandela, plafon) com temperatura
 * (quente/neutra/fria) e função (ambiente/tarefa/destaque/decorativa).
 * A aplicação real (renderer 3D, produção) consome esta descrição sem
 * duplicar motor.
 */
import type { DecorLightingScene } from "./types";

export const DECOR_LIGHTING_SCENES: readonly DecorLightingScene[] = [
  {
    id: "scene.quente.aconchego",
    name: "Aconchego quente",
    description: "Luz quente com camadas ambiente + tarefa + decorativa — sala/dormitório.",
    emitters: [
      { kind: "led", role: "ambiente", temperature: "quente", wattage: 24, color: "#F6C588" },
      { kind: "fita_led", role: "destaque", temperature: "quente", wattage: 12 },
      { kind: "abajur", role: "decorativa", temperature: "quente", wattage: 8 },
      { kind: "pendente", role: "ambiente", temperature: "quente", wattage: 18 },
    ],
    styles: ["classico", "luxo", "escandinavo", "boho", "japandi", "contemporaneo", "rustico"],
    suitedFor: ["sala", "dormitorio"],
  },
  {
    id: "scene.neutra.trabalho",
    name: "Foco de trabalho",
    description: "Luz neutra uniforme com destaques dirigidos — escritório/estudo.",
    emitters: [
      { kind: "plafon", role: "ambiente", temperature: "neutra", wattage: 30 },
      { kind: "spot", role: "tarefa", temperature: "neutra", wattage: 12 },
      { kind: "perfil_led", role: "destaque", temperature: "neutra", wattage: 15 },
    ],
    styles: ["corporativo", "minimalista", "moderno"],
    suitedFor: ["escritorio", "corporativo", "comercial"],
  },
  {
    id: "scene.fria.tecnica",
    name: "Técnica fria",
    description: "Alta iluminância para cozinhas técnicas ou lavanderias.",
    emitters: [
      { kind: "led", role: "ambiente", temperature: "fria", wattage: 36 },
      { kind: "fita_led", role: "tarefa", temperature: "fria", wattage: 18 },
      { kind: "spot", role: "tarefa", temperature: "fria", wattage: 9 },
    ],
    styles: ["moderno", "corporativo", "industrial"],
    suitedFor: ["cozinha", "lavanderia", "banheiro", "comercial"],
  },
  {
    id: "scene.cenografica.luxo",
    name: "Cenografia luxo",
    description: "Sequência dramática — perfil retroiluminado, pendente escultural e fita indireta.",
    emitters: [
      { kind: "perfil_led", role: "destaque", temperature: "quente", wattage: 20 },
      { kind: "pendente", role: "decorativa", temperature: "quente", wattage: 24 },
      { kind: "fita_led", role: "destaque", temperature: "quente", wattage: 15 },
      { kind: "spot", role: "destaque", temperature: "quente", wattage: 10 },
    ],
    styles: ["luxo", "classico", "contemporaneo"],
    suitedFor: ["sala", "banheiro", "closet", "comercial"],
  },
  {
    id: "scene.industrial.exposta",
    name: "Industrial exposta",
    description: "Trilhos, pendentes metálicos e arandelas — trama urbana.",
    emitters: [
      { kind: "pendente", role: "ambiente", temperature: "quente", wattage: 40 },
      { kind: "arandela", role: "decorativa", temperature: "quente", wattage: 12 },
      { kind: "spot", role: "destaque", temperature: "neutra", wattage: 10 },
    ],
    styles: ["industrial"],
    suitedFor: ["sala", "cozinha", "comercial", "corporativo"],
  },
];

export function getLightingScene(id: string): DecorLightingScene | undefined {
  return DECOR_LIGHTING_SCENES.find((s) => s.id === id);
}