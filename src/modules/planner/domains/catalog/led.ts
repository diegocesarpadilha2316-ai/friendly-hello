/**
 * Fase 3.24 — LEDs, perfis LED e sensores.
 */
import type { CatalogLed } from "./types";

export const CATALOG_LED: readonly CatalogLed[] = [
  { id: "led-loox-2700", name: "Häfele Loox 2700K",   kind: "fita",   cct: 2700, wattsPerM: 4.8, ip: 20, pricePerM: 68 },
  { id: "led-loox-3000", name: "Häfele Loox 3000K",   kind: "fita",   cct: 3000, wattsPerM: 4.8, ip: 20, pricePerM: 68 },
  { id: "led-loox-4000", name: "Häfele Loox 4000K",   kind: "fita",   cct: 4000, wattsPerM: 4.8, ip: 20, pricePerM: 72 },
  { id: "led-perfil-alu-canto", name: "Perfil LED Canto",  kind: "perfil", cct: 3000, wattsPerM: 0,   ip: 44, pricePerM: 42 },
  { id: "led-spot-mini",   name: "Spot LED Mini",        kind: "spot",   cct: 3000, wattsPerM: 3,    ip: 44, pricePerM: 58 },
  { id: "led-sensor-porta", name: "Sensor de Porta",     kind: "sensor", cct: 3000, wattsPerM: 0,    ip: 20, pricePerM: 88 },
];

export function listLeds(): readonly CatalogLed[] {
  return CATALOG_LED;
}

export function getLed(id: string): CatalogLed | undefined {
  return CATALOG_LED.find((l) => l.id === id);
}