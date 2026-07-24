/**
 * Fase 3.17 — HDRIs disponíveis para o viewport realtime.
 */
import { ULTRA_HDRIS } from "../services/ultra/hdri";
import type { RenderHdri } from "../types";

export const REALTIME_HDRIS: readonly RenderHdri[] = Object.values(ULTRA_HDRIS);

export function findRealtimeHdri(id: string): RenderHdri | undefined {
  return REALTIME_HDRIS.find((h) => h.id === id);
}