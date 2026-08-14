/**
 * Fase 3.31 — Fachada pública da integração real do Vídeo.
 * Camada 100% aditiva.
 */
export * from "./types";
export * from "./encoders";
export * from "./capture-surface";
export * from "./timeline-runner";
export * from "./camera-runner";
export * from "./animation-runner";
export * from "./budget";
export * from "./audio-plan";
export * from "./branding-plan";
export * from "./config";
export * from "./integrations";
export * from "./executor";
export * from "./exporter";
export { useVideoReal } from "./hooks/use-video-real";
export type { UseVideoReal } from "./hooks/use-video-real";
export { VideoRealPanel } from "./components/VideoRealPanel";
