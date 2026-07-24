import type { SnapTarget } from "../types";

export const SNAP_TARGETS: readonly SnapTarget[] = [
  { id: "paredes", kind: "paredes", label: "Paredes", enabled: true, toleranceMm: 25 },
  { id: "moveis", kind: "moveis", label: "Móveis", enabled: true, toleranceMm: 20 },
  { id: "eixos", kind: "eixos", label: "Eixos", enabled: true, toleranceMm: 15 },
  { id: "centro", kind: "centro", label: "Centro", enabled: true, toleranceMm: 15 },
  { id: "quinas", kind: "quinas", label: "Quinas", enabled: true, toleranceMm: 10 },
  { id: "divisorias", kind: "divisorias", label: "Divisórias", enabled: true, toleranceMm: 10 },
  { id: "portas", kind: "portas", label: "Portas", enabled: false, toleranceMm: 10 },
  { id: "gavetas", kind: "gavetas", label: "Gavetas", enabled: false, toleranceMm: 10 },
];