import type { QualityMode } from "../state/useImmersiveStore";

export type KitchenLightingPreset = {
  dpr: [number, number];
  ambient: number;
  hemisphere: number;
  directional: number;
  pointA: number;
  pointB: number;
  shadowMap: number;
  exposure: number;
  temperatureK: number;
  contactShadows: boolean;
  led: boolean;
  keyColor: string;
  fillColor: string;
  ledColor: string;
  ledIntensity: number;
  contactOpacity: number;
  contactBlur: number;
};

export const KITCHEN_LIGHTING: Record<QualityMode, KitchenLightingPreset> = {
  work: {
    dpr: [0.7, 1],
    ambient: 0.28,
    hemisphere: 0.58,
    directional: 1.15,
    pointA: 2.4,
    pointB: 2.1,
    shadowMap: 512,
    exposure: 0.94,
    temperatureK: 4000,
    contactShadows: false,
    led: false,
    keyColor: "#fff8ec",
    fillColor: "#b9d5e8",
    ledColor: "#ffd39b",
    ledIntensity: 0,
    contactOpacity: 0,
    contactBlur: 2.4,
  },
  realistic: {
    dpr: [0.7, 1],
    ambient: 0.38,
    hemisphere: 0.76,
    directional: 1.55,
    pointA: 3.8,
    pointB: 3.1,
    shadowMap: 512,
    exposure: 0.98,
    temperatureK: 3000,
    contactShadows: false,
    led: true,
    keyColor: "#fff5e2",
    fillColor: "#b5d2e5",
    ledColor: "#ffd09a",
    ledIntensity: 1.2,
    contactOpacity: 0.28,
    contactBlur: 2.2,
  },
  presentation: {
    dpr: [0.9, 1.5],
    ambient: 0.34,
    hemisphere: 0.72,
    directional: 1.7,
    pointA: 4.4,
    pointB: 3.8,
    shadowMap: 2048,
    exposure: 1.04,
    temperatureK: 3000,
    contactShadows: true,
    led: true,
    keyColor: "#fff0d2",
    fillColor: "#a5c9df",
    ledColor: "#ffca8c",
    ledIntensity: 1.85,
    contactOpacity: 0.48,
    contactBlur: 2.8,
  },
};

export function getKitchenLighting(qualityMode: QualityMode) {
  return KITCHEN_LIGHTING[qualityMode];
}
