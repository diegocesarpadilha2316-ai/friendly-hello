/**
 * Planner / domínio: rooms / decor — Fase 3.8.
 *
 * IA Decoradora: estilos, sugestões, iluminação, materiais, correções
 * (aceitar/rejeitar) e aplicação ao MESMO grafo paramétrico. Nesta fase
 * apenas arquitetura + motor determinístico local; providers externos
 * (GPT/Gemini/Claude/OSS) são interfaces prontas.
 */
export * from "./types";
export * from "./styles";
export * from "./catalog";
export * from "./lighting";
export * from "./materials";
export * from "./rules";
export * from "./providers";
export * from "./adapter";
export * from "./hooks/use-decorator-session";
export { StyleGallery } from "./components/StyleGallery";
export { SuggestionList } from "./components/SuggestionList";
export { BeforeAfterCompare } from "./components/BeforeAfterCompare";
export { DecoratorStudio } from "./components/DecoratorStudio";