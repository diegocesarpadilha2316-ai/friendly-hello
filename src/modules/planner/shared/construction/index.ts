/**
 * BIBLIOTECA CONSTRUTIVA PARAMÉTRICA — ponto único de entrada.
 *
 * Toda família de móvel (roupeiro, cozinha, closet, painel, banheiro…)
 * deve ser montada SOMENTE como composição destes componentes.
 */
export * from "./types";
export * from "./params";
export * from "./geometry";
export * from "./registry";
export * from "./assembly";
export * from "./animation";
export { doorSwing, doorSliding, drawerFront, FRONT_COMPONENTS } from "./components/fronts";
export { drawer, shelf, divider, hangerRod, topBox, niche, INTERIOR_COMPONENTS } from "./components/interior";
export { plinth, top, side, back, baseBoard, panel, STRUCTURE_COMPONENTS } from "./components/structure";