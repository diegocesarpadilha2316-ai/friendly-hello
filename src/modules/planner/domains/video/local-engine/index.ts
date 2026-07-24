/**
 * Fase 3.22 — Barrel público do Motor de Vídeo Local.
 */
export * from "./types";
export * from "./camera-path";
export * from "./camera-animation";
export * from "./door-animation";
export * from "./drawer-animation";
export * from "./lighting-animation";
export * from "./led-animation";
export * from "./scene-animation";
export * from "./keyframes";
export * from "./transitions";
export * from "./timeline";
export * from "./frames";
export * from "./encoder";
export * from "./ffmpeg-adapter";
export * from "./capture";
export * from "./batch";
export * from "./queue";
export * from "./performance";
export * from "./video-builder";
export { useLocalVideo } from "./hooks/use-local-video";
export type { UseLocalVideo } from "./hooks/use-local-video";
export { LocalVideoPanel } from "./components/LocalVideoPanel";