/**
 * Fase 3.17 — Biblioteca de pessoas (escala humana).
 */
import type { RealtimeAssetItem } from "./types";

export const REALTIME_PEOPLE: readonly RealtimeAssetItem[] = [
  { id: "p-adulto-em-pe-1", label: "Adulto em pé (M)", category: "adulto", widthMm: 500, heightMm: 1780, depthMm: 320, tags: ["em-pe", "masculino"] },
  { id: "p-adulto-em-pe-2", label: "Adulto em pé (F)", category: "adulto", widthMm: 480, heightMm: 1680, depthMm: 300, tags: ["em-pe", "feminino"] },
  { id: "p-adulto-sentado", label: "Adulto sentado", category: "adulto", widthMm: 520, heightMm: 1300, depthMm: 700, tags: ["sentado"] },
  { id: "p-adulto-andando-1", label: "Adulto andando", category: "adulto", widthMm: 700, heightMm: 1780, depthMm: 400, tags: ["andando"] },
  { id: "p-crianca-em-pe", label: "Criança em pé", category: "crianca", widthMm: 380, heightMm: 1200, depthMm: 260, tags: ["em-pe"] },
  { id: "p-crianca-sentada", label: "Criança sentada", category: "crianca", widthMm: 400, heightMm: 900, depthMm: 550, tags: ["sentado"] },
  { id: "p-crianca-brincando", label: "Criança brincando", category: "crianca", widthMm: 700, heightMm: 1100, depthMm: 700, tags: ["andando"] },
  { id: "p-adulto-apresentando", label: "Adulto apresentando", category: "adulto", widthMm: 600, heightMm: 1780, depthMm: 400, tags: ["em-pe"] },
];