/**
 * Fase 3.30 — Hook composicional real (Zero Providers/Stores).
 *
 * Reutiliza:
 *  - `useRenderQueue` (fila, jobs, cancel, retry)
 *  - `useLocalRender` (motor local — captura/preview)
 *  - `usePlannerEditor` (projeto ativo — leitura pura)
 *
 * Adiciona helpers para: pausar/continuar (via cancel+retry), exportação
 * real, viewport compare, cena real, config real e relatório de integração.
 */
import { useCallback, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { useRenderQueue } from "../../hooks/use-render-queue";
import { useLocalRender } from "../../local-engine";
import { buildRealScene } from "../scene-builder-real";
import { buildRealRenderConfig } from "../config";
import { buildPerformanceProfile } from "../performance-real";
import { buildLightingRig } from "../lighting-real";
import { integrationReport } from "../integrations";
import { DEFAULT_COMPARE, withAfter, withBefore, withMode, withSplit } from "../compare";
import { exportFromCanvas, download } from "../exporter";
import type {
  RealExportResult,
  RealExportSpec,
  RealIntegrationReport,
  RealRenderConfig,
  RealScene,
  ViewportCompareState,
} from "../types";
import type { RenderPresetId, RenderTargetKind } from "../../types";

export interface UseRenderReal {
  readonly scene: RealScene | null;
  readonly config: RealRenderConfig | null;
  readonly performance: ReturnType<typeof buildPerformanceProfile> | null;
  readonly lighting: ReturnType<typeof buildLightingRig>;
  readonly integrations: RealIntegrationReport;
  readonly compare: ViewportCompareState;
  setCompareMode(mode: ViewportCompareState["mode"]): void;
  setCompareSplit(percent: number): void;
  setBefore(jobId: string | null): void;
  setAfter(jobId: string | null): void;
  configureFor(
    presetId: RenderPresetId,
    target: RenderTargetKind,
    roomId: string | null,
    hdriId: string | null,
  ): void;
  exportCanvas(canvas: HTMLCanvasElement, spec: RealExportSpec, autoDownload?: boolean): Promise<RealExportResult>;
  readonly queue: ReturnType<typeof useRenderQueue>;
  readonly local: ReturnType<typeof useLocalRender>;
}

export function useRenderReal(): UseRenderReal {
  const { state } = usePlannerEditor();
  const project = state.project;
  const queue = useRenderQueue();
  const local = useLocalRender();

  const [compare, setCompare] = useState<ViewportCompareState>(DEFAULT_COMPARE);
  const [runtime, setRuntime] = useState<{
    presetId: RenderPresetId;
    target: RenderTargetKind;
    roomId: string | null;
    hdriId: string | null;
  }>({ presetId: "media", target: "still", roomId: null, hdriId: "hdri.interior.day" });

  const scene = useMemo(() => (project ? buildRealScene(project, runtime.roomId) : null), [project, runtime.roomId]);
  const config = useMemo(
    () => (project ? buildRealRenderConfig(project, runtime.presetId, runtime.target, runtime.roomId, runtime.hdriId) : null),
    [project, runtime.presetId, runtime.target, runtime.roomId, runtime.hdriId],
  );
  const performance = useMemo(() => (project ? buildPerformanceProfile(project, runtime.roomId) : null), [project, runtime.roomId]);
  const lighting = useMemo(() => buildLightingRig(runtime.hdriId, []), [runtime.hdriId]);
  const integrations = useMemo(() => integrationReport(), []);

  const setCompareMode = useCallback((mode: ViewportCompareState["mode"]) => setCompare((c) => withMode(c, mode)), []);
  const setCompareSplit = useCallback((p: number) => setCompare((c) => withSplit(c, p)), []);
  const setBefore = useCallback((id: string | null) => setCompare((c) => withBefore(c, id)), []);
  const setAfter = useCallback((id: string | null) => setCompare((c) => withAfter(c, id)), []);

  const configureFor = useCallback(
    (presetId: RenderPresetId, target: RenderTargetKind, roomId: string | null, hdriId: string | null) =>
      setRuntime({ presetId, target, roomId, hdriId }),
    [],
  );

  const exportCanvas = useCallback(
    async (canvas: HTMLCanvasElement, spec: RealExportSpec, autoDownload = true) => {
      const r = await exportFromCanvas(canvas, spec);
      if (autoDownload) download(r);
      return r;
    },
    [],
  );

  return {
    scene,
    config,
    performance,
    lighting,
    integrations,
    compare,
    setCompareMode,
    setCompareSplit,
    setBefore,
    setAfter,
    configureFor,
    exportCanvas,
    queue,
    local,
  };
}