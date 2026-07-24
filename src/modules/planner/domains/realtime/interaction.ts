/**
 * Fase 3.23 — Roteador de interações. Retorna descrições puras;
 * o hook consumidor aplica via updateProject().
 */
import type {
  RealtimeDoorState,
  RealtimeDrawerState,
  RealtimeInteractionKind,
  RealtimeInteractionRequest,
  RealtimeLedState,
  RealtimeMaterialOverride,
} from "./types";

export interface RealtimeInteractionOutcome {
  readonly kind: RealtimeInteractionKind;
  readonly nodeId: string;
  readonly doors: readonly RealtimeDoorState[];
  readonly drawers: readonly RealtimeDrawerState[];
  readonly leds: readonly RealtimeLedState[];
  readonly materials: readonly RealtimeMaterialOverride[];
  readonly flagUpdates: Readonly<Record<string, boolean>>;
}

export const EMPTY_OUTCOME: RealtimeInteractionOutcome = {
  kind: "open-door",
  nodeId: "",
  doors: [],
  drawers: [],
  leds: [],
  materials: [],
  flagUpdates: {},
};

export function planInteraction(
  req: RealtimeInteractionRequest,
  current: {
    readonly doors: readonly RealtimeDoorState[];
    readonly drawers: readonly RealtimeDrawerState[];
    readonly leds: readonly RealtimeLedState[];
  },
): RealtimeInteractionOutcome {
  const base = { ...EMPTY_OUTCOME, kind: req.kind, nodeId: req.nodeId };
  switch (req.kind) {
    case "open-door":
    case "close-door": {
      const open = req.kind === "open-door";
      const existing = current.doors.find((d) => d.nodeId === req.nodeId);
      const doors = existing
        ? current.doors.map((d) => (d.nodeId === req.nodeId ? { ...d, openRatio: open ? 1 : 0 } : d))
        : [...current.doors, { nodeId: req.nodeId, openRatio: open ? 1 : 0, maxAngleDeg: 110, hinge: "left" as const }];
      return { ...base, doors };
    }
    case "open-drawer":
    case "close-drawer": {
      const open = req.kind === "open-drawer";
      const existing = current.drawers.find((d) => d.nodeId === req.nodeId);
      const drawers = existing
        ? current.drawers.map((d) => (d.nodeId === req.nodeId ? { ...d, openRatio: open ? 1 : 0 } : d))
        : [...current.drawers, { nodeId: req.nodeId, openRatio: open ? 1 : 0, travelMm: 450 }];
      return { ...base, drawers };
    }
    case "led-on":
    case "led-off": {
      const on = req.kind === "led-on";
      const existing = current.leds.find((l) => l.nodeId === req.nodeId);
      const leds = existing
        ? current.leds.map((l) => (l.nodeId === req.nodeId ? { ...l, on } : l))
        : [...current.leds, { nodeId: req.nodeId, on, intensity: 0.85, temperatureK: 3200 }];
      return { ...base, leds };
    }
    case "swap-material":
    case "swap-color":
    case "swap-handle":
    case "swap-hardware": {
      const materialId = String(req.payload?.materialId ?? "");
      if (!materialId) return base;
      return { ...base, materials: [{ nodeId: req.nodeId, materialId }] };
    }
    case "toggle-structure":
    case "toggle-slats":
    case "toggle-glass":
    case "toggle-mirror": {
      const flag = req.kind.replace("toggle-", "show-");
      const value = req.payload?.value !== false;
      return { ...base, flagUpdates: { [flag]: value } };
    }
    default:
      return base;
  }
}