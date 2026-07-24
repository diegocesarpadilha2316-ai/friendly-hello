/**
 * Planner / domínio: rooms / vision — Fase 3.7.
 *
 * IA Visão: foto → estrutura reconhecida → PlannerRoom. Nesta fase apenas
 * a arquitetura + simulação local. Providers externos (GPT/Gemini/Claude/
 * OSS) são interfaces prontas, ativáveis sem refactor.
 *
 * Zero provider/store/manager/DB novo — as mutações do projeto passam
 * exclusivamente por `usePlannerEditor().updateProject`.
 */
export * from "./types";
export * from "./providers";
export * from "./pipeline";
export * from "./adapter";
export * from "./hooks/use-vision-session";
export { VisionUploader } from "./components/VisionUploader";
export { VisionStages } from "./components/VisionStages";
export { VisionPreview } from "./components/VisionPreview";
export { VisionCorrections } from "./components/VisionCorrections";
export { VisionStudio } from "./components/VisionStudio";