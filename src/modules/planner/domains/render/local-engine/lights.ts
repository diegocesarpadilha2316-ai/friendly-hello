/**
 * Fase 3.21 — Presets de iluminação do motor local.
 */
import type { LocalLightPreset } from "./types";

export const LOCAL_LIGHTS: readonly LocalLightPreset[] = [
  { id: "hdri", kind: "hdri", label: "HDRI Estúdio", intensity: 1.0, temperatureK: 6500, castsShadows: false, indoor: true },
  { id: "sun", kind: "sun", label: "Sol Físico", intensity: 1.2, temperatureK: 5600, castsShadows: true, indoor: false },
  { id: "ambient", kind: "ambient", label: "Luz Ambiente", intensity: 0.35, temperatureK: 6000, castsShadows: false, indoor: true },
  { id: "area", kind: "area", label: "Área (soft box)", intensity: 0.9, temperatureK: 5000, castsShadows: true, indoor: true },
  { id: "spot", kind: "spot", label: "Spot Direcional", intensity: 1.5, temperatureK: 3200, castsShadows: true, indoor: true },
  { id: "ies", kind: "ies", label: "Perfil IES", intensity: 1.0, temperatureK: 3000, castsShadows: true, indoor: true },
  { id: "led", kind: "led", label: "Fita LED", intensity: 0.7, temperatureK: 4000, castsShadows: false, indoor: true },
  { id: "profile", kind: "profile", label: "Perfil Linear", intensity: 0.8, temperatureK: 3500, castsShadows: false, indoor: true },
  { id: "pendant", kind: "pendant", label: "Pendente", intensity: 0.9, temperatureK: 2700, castsShadows: true, indoor: true },
  { id: "abajur", kind: "decorative", label: "Abajur", intensity: 0.5, temperatureK: 2400, castsShadows: false, indoor: true },
  { id: "arandela", kind: "decorative", label: "Arandela", intensity: 0.6, temperatureK: 2700, castsShadows: true, indoor: true },
  { id: "plafon", kind: "decorative", label: "Plafon", intensity: 0.8, temperatureK: 3000, castsShadows: false, indoor: true },
];

export function findLocalLight(id: string): LocalLightPreset | null {
  return LOCAL_LIGHTS.find((l) => l.id === id) ?? null;
}