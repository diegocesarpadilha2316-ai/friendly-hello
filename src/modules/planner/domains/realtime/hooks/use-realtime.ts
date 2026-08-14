/**
 * Fase 3.23 — Hook orquestrador do RealTime Interactive Engine.
 *
 * Estado session-only. Não cria providers/stores/managers/banco.
 * Lê o projeto via `usePlannerEditor()` (Fase 3.1) e delega qualquer
 * mutação persistente ao `updateProject()`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { DEFAULT_REALTIME_VIEWPORT, setNavigation, setViewportQuality } from "../viewport";
import { DEFAULT_REALTIME_CAMERA, switchCameraMode } from "../camera";
import { DEFAULT_MOVEMENT } from "../movement";
import { DEFAULT_COLLISION } from "../collision";
import { DEFAULT_GRAVITY } from "../gravity";
import {
  DEFAULT_LIGHTING,
  setTime as setLightTime,
  setWeather as setLightWeather,
} from "../lighting";
import { DEFAULT_ENVIRONMENT, environmentForWeather } from "../environment";
import {
  EMPTY_SELECTION,
  selectOne,
  clearSelection,
  setHover,
  toggleSelection,
} from "../selection";
import { autoQualityFor, detectHardware, performanceFor } from "../performance";
import { reflectionForQuality } from "../reflection";
import { planInteraction } from "../interaction";
import { upsertDoor } from "../doors";
import { upsertDrawer } from "../drawers";
import { upsertOverride } from "../materials";
import { addHotspot, removeHotspot } from "../hotspots";
import { createMeasure } from "../measure";
import type {
  RealtimeCameraState,
  RealtimeCollisionProfile,
  RealtimeDoorState,
  RealtimeDrawerState,
  RealtimeEnvironmentState,
  RealtimeGravityProfile,
  RealtimeHardwareHint,
  RealtimeHotspot,
  RealtimeInteractionRequest,
  RealtimeLedState,
  RealtimeLightingState,
  RealtimeMaterialOverride,
  RealtimeMeasureMode,
  RealtimeMeasurePoint,
  RealtimeMovementProfile,
  RealtimeNavigationMode,
  RealtimeQualityTier,
  RealtimeSelectionState,
  RealtimeTimeOfDay,
  RealtimeVec3,
  RealtimeViewportState,
  RealtimeWeatherId,
} from "../types";

export interface UseRealtime {
  readonly viewport: RealtimeViewportState;
  readonly camera: RealtimeCameraState;
  readonly movement: RealtimeMovementProfile;
  readonly collision: RealtimeCollisionProfile;
  readonly gravity: RealtimeGravityProfile;
  readonly lighting: RealtimeLightingState;
  readonly environment: RealtimeEnvironmentState;
  readonly selection: RealtimeSelectionState;
  readonly doors: readonly RealtimeDoorState[];
  readonly drawers: readonly RealtimeDrawerState[];
  readonly leds: readonly RealtimeLedState[];
  readonly materials: readonly RealtimeMaterialOverride[];
  readonly hotspots: readonly RealtimeHotspot[];
  readonly measures: readonly RealtimeMeasurePoint[];
  readonly hardware: RealtimeHardwareHint;
  readonly performance: ReturnType<typeof performanceFor>;
  readonly reflection: ReturnType<typeof reflectionForQuality>;
  readonly hasProject: boolean;
  setNavigationMode(mode: RealtimeNavigationMode): void;
  setQuality(tier: RealtimeQualityTier): void;
  setTime(t: RealtimeTimeOfDay): void;
  setWeather(w: RealtimeWeatherId): void;
  selectNode(id: string): void;
  toggleSelectNode(id: string): void;
  hoverNode(id: string | null): void;
  clearSelectionAll(): void;
  interact(req: RealtimeInteractionRequest): void;
  addMeasure(mode: RealtimeMeasureMode, a: RealtimeVec3, b: RealtimeVec3): void;
  clearMeasures(): void;
  addHotspot(h: RealtimeHotspot): void;
  removeHotspot(id: string): void;
  screenshot(): RealtimeMeasurePoint | null;
}

export function useRealtime(): UseRealtime {
  const { state } = usePlannerEditor();
  const project = state.project;
  const hasProject = Boolean(project);

  const [hardware] = useState<RealtimeHardwareHint>(() => detectHardware());
  const [viewport, setViewport] = useState<RealtimeViewportState>(() => ({
    ...DEFAULT_REALTIME_VIEWPORT,
    quality: autoQualityFor(detectHardware()),
  }));
  const [camera, setCamera] = useState<RealtimeCameraState>(DEFAULT_REALTIME_CAMERA);
  const [movement] = useState<RealtimeMovementProfile>(DEFAULT_MOVEMENT);
  const [collision] = useState<RealtimeCollisionProfile>(DEFAULT_COLLISION);
  const [gravity] = useState<RealtimeGravityProfile>(DEFAULT_GRAVITY);
  const [lighting, setLighting] = useState<RealtimeLightingState>(DEFAULT_LIGHTING);
  const [environment, setEnvironment] = useState<RealtimeEnvironmentState>(DEFAULT_ENVIRONMENT);
  const [selection, setSelection] = useState<RealtimeSelectionState>(EMPTY_SELECTION);
  const [doors, setDoors] = useState<readonly RealtimeDoorState[]>([]);
  const [drawers, setDrawers] = useState<readonly RealtimeDrawerState[]>([]);
  const [leds, setLeds] = useState<readonly RealtimeLedState[]>([]);
  const [materials, setMaterials] = useState<readonly RealtimeMaterialOverride[]>([]);
  const [hotspots, setHotspots] = useState<readonly RealtimeHotspot[]>([]);
  const [measures, setMeasures] = useState<readonly RealtimeMeasurePoint[]>([]);

  useEffect(() => {
    setEnvironment(environmentForWeather(lighting.weather));
  }, [lighting.weather]);

  const performance = useMemo(() => performanceFor(viewport.quality), [viewport.quality]);
  const reflection = useMemo(() => reflectionForQuality(viewport.quality), [viewport.quality]);

  const setNavigationMode = useCallback((mode: RealtimeNavigationMode) => {
    setViewport((v) => setNavigation(v, mode));
    setCamera((c) => switchCameraMode(c, mode));
  }, []);

  const setQuality = useCallback((tier: RealtimeQualityTier) => {
    setViewport((v) => setViewportQuality(v, tier));
  }, []);

  const setTime = useCallback((t: RealtimeTimeOfDay) => {
    setLighting((s) => setLightTime(s, t));
  }, []);

  const setWeather = useCallback((w: RealtimeWeatherId) => {
    setLighting((s) => setLightWeather(s, w));
  }, []);

  const selectNode = useCallback((id: string) => setSelection((s) => selectOne(s, id)), []);
  const toggleSelectNode = useCallback(
    (id: string) => setSelection((s) => toggleSelection(s, id)),
    [],
  );
  const hoverNode = useCallback((id: string | null) => setSelection((s) => setHover(s, id)), []);
  const clearSelectionAll = useCallback(() => setSelection((s) => clearSelection(s)), []);

  const interact = useCallback(
    (req: RealtimeInteractionRequest) => {
      const outcome = planInteraction(req, { doors, drawers, leds });
      if (outcome.doors.length) {
        setDoors((cur) => outcome.doors.reduce((acc, d) => upsertDoor(acc, d), cur));
      }
      if (outcome.drawers.length) {
        setDrawers((cur) => outcome.drawers.reduce((acc, d) => upsertDrawer(acc, d), cur));
      }
      if (outcome.leds.length) {
        setLeds((cur) => {
          let next = cur;
          for (const l of outcome.leds) {
            const idx = next.findIndex((x) => x.nodeId === l.nodeId);
            if (idx < 0) next = [...next, l];
            else {
              const clone = [...next];
              clone[idx] = l;
              next = clone;
            }
          }
          return next;
        });
      }
      if (outcome.materials.length) {
        setMaterials((cur) => outcome.materials.reduce((acc, m) => upsertOverride(acc, m), cur));
      }
    },
    [doors, drawers, leds],
  );

  const addMeasure = useCallback((mode: RealtimeMeasureMode, a: RealtimeVec3, b: RealtimeVec3) => {
    setMeasures((cur) => [...cur, createMeasure(mode, a, b)]);
  }, []);
  const clearMeasures = useCallback(() => setMeasures([]), []);

  const addHotspotFn = useCallback(
    (h: RealtimeHotspot) => setHotspots((cur) => addHotspot(cur, h)),
    [],
  );
  const removeHotspotFn = useCallback(
    (id: string) => setHotspots((cur) => removeHotspot(cur, id)),
    [],
  );

  const screenshot = useCallback((): RealtimeMeasurePoint | null => {
    // Marcador determinístico para o consumidor decidir como capturar.
    return null;
  }, []);

  return {
    viewport,
    camera,
    movement,
    collision,
    gravity,
    lighting,
    environment,
    selection,
    doors,
    drawers,
    leds,
    materials,
    hotspots,
    measures,
    hardware,
    performance,
    reflection,
    hasProject,
    setNavigationMode,
    setQuality,
    setTime,
    setWeather,
    selectNode,
    toggleSelectNode,
    hoverNode,
    clearSelectionAll,
    interact,
    addMeasure,
    clearMeasures,
    addHotspot: addHotspotFn,
    removeHotspot: removeHotspotFn,
    screenshot,
  };
}
