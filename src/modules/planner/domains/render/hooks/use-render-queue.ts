/**
 * Fase 3.9 — Hook orquestrador da fila de render.
 *
 * Estado local (session-only). Nenhum store global, nenhum provider React,
 * nenhum banco. Consome PlannerEditorProvider apenas para leitura do
 * projeto ativo. Simula o pipeline (nenhum motor externo nesta fase).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { RENDER_PIPELINE } from "../services/pipeline";
import { createJob, statusForStage, withStatus, type CreateJobInput } from "../services/queue";
import type { RenderJob } from "../types";

const HISTORY_LIMIT = 60;

export interface UseRenderQueue {
  readonly queue: readonly RenderJob[];
  readonly active: RenderJob | null;
  readonly history: readonly RenderJob[];
  enqueue(input: Omit<CreateJobInput, "project">): RenderJob | null;
  cancel(jobId: string): void;
  retry(jobId: string): void;
  clearHistory(): void;
}

export function useRenderQueue(): UseRenderQueue {
  const { state } = usePlannerEditor();
  const project = state.project;

  const [queue, setQueue] = useState<readonly RenderJob[]>([]);
  const [history, setHistory] = useState<readonly RenderJob[]>([]);
  const cancelledRef = useRef<Set<string>>(new Set());

  const active = useMemo(
    () =>
      queue.find(
        (j) =>
          j.status !== "queued" &&
          j.status !== "done" &&
          j.status !== "cancelled" &&
          j.status !== "failed",
      ) ?? null,
    [queue],
  );

  const finish = useCallback((jobId: string, finalJob: RenderJob) => {
    setQueue((q) => q.filter((j) => j.id !== jobId));
    setHistory((h) => [finalJob, ...h].slice(0, HISTORY_LIMIT));
  }, []);

  // Runner: pega o próximo `queued` e simula todos os estágios.
  useEffect(() => {
    if (active) return;
    const next = queue.find((j) => j.status === "queued");
    if (!next) return;
    let cancelled = false;

    const run = async () => {
      let cur = withStatus(next, "preparing", RENDER_PIPELINE[0], 0);
      setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
      let acc = 0;
      for (const stage of RENDER_PIPELINE) {
        if (cancelled || cancelledRef.current.has(cur.id)) {
          const final = withStatus(cur, "cancelled");
          finish(cur.id, final);
          cancelledRef.current.delete(cur.id);
          return;
        }
        // Duração relativa ao peso — total ~ 3.2s no preset "média", ~6s no ultra.
        const total = 2400 + cur.config.quality.samples * 0.3;
        const dur = stage.weight * total;
        const steps = 12;
        for (let i = 1; i <= steps; i += 1) {
          if (cancelled || cancelledRef.current.has(cur.id)) break;
          await new Promise((r) => setTimeout(r, dur / steps));
          const partial = acc + stage.weight * (i / steps);
          cur = withStatus(cur, statusForStage(stage.id), stage, partial);
          setQueue((q) => q.map((j) => (j.id === cur.id ? cur : j)));
        }
        acc += stage.weight;
      }
      const done = withStatus(cur, "done", RENDER_PIPELINE[RENDER_PIPELINE.length - 1], 1, {
        result: {
          widthPx: cur.config.quality.resolution.width,
          heightPx: cur.config.quality.resolution.height,
          durationMs: Date.now() - new Date(cur.startedAt ?? cur.createdAt).getTime(),
        },
      });
      finish(cur.id, done);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [queue, active, finish]);

  const enqueue = useCallback(
    (input: Omit<CreateJobInput, "project">): RenderJob | null => {
      if (!project) return null;
      const job = createJob({ ...input, project });
      setQueue((q) => [...q, job]);
      return job;
    },
    [project],
  );

  const cancel = useCallback((jobId: string) => {
    cancelledRef.current.add(jobId);
    setQueue((q) =>
      q.map((j) => (j.id === jobId && j.status === "queued" ? withStatus(j, "cancelled") : j)),
    );
    // Se ainda estava só queued, remove imediatamente para o histórico.
    setQueue((q) => q.filter((j) => j.status !== "cancelled"));
    setHistory((h) => {
      const alreadyIn = h.some((j) => j.id === jobId);
      if (alreadyIn) return h;
      // será adicionado pelo runner
      return h;
    });
  }, []);

  const retry = useCallback((jobId: string) => {
    setHistory((h) => {
      const found = h.find((j) => j.id === jobId);
      if (!found) return h;
      const clone: RenderJob = {
        ...found,
        id: `${found.id}_retry_${Date.now().toString(36)}`,
        status: "queued",
        progress: 0,
        stage: RENDER_PIPELINE[0].label,
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

  return { queue, active, history, enqueue, cancel, retry, clearHistory };
}
