/**
 * Fase 3.21 — Hook orquestrador do renderizador local.
 *
 * Estado local (session-only). Nenhum store novo, nenhum provider,
 * nenhum banco. Apenas lê o `PlannerProject` via `usePlannerEditor()`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { buildLocalScene } from "../scene-builder";
import { buildPlaybook, type LocalRenderPlaybook } from "../renderer";
import { LOCAL_STAGES, advance, complete, markCancelled, markStart, estimateDurationMs } from "../queue";
import { expandCapture } from "../batch";
import { buildCaptureRequest, DEFAULT_OUTPUT } from "../capture";
import { DEFAULT_LOCAL_QUALITY } from "../quality";
import { DEFAULT_VIEWPORT } from "../viewport";
import type {
  LocalCaptureRequest,
  LocalOutputSpec,
  LocalQualityId,
  LocalRenderJob,
  LocalRenderScene,
  LocalViewportState,
} from "../types";

const HISTORY_LIMIT = 40;

export interface UseLocalRender {
  readonly scene: LocalRenderScene | null;
  readonly playbook: LocalRenderPlaybook | null;
  readonly queue: readonly LocalRenderJob[];
  readonly active: LocalRenderJob | null;
  readonly history: readonly LocalRenderJob[];
  readonly qualityId: LocalQualityId;
  readonly output: LocalOutputSpec;
  readonly viewport: LocalViewportState;
  setQuality(id: LocalQualityId): void;
  setOutput(next: LocalOutputSpec): void;
  setViewport(next: LocalViewportState): void;
  enqueue(req: LocalCaptureRequest): readonly LocalRenderJob[];
  enqueueSingle(cameraId: string): readonly LocalRenderJob[];
  cancel(jobId: string): void;
  retry(jobId: string): void;
  clearHistory(): void;
}

export function useLocalRender(): UseLocalRender {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [qualityId, setQualityId] = useState<LocalQualityId>(DEFAULT_LOCAL_QUALITY);
  const [output, setOutput] = useState<LocalOutputSpec>(DEFAULT_OUTPUT);
  const [viewport, setViewport] = useState<LocalViewportState>(DEFAULT_VIEWPORT);

  const [queue, setQueue] = useState<readonly LocalRenderJob[]>([]);
  const [history, setHistory] = useState<readonly LocalRenderJob[]>([]);
  const cancelledRef = useRef<Set<string>>(new Set());

  const scene = useMemo(
    () => (project ? buildLocalScene(project, state.selectedRoomId) : null),
    [project, state.selectedRoomId],
  );

  const playbook = useMemo(
    () => (scene ? buildPlaybook(qualityId, scene) : null),
    [scene, qualityId],
  );

  const active = useMemo(
    () =>
      queue.find(
        (j) => j.status !== "queued" && j.status !== "done" && j.status !== "cancelled" && j.status !== "failed",
      ) ?? null,
    [queue],
  );

  const finish = useCallback((jobId: string, finalJob: LocalRenderJob) => {
    setQueue((q) => q.filter((j) => j.id !== jobId));
    setHistory((h) => [finalJob, ...h].slice(0, HISTORY_LIMIT));
  }, []);

  useEffect(() => {
    if (active) return;
    const next = queue.find((j) => j.status === "queued");
    if (!next) return;
    let cancelled = false;

    const run = async () => {
      let cur = markStart(next);
      setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
      const total = estimateDurationMs(cur);
      for (let s = 0; s < LOCAL_STAGES.length; s += 1) {
        const stage = LOCAL_STAGES[s];
        const dur = stage.weight * total;
        const steps = 10;
        for (let i = 1; i <= steps; i += 1) {
          if (cancelled || cancelledRef.current.has(cur.id)) {
            const final = markCancelled(cur);
            cancelledRef.current.delete(cur.id);
            finish(cur.id, final);
            return;
          }
          await new Promise((r) => setTimeout(r, dur / steps));
          cur = advance(cur, s, i / steps);
          setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
        }
      }
      const done = complete(cur);
      finish(cur.id, done);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [queue, active, finish]);

  const enqueue = useCallback(
    (req: LocalCaptureRequest): readonly LocalRenderJob[] => {
      if (!project) return [];
      const jobs = expandCapture(project, state.selectedRoomId, req);
      setQueue((q) => [...q, ...jobs]);
      return jobs;
    },
    [project, state.selectedRoomId],
  );

  const enqueueSingle = useCallback(
    (cameraId: string): readonly LocalRenderJob[] => {
      return enqueue(
        buildCaptureRequest({
          scope: "single",
          qualityId,
          output,
          cameraIds: [cameraId],
        }),
      );
    },
    [enqueue, qualityId, output],
  );

  const cancel = useCallback((jobId: string) => {
    cancelledRef.current.add(jobId);
    setQueue((q) => {
      const j = q.find((x) => x.id === jobId);
      if (!j) return q;
      if (j.status === "queued") {
        setHistory((h) => [markCancelled(j), ...h].slice(0, HISTORY_LIMIT));
        return q.filter((x) => x.id !== jobId);
      }
      return q;
    });
  }, []);

  const retry = useCallback((jobId: string) => {
    setHistory((h) => {
      const found = h.find((j) => j.id === jobId);
      if (!found) return h;
      const clone: LocalRenderJob = {
        ...found,
        id: `${found.id}_retry_${Date.now().toString(36)}`,
        status: "queued",
        stage: "queued",
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: undefined,
        finishedAt: undefined,
        result: undefined,
        error: undefined,
      };
      setQueue((q) => [...q, clone]);
      return h;
    });
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    scene,
    playbook,
    queue,
    active,
    history,
    qualityId,
    output,
    viewport,
    setQuality: setQualityId,
    setOutput,
    setViewport,
    enqueue,
    enqueueSingle,
    cancel,
    retry,
    clearHistory,
  };
}