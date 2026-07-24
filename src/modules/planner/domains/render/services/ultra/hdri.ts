/**
 * Fase 3.12 — Catálogo HDRI Ultra (Interior/Exterior/Studio/Noite/Dia/
 * Pôr do sol/Blue hour/Nublado). Consumido pelo Render Engine existente
 * via mesmo contrato `RenderHdri`.
 */
import type { RenderHdri } from "../../types";

export const ULTRA_HDRIS: readonly RenderHdri[] = [
  { id: "ultra.hdri.interior.day", label: "Interior — Dia", rotation: 15, intensity: 0.95, temperatureK: 5400, category: "interior" },
  { id: "ultra.hdri.interior.night", label: "Interior — Noite", rotation: 0, intensity: 0.35, temperatureK: 2900, category: "noturno" },
  { id: "ultra.hdri.exterior.sunny", label: "Exterior — Ensolarado", rotation: 30, intensity: 1.6, temperatureK: 6200, category: "ensolarado" },
  { id: "ultra.hdri.exterior.cloudy", label: "Exterior — Nublado", rotation: 0, intensity: 1.0, temperatureK: 6800, category: "nublado" },
  { id: "ultra.hdri.studio.soft", label: "Studio — Suave", rotation: 0, intensity: 1.0, temperatureK: 5600, category: "estudio" },
  { id: "ultra.hdri.studio.hard", label: "Studio — Dramático", rotation: 45, intensity: 1.3, temperatureK: 5200, category: "estudio" },
  { id: "ultra.hdri.sunset", label: "Pôr do Sol", rotation: 90, intensity: 1.35, temperatureK: 3100, category: "exterior" },
  { id: "ultra.hdri.bluehour", label: "Blue Hour", rotation: 180, intensity: 0.8, temperatureK: 8000, category: "exterior" },
];